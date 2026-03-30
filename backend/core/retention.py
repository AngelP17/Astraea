import os
from datetime import datetime
from pathlib import Path

import structlog

logger = structlog.get_logger()

ARTIFACTS_DIR = Path("artifacts")
RETENTION_DAYS = int(os.environ.get("ARTIFACTS_RETENTION_DAYS", "30"))
MAX_REPLAYS = int(os.environ.get("MAX_REPLAYS", 1000))
MAX_DEMO_RESULTS = int(os.environ.get("MAX_DEMO_RESULTS", 500))


class RetentionPolicy:
    def __init__(
        self,
        artifacts_dir: Path = ARTIFACTS_DIR,
        retention_days: int = RETENTION_DAYS,
        max_replays: int = MAX_REPLAYS,
        max_demo_results: int = MAX_DEMO_RESULTS,
    ):
        self.artifacts_dir = artifacts_dir
        self.retention_days = retention_days
        self.max_replays = max_replays
        self.max_demo_results = max_demo_results

    def get_file_age_days(self, filepath: Path) -> int:
        stat = filepath.stat()
        mtime = datetime.fromtimestamp(stat.st_mtime)
        age = datetime.now() - mtime
        return age.days

    def should_delete_file(self, filepath: Path) -> bool:
        age = self.get_file_age_days(filepath)
        return age > self.retention_days

    def cleanup_old_artifacts(self) -> dict[str, int]:
        deleted = {"results": 0, "demo_results": 0, "replays": 0}

        results_dir = self.artifacts_dir / "results"
        if results_dir.exists():
            for f in results_dir.glob("*.json"):
                if self.should_delete_file(f):
                    f.unlink()
                    deleted["results"] += 1

        demo_dir = self.artifacts_dir / "demo_results"
        if demo_dir.exists():
            for f in demo_dir.glob("*.json"):
                if self.should_delete_file(f):
                    f.unlink()
                    deleted["demo_results"] += 1

        replays_dir = self.artifacts_dir / "replays"
        if replays_dir.exists():
            for f in replays_dir.glob("*.json"):
                if self.should_delete_file(f):
                    f.unlink()
                    deleted["replays"] += 1

        return deleted

    def enforce_count_limits(self) -> dict[str, int]:
        deleted = {"replays": 0, "demo_results": 0}

        replays_dir = self.artifacts_dir / "replays"
        if replays_dir.exists():
            replays = sorted(replays_dir.glob("*.json"), key=lambda f: f.stat().st_mtime)
            if len(replays) > self.max_replays:
                for old in replays[: len(replays) - self.max_replays]:
                    old.unlink()
                    deleted["replays"] += 1

        demo_dir = self.artifacts_dir / "demo_results"
        if demo_dir.exists():
            demos = sorted(demo_dir.glob("*.json"), key=lambda f: f.stat().st_mtime)
            if len(demos) > self.max_demo_results:
                for old in demos[: len(demos) - self.max_demo_results]:
                    old.unlink()
                    deleted["demo_results"] += 1

        return deleted

    def run_cleanup(self) -> dict[str, int]:
        age_deleted = self.cleanup_old_artifacts()
        count_deleted = self.enforce_count_limits()
        total = {
            "results": age_deleted["results"],
            "demo_results": age_deleted["demo_results"] + count_deleted["demo_results"],
            "replays": age_deleted["replays"] + count_deleted["replays"],
        }
        logger.info("artifacts_cleanup_complete", **total)
        return total


def get_retention_policy() -> RetentionPolicy:
    return RetentionPolicy(
        artifacts_dir=Path(os.environ.get("ARTIFACTS_DIR", "artifacts")),
        retention_days=int(os.environ.get("ARTIFACTS_RETENTION_DAYS", "30")),
        max_replays=int(os.environ.get("MAX_REPLAYS", "1000")),
        max_demo_results=int(os.environ.get("MAX_DEMO_RESULTS", "500")),
    )
