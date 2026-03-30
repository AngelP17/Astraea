import json
from typing import Any

import structlog

logger = structlog.get_logger()

MAX_PAYLOAD_SIZE = 10 * 1024 * 1024


def validate_json_payload(data: Any, max_size: int = MAX_PAYLOAD_SIZE) -> tuple[bool, str]:
    if data is None:
        return False, "Empty request body"

    try:
        if isinstance(data, (str, bytes)):
            if len(data) > max_size:
                return False, f"Payload too large. Maximum size is {max_size / 1024 / 1024}MB"
            if isinstance(data, str):
                json.loads(data)
            return True, ""
        return True, ""
    except json.JSONDecodeError as e:
        return False, f"Invalid JSON: {str(e)}"


def validate_case_id(case_id: str) -> tuple[bool, str]:
    if not case_id:
        return False, "case_id is required"

    if len(case_id) > 100:
        return False, "case_id too long"

    allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-")
    if not all(c in allowed_chars for c in case_id):
        return False, "case_id contains invalid characters"

    return True, ""


def validate_event_data(data: dict) -> tuple[bool, list[str]]:
    errors = []

    required_fields = ["event", "features", "assessment", "prioritized_case", "decision", "audit"]
    for field in required_fields:
        if field not in data:
            errors.append(f"Missing required field: {field}")

    if "event" in data:
        event = data["event"]
        if not isinstance(event.get("event_id"), str):
            errors.append("event.event_id must be a string")
        if not isinstance(event.get("machine_id"), str):
            errors.append("event.machine_id must be a string")

    return len(errors) == 0, errors


def sanitize_path(path: str) -> str:
    path = path.replace("..", "").replace("//", "/")
    return path.strip("/")
