import json
import os
import logging
from pathlib import Path
from models.simulation import Simulation
from models.agent import Agent
from models.graph import GraphData

logger = logging.getLogger(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# In-memory stores
_simulations: dict[str, Simulation] = {}
_agents: dict[str, list[Agent]] = {}
_graphs: dict[str, GraphData] = {}
_adjacency: dict[str, dict[str, list[str]]] = {}


def save_simulation(sim: Simulation) -> None:
    _simulations[sim.id] = sim
    _persist_simulation(sim)


def get_simulation(sim_id: str) -> Simulation | None:
    return _simulations.get(sim_id)


def list_simulations() -> list[Simulation]:
    return sorted(_simulations.values(), key=lambda s: s.created_at, reverse=True)


def delete_simulation(sim_id: str) -> bool:
    if sim_id not in _simulations:
        return False
    del _simulations[sim_id]
    _agents.pop(sim_id, None)
    _graphs.pop(sim_id, None)
    _adjacency.pop(sim_id, None)
    return True


def save_agents(sim_id: str, agents: list[Agent]) -> None:
    _agents[sim_id] = agents


def get_agents(sim_id: str) -> list[Agent]:
    return _agents.get(sim_id, [])


def get_agent(sim_id: str, agent_id: str) -> Agent | None:
    return next((a for a in _agents.get(sim_id, []) if a.id == agent_id), None)


def save_graph(sim_id: str, graph: GraphData) -> None:
    _graphs[sim_id] = graph


def get_graph(sim_id: str) -> GraphData | None:
    return _graphs.get(sim_id)


def save_adjacency(sim_id: str, adjacency: dict[str, list[str]]) -> None:
    _adjacency[sim_id] = adjacency


def get_adjacency(sim_id: str) -> dict[str, list[str]]:
    return _adjacency.get(sim_id, {})


def _persist_simulation(sim: Simulation) -> None:
    try:
        path = DATA_DIR / f"{sim.id}.json"
        path.write_text(sim.model_dump_json(indent=2), encoding="utf-8")
    except Exception as e:
        logger.warning(f"Could not persist simulation {sim.id}: {e}")


def load_persisted_simulations() -> None:
    for path in DATA_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            sim = Simulation.model_validate(data)
            _simulations[sim.id] = sim
        except Exception as e:
            logger.warning(f"Could not load {path}: {e}")
