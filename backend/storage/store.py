import json
import logging
from pathlib import Path
from models.simulation import Simulation
from models.agent import Agent
from models.graph import GraphData

logger = logging.getLogger(__name__)

# Absolute path relative to this file — works regardless of CWD
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

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

    # Remove persisted files from disk so they don't resurrect on restart
    for fname in (f"{sim_id}.json", f"{sim_id}_events.jsonl"):
        fpath = DATA_DIR / fname
        try:
            fpath.unlink(missing_ok=True)
        except Exception as e:
            logger.warning(f"Could not delete {fpath}: {e}")

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
    """Write simulation atomically: temp file → rename (avoids corrupt state on crash)."""
    try:
        path = DATA_DIR / f"{sim.id}.json"
        tmp_path = path.with_suffix(".tmp")
        tmp_path.write_text(sim.model_dump_json(indent=2), encoding="utf-8")
        tmp_path.replace(path)  # atomic on POSIX, near-atomic on Windows
    except Exception as e:
        logger.warning(f"Could not persist simulation {sim.id}: {e}")


def load_persisted_simulations() -> None:
    """Load all simulation JSON files on startup. Quarantine corrupt files."""
    bad_dir = DATA_DIR / "corrupt"
    for path in DATA_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            sim = Simulation.model_validate(data)
            _simulations[sim.id] = sim
            logger.info(f"Loaded simulation {sim.id} ({sim.name!r})")
        except Exception as e:
            logger.warning(f"Corrupt simulation file {path.name}: {e}. Moving to corrupt/")
            bad_dir.mkdir(exist_ok=True)
            try:
                path.rename(bad_dir / path.name)
            except Exception as rename_err:
                logger.error(f"Could not quarantine {path.name}: {rename_err}")
