from __future__ import annotations

import argparse
import json

from backend.core.replay import ReplayStore


def main() -> None:
    parser = argparse.ArgumentParser(description="Replay a saved Astraea case")
    parser.add_argument("--case-id", required=True, help="Case ID, e.g. case_evt_001")
    args = parser.parse_args()

    store = ReplayStore()
    payload = store.load(args.case_id)
    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
