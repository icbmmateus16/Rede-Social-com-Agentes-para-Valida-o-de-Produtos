import asyncio
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from models.simulation import Simulation, AudienceDefinition, ProductDefinition, SimulationStatus
from core import simulation_engine, report_generator
from storage import store

logger = logging.getLogger(__name__)
router = APIRouter()


# ─── Request schemas ─────────────────────────────────────────────────────────

class CreateSimulationRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    audience: AudienceDefinition
    product: ProductDefinition
    agent_count: int = Field(default=200, ge=10, le=500)


# ─── Simulations ─────────────────────────────────────────────────────────────

@router.post("/simulations")
async def create_simulation(req: CreateSimulationRequest):
    sim = Simulation(
        name=req.name,
        audience=req.audience,
        product=req.product,
        agent_count=req.agent_count,
    )
    store.save_simulation(sim)
    # Start async generation immediately
    asyncio.create_task(simulation_engine.start_simulation(sim.id))
    return sim


@router.get("/simulations")
def list_simulations():
    return store.list_simulations()


@router.get("/simulations/{sim_id}")
def get_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    return sim


@router.delete("/simulations/{sim_id}")
def delete_simulation(sim_id: str):
    if not store.delete_simulation(sim_id):
        raise HTTPException(404, "Simulation not found")
    return {"ok": True}


# ─── Control ─────────────────────────────────────────────────────────────────

@router.post("/simulations/{sim_id}/run")
async def run_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    if sim.status == SimulationStatus.PAUSED:
        simulation_engine.resume_simulation(sim_id)
    elif sim.status == SimulationStatus.RUNNING:
        # Graph is ready, user clicked "Espalhar opiniões" → start propagation
        await simulation_engine.run_propagation(sim_id)
    elif sim.status in (SimulationStatus.DRAFT, SimulationStatus.COMPLETE):
        await simulation_engine.start_simulation(sim_id)
    return {"ok": True}


@router.post("/simulations/{sim_id}/pause")
def pause_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    simulation_engine.pause_simulation(sim_id)
    sim.status = SimulationStatus.PAUSED
    store.save_simulation(sim)
    return {"ok": True}


# ─── Graph ────────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/graph")
def get_graph(sim_id: str):
    graph = store.get_graph(sim_id)
    if not graph:
        raise HTTPException(404, "Graph not ready yet")
    return graph


# ─── Agents ──────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/agents")
def list_agents(sim_id: str, intent: str | None = None, limit: int = 50, offset: int = 0):
    all_agents = store.get_agents(sim_id)
    filtered = [a for a in all_agents if a.intent.value == intent] if intent else all_agents
    return {
        "total": len(filtered),
        "agents": filtered[offset:offset + limit],
    }


@router.get("/simulations/{sim_id}/agents/{agent_id}")
def get_agent(sim_id: str, agent_id: str):
    agent = store.get_agent(sim_id, agent_id)
    if not agent:
        raise HTTPException(404, "Agent not found")
    return agent


# ─── Report ───────────────────────────────────────────────────────────────────

@router.post("/simulations/{sim_id}/report")
async def generate_report(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    if sim.status not in (SimulationStatus.COMPLETE, SimulationStatus.RUNNING):
        raise HTTPException(400, "Simulation must be running or complete to generate report")

    agents = store.get_agents(sim_id)
    report = await report_generator.generate_report(sim, agents)
    sim.report = report
    store.save_simulation(sim)
    return report


@router.get("/simulations/{sim_id}/report")
def get_report(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    if not sim.report:
        raise HTTPException(404, "Report not generated yet")
    return sim.report


# ─── Export ───────────────────────────────────────────────────────────────────

@router.get("/simulations/{sim_id}/export")
def export_simulation(sim_id: str):
    sim = store.get_simulation(sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    agents = store.get_agents(sim_id)
    graph = store.get_graph(sim_id)
    return {
        "simulation": sim.model_dump(),
        "agents": [a.model_dump() for a in agents],
        "graph": graph.model_dump() if graph else None,
        "metrics": sim.metrics.model_dump(),
        "report": sim.report.model_dump() if sim.report else None,
        "exported_at": datetime.utcnow().isoformat(),
    }


# ─── WebSocket ───────────────────────────────────────────────────────────────

@router.websocket("/ws/simulations/{sim_id}")
async def websocket_endpoint(websocket: WebSocket, sim_id: str):
    await websocket.accept()
    simulation_engine.register_ws(sim_id, websocket)
    try:
        # Send current state immediately on connect
        sim = store.get_simulation(sim_id)
        if sim:
            await websocket.send_text(
                '{"type":"connected","status":"' + sim.status.value + '"}'
            )
        while True:
            # Keep connection alive
            await asyncio.sleep(30)
            await websocket.send_text('{"type":"ping"}')
    except WebSocketDisconnect:
        pass
    finally:
        simulation_engine.unregister_ws(sim_id, websocket)
