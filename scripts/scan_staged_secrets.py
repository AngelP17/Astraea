#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent

TEXT_EXTENSIONS = {
    ".py",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".env",
    ".example",
    ".md",
    ".sh",
    ".ini",
    ".cfg",
    ".conf",
}

SKIP_PATH_PARTS = {
    ".git",
    "node_modules",
    ".next",
    "__pycache__",
    ".venv",
    "venv",
}

ALLOWLIST_HINTS = (
    "change-me",
    "change_me",
    "changeme",
    "example",
    "sample",
    "placeholder",
    "dummy",
    "localhost",
    "127.0.0.1",
    "replace-me",
    "your-secret-key-change-in-production",
    "${{ secrets.",
    "${{ github.",
    "create_access_token(",
)

PATTERNS = [
    ("Private key block", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("AWS access key", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9_]{20,}\b")),
    ("Slack token", re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{10,}\b")),
    ("JWT token", re.compile(r"\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\b")),
    (
        "Generic credential assignment",
        re.compile(
            r"""(?ix)
            \b(
                api[_-]?key|
                access[_-]?token|
                refresh[_-]?token|
                secret|
                secret[_-]?key|
                password|
                passwd|
                private[_-]?key|
                client[_-]?secret
            )\b
            [^#\n]{0,30}
            (?:=|:)
            [^#\n]{0,10}
            ["']?([A-Za-z0-9/\+_=.-]{16,})["']?
            """
        ),
    ),
]


def run_git(*args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=REPO_ROOT, text=True)


def is_text_candidate(path: Path) -> bool:
    if any(part in SKIP_PATH_PARTS for part in path.parts):
        return False
    return path.suffix in TEXT_EXTENSIONS or path.name in {".env", ".env.example"}


def should_ignore_match(line: str) -> bool:
    lowered = line.lower()
    return any(hint in lowered for hint in ALLOWLIST_HINTS)


def staged_files() -> list[Path]:
    output = run_git("diff", "--cached", "--name-only", "--diff-filter=ACMR")
    return [Path(line.strip()) for line in output.splitlines() if line.strip()]


def repo_files() -> list[Path]:
    return [Path(line.strip()) for line in run_git("ls-files").splitlines() if line.strip()]


def read_staged_file(path: Path) -> str | None:
    try:
        return subprocess.check_output(
            ["git", "show", f":{path.as_posix()}"],
            cwd=REPO_ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError:
        return None


def read_repo_file(path: Path) -> str | None:
    candidate = REPO_ROOT / path
    try:
        return candidate.read_text()
    except (OSError, UnicodeDecodeError):
        return None


def scan_content(path: Path, content: str) -> list[str]:
    findings: list[str] = []
    for line_number, line in enumerate(content.splitlines(), start=1):
        if should_ignore_match(line):
            continue
        for label, pattern in PATTERNS:
            if pattern.search(line):
                findings.append(f"{path}:{line_number}: {label}")
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Block likely secrets before they reach git history."
    )
    parser.add_argument(
        "--all-files",
        action="store_true",
        help="Scan the full tracked repository instead of only staged files.",
    )
    args = parser.parse_args()

    files = repo_files() if args.all_files else staged_files()
    reader = read_repo_file if args.all_files else read_staged_file

    findings: list[str] = []
    for path in files:
        if not is_text_candidate(path):
            continue
        content = reader(path)
        if not content:
            continue
        findings.extend(scan_content(path, content))

    if findings:
        print(
            "Secret scan failed. Remove or redact these values before committing:\n",
            file=sys.stderr,
        )
        for finding in findings:
            print(f"  - {finding}", file=sys.stderr)
        print(
            "\nIf a value is intentionally fake, keep clear placeholder text such as "
            "'change-me-in-production' or move it to .env.example.",
            file=sys.stderr,
        )
        return 1

    scope = "repository" if args.all_files else "staged changes"
    print(f"Secret scan passed for {scope}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
