import asyncio
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Optional
from models.simulation import Simulation, AudienceDefinition, ProductDefinition, SimulationStatus
from core import simulation_engine, report_generator
from storage import store
from api.response import ok, err

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Request schemas ─────────────────────────────────────────────────────────

class CreateSimulationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    audience: AudienceDefinition
    product: ProductDefinition
    agent_count: int = Field(default=200, ge=10, le=500)
    random_seed: Optional[int] = Field(default=None, ge=0)


# ─── Simulations ─────────────────────────────────────────────────────────────

@router.post("/simulations")
async def create_simulation(req: CreateSimulationRequest):
    import random as _random
    sim = Simulation(
        name=req.name.strip(),
        audience=req.audience,
        product=req.product,
        agent_count=req.agent_count,
        random_seed=req.random_seed if req.random_seed is not None else _random.randint(0, 2**31 - 1),
    )
    store.save_simulation(sim)
    asyncio.create_task(simulation_engine.start_simulation(sim.id))
    return ok(sim.model_dump())


@router.get("/simulations")
def list_simulations():
    sims = store.list_simulations()
    return ok([s.model_dump() for s in sims])


@router.get("/simulations/{sim_id}")
def get_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    return ok(sim.model_dump())


@router.delete("/simulations/{sim_id}")
def delete_simulation(sim_id: str):
    if not store.delete_simulation(sim_id):
        return err("Simulation not found", 404)
    return ok({"deleted": True})


# ─── Control ─────────────────────────────────────────────────────────────────

@router.post("/simulations/{sim_id}/run")
async def run_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    if sim.status == SimulationStatus.PAUSED:
        simulation_engine.resume_simulation(sim_id)
    elif sim.status == SimulationStatus.RUNNING:
        await simulation_engine.run_propagation(sim_id)
    elif sim.status in (SimulationStatus.DRAFT, SimulationStatus.COMPLETE):
        await simulation_engine.start_simulation(sim_id)
    return ok({"started": True})


@router.post("/simulations/{sim_id}/pause")
def pause_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    simulation_engine.pause_simulation(sim_id)
    sim.status = SimulationStatus.PAUSED
    store.save_simulation(sim)
    return ok({"paused": True})


# ─── Graph ────────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/graph")
def get_graph(sim_id: str):
    graph = store.get_graph(sim_id)
    if not graph:
        return err("Graph not ready yet", 404)
    return ok(graph.model_dump())


# ─── Agents ──────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/agents")
def list_agents(sim_id: str, intent: str | None = None, limit: int = 50, offset: int = 0):
    all_agents = store.get_agents(sim_id)
    filtered = [a for a in all_agents if a.intent.value == intent] if intent else all_agents
    return ok({
        "total": len(filtered),
        "agents": [a.model_dump() for a in filtered[offset:offset + limit]],
    })


@router.get("/simulations/{sim_id}/agents/{agent_id}")
def get_agent(sim_id: str, agent_id: str):
    agent = store.get_agent(sim_id, agent_id)
    if not agent:
        return err("Agent not found", 404)
    return ok(agent.model_dump())


# ─── Report ───────────────────────────────────────────────────────────────────

@router.post("/simulations/{sim_id}/report")
async def generate_report(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    if sim.status not in (SimulationStatus.COMPLETE, SimulationStatus.RUNNING):
        return err("Simulation must be running or complete to generate report", 400)

    agents = store.get_agents(sim_id)
    report = await report_generator.generate_report(sim, agents)
    sim.report = report
    store.save_simulation(sim)
    return ok(report.model_dump())


@router.get("/simulations/{sim_id}/report")
def get_report(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    if not sim.report:
        return err("Report not generated yet", 404)
    return ok(sim.report.model_dump())


# ─── Export ───────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/export")
def export_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        return err("Simulation not found", 404)
    agents = store.get_agents(sim_id)
    graph = store.get_graph(sim_id)
    return ok({
        "simulation": sim.model_dump(),
        "agents": [a.model_dump() for a in agents],
        "graph": graph.model_dump() if graph else None,
        "metrics": sim.metrics.model_dump(),
        "report": sim.report.model_dump() if sim.report else None,
        "exported_at": datetime.utcnow().isoformat(),
    })


# ─── WebSocket ───────────────────────────────────────────────────────────────

@router.websocket("/ws/simulations/{sim_id}")
async def websocket_endpoint(websocket: WebSocket, sim_id: str):
    await websocket.accept()
    simulation_engine.register_ws(sim_id, websocket)
    try:
        sim = store.get_simulation(sim_id)
        if sim:
            await websocket.send_text(
                '{"type":"connected","status":"' + sim.status.value + '"}'
            )
        while True:
            await asyncio.sleep(30)
            await websocket.send_text('{"type":"ping"}')
    except WebSocketDisconnect:
        pass
    finally:
        simulation_engine.unregister_ws(sim_id, websocket)
