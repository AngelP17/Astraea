#!/usr/bin/env python3
"""Manual artifact cleanup script."""

import sys

sys.path.insert(0, "backend")

from core.retention import get_retention_policy

if __name__ == "__main__":
    policy = get_retention_policy()
    deleted = policy.run_cleanup()
    print(f"Cleanup complete: {deleted}")
