from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


class ReplayStore:
    def __init__(self, directory: str = "artifacts/replays") -> None:
        self.base_path = Path(directory)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, case_id: str, payload: Dict[str, Any]) -> Path:
        path = self.base_path / f"{case_id}.json"
        path.write_text(json.dumps(payload, indent=2))
        return path

    def load(self, case_id: str) -> Dict[str, Any]:
        path = self.base_path / f"{case_id}.json"
        if not path.exists():
            raise FileNotFoundError(f"Replay not found for {case_id}")
        return json.loads(path.read_text())
