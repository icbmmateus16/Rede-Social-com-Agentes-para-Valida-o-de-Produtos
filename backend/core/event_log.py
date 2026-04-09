import json
import logging
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent / "data"


class SimulationEventLog:
    """Appends structured JSONL events for a simulation — one line per event."""

    def __init__(self, sim_id: str) -> None:
        self._path = DATA_DIR / f"{sim_id}_events.jsonl"
        DATA_DIR.mkdir(parents=True, exist_ok=True)

    def log(self, event_type: str, **fields) -> None:
        entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "type": event_type,
            **fields,
        }
        try:
            with open(self._path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.warning(f"SimulationEventLog write error: {e}")
