import asyncio
import json
import logging
from datetime import datetime
from fastapi import WebSocket
from models.simulation import Simulation, SimulationStatus
from models.agent import Agent
from core import agent_factory, graph_builder, opinion_model, report_generator
from storage import store
from config import TICK_DELAY_MS, PROPAGATION_TICKS

logger = logging.getLogger(__name__)

# Active WebSocket connections per simulation
_ws_connections: dict[str, list[WebSocket]] = {}
# Running simulation tasks
_running_tasks: dict[str, asyncio.Task] = {}
# Pause flags
_paused: dict[str, bool] = {}


def register_ws(sim_id: str, ws: WebSocket) -> None:
    _ws_connections.setdefault(sim_id, []).append(ws)


def unregister_ws(sim_id: str, ws: WebSocket) -> None:
    conns = _ws_connections.get(sim_id, [])
    if ws in conns:
        conns.remove(ws)


async def _broadcast(sim_id: str, message: dict) -> None:
    conns = _ws_connections.get(sim_id, [])
    dead = []
    for ws in conns:
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            dead.append(ws)
    for ws in dead:
        conns.remove(ws)


async def start_simulation(sim_id: str) -> None:
    """Start agent generation + graph building. Does NOT start propagation."""
    if sim_id in _running_tasks and not _running_tasks[sim_id].done():
        return
    task = asyncio.create_task(_generate_and_build(sim_id))
    _running_tasks[sim_id] = task


async def run_propagation(sim_id: str) -> None:
    """Start or resume propagation ticks. Called when user clicks 'Espalhar opiniões'."""
    sim = store.get_simulation(sim_id)
    if not sim:
        return
    # Allow starting propagation if paused or if ready (status == running but tick == 0)
    if sim.status == SimulationStatus.PAUSED:
        _paused[sim_id] = False
        return
    if sim.status in (SimulationStatus.RUNNING,):
        # Start propagation task if not already running
        task_key = f"{sim_id}_propagation"
        if task_key in _running_tasks and not _running_tasks[task_key].done():
            return
        task = asyncio.create_task(_run_propagation(sim_id))
        _running_tasks[task_key] = task


def pause_simulation(sim_id: str) -> None:
    _paused[sim_id] = True


def resume_simulation(sim_id: str) -> None:
    _paused[sim_id] = False


async def _generate_and_build(sim_id: str) -> None:
    """Phase 1 + 2: Generate agents and build graph. Then STOP and wait for user."""
    sim = store.get_simulation(sim_id)
    if not sim:
        return

    try:
        # Phase 1: Generate agents
        sim.status = SimulationStatus.GENERATING
        store.save_simulation(sim)

        async def progress_cb(phase: str, pct: float):
            sim.generation_progress = pct
            store.save_simulation(sim)
            await _broadcast(sim_id, {
                "type": "generation_progress",
                "phase": phase,
                "pct": round(pct, 1),
            })

        agents = await agent_factory.generate_agents(sim, progress_cb)
        store.save_agents(sim_id, agents)

        # Phase 2: Build graph
        sim.status = SimulationStatus.BUILDING
        store.save_simulation(sim)
        await _broadcast(sim_id, {"type": "generation_progress", "phase": "building_graph", "pct": 95.0})

        G, graph_data = graph_builder.build_graph(agents, seed=sim.random_seed)
        adjacency = graph_builder.graph_to_adjacency(G, agents)
        store.save_graph(sim_id, graph_data)
        store.save_adjacency(sim_id, adjacency)

        # Update node colors/data after opinions formed
        _sync_graph_with_agents(graph_data, agents)

        await _broadcast(sim_id, {
            "type": "graph_ready",
            "nodes": [n.model_dump() for n in graph_data.nodes],
            "edges": [e.model_dump() for e in graph_data.edges],
        })

        # Compute initial metrics and set status to RUNNING (ready for propagation)
        sim.metrics = report_generator.compute_metrics(agents)
        sim.status = SimulationStatus.RUNNING
        sim.generation_progress = 100.0
        sim.current_tick = 0
        store.save_simulation(sim)

        await _broadcast(sim_id, {
            "type": "metrics_update",
            "metrics": sim.metrics.model_dump(),
        })

        # STOP HERE - do NOT auto-start propagation.
        # The user must click "Espalhar opiniões" to trigger run_propagation().
        logger.info(f"Simulation {sim_id}: agents generated, graph built, awaiting user to start propagation.")

    except Exception as e:
        logger.exception(f"Simulation {sim_id} generation failed: {e}")
        sim = store.get_simulation(sim_id)
        if sim:
            sim.status = SimulationStatus.ERROR
            sim.error_message = str(e)
            store.save_simulation(sim)
        await _broadcast(sim_id, {"type": "error", "message": str(e)})


async def _run_propagation(sim_id: str) -> None:
    """Phase 3: Run propagation ticks. Called when user clicks 'Espalhar opiniões'."""
    sim = store.get_simulation(sim_id)
    if not sim:
        return

    try:
        agents = store.get_agents(sim_id)
        adjacency = store.get_adjacency(sim_id)
        graph_data = store.get_graph(sim_id)

        _paused[sim_id] = False
        start_tick = sim.current_tick

        for tick in range(start_tick, PROPAGATION_TICKS):
            # Check pause
            while _paused.get(sim_id, False):
                sim.status = SimulationStatus.PAUSED
                store.save_simulation(sim)
                await asyncio.sleep(0.1)

            sim.status = SimulationStatus.RUNNING

            events = opinion_model.run_tick(agents, adjacency, tick, seed=sim.random_seed)
            node_updates = opinion_model.build_node_updates(agents)

            # Sync graph data
            if graph_data:
                _sync_graph_with_agents(graph_data, agents)

            sim.current_tick = tick + 1
            sim.metrics = report_generator.compute_metrics(agents)
            store.save_simulation(sim)

            await _broadcast(sim_id, {
                "type": "tick_complete",
                "tick": tick + 1,
                "metrics": sim.metrics.model_dump(),
                "node_updates": node_updates,
                "events": events[:10],  # top 10 events per tick
            })

            await asyncio.sleep(TICK_DELAY_MS / 1000)

        # Simulation complete
        sim.status = SimulationStatus.COMPLETE
        sim.completed_at = datetime.utcnow()
        store.save_simulation(sim)

        await _broadcast(sim_id, {
            "type": "simulation_complete",
            "metrics": sim.metrics.model_dump(),
        })

    except Exception as e:
        logger.exception(f"Simulation {sim_id} propagation failed: {e}")
        sim = store.get_simulation(sim_id)
        if sim:
            sim.status = SimulationStatus.ERROR
            sim.error_message = str(e)
            store.save_simulation(sim)
        await _broadcast(sim_id, {"type": "error", "message": str(e)})


def _sync_graph_with_agents(graph_data, agents: list[Agent]) -> None:
    agent_map = {a.id: a for a in agents}
    from models.agent import INTENT_COLORS
    for node in graph_data.nodes:
        agent = agent_map.get(node.id)
        if agent:
            node.color = INTENT_COLORS[agent.intent]
            node.intent = agent.intent.value
            node.score = round(agent.opinion.score, 3)
            node.size = 5.0 + agent.influence_score * 15.0 + (5.0 if agent.is_influencer else 0.0)
            node.is_influencer = agent.is_influencer
            node.community = agent.community_id
