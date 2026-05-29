import json
from unittest.mock import patch

import httpx

from backend.core.floci import FlociClient


def test_floci_disabled_by_default():
    """
    Ensure the Floci client honors the enabled setting.
    """
    client = FlociClient()
    client.enabled = False
    
    assert client.write_audit_artifact("case_smoke_001", {"test": "data"}) is False
    assert client.read_audit_artifact("case_smoke_001") is None
    assert client.send_ingest_event({"event_id": "evt_smoke"}) is False


@patch("httpx.put")
def test_floci_write_audit_artifact(mock_put):
    """
    Ensure writing audit artifacts issues correct S3 PUT calls.
    """
    client = FlociClient()
    client.enabled = True
    client.bucket = "smoke-bucket"
    client.base_url = "http://localhost:4566"

    # Mock bucket creation (PUT bucket) and object placement (PUT object)
    mock_put.return_value = httpx.Response(200, json={})

    content = {"case_id": "case_smoke_001", "deterministic_hash": "sha256:smoke"}
    success = client.write_audit_artifact("case_smoke_001", content)

    assert success is True
    # Two calls: 1 to bucket URL, 1 to object URL
    assert mock_put.call_count == 2
    
    # Check S3 object PUT details
    call_args = mock_put.call_args_list[1]
    url = call_args[0][0]
    headers = call_args[1].get("headers", {})
    body = call_args[1].get("content", "")

    assert url == "http://localhost:4566/smoke-bucket/case_smoke_001.json"
    assert headers["Content-Type"] == "application/json"
    assert "sha256:smoke" in body


@patch("httpx.get")
def test_floci_read_audit_artifact(mock_get):
    """
    Ensure reading audit artifacts fetches JSON from S3.
    """
    client = FlociClient()
    client.enabled = True
    client.bucket = "smoke-bucket"
    client.base_url = "http://localhost:4566"

    mock_get.return_value = httpx.Response(
        200, 
        content=json.dumps({"case_id": "case_smoke_001", "verified": True})
    )

    result = client.read_audit_artifact("case_smoke_001")

    assert result is not None
    assert result["case_id"] == "case_smoke_001"
    assert result["verified"] is True
    
    mock_get.assert_called_once_with(
        "http://localhost:4566/smoke-bucket/case_smoke_001.json",
        timeout=2.0
    )


@patch("httpx.post")
def test_floci_send_ingest_event(mock_post):
    """
    Ensure sending telemetry sends SQS SendMessage POST.
    """
    client = FlociClient()
    client.enabled = True
    client.base_url = "http://localhost:4566"
    client.queue_url = "http://localhost:4566/000000000000/smoke-queue"

    mock_post.return_value = httpx.Response(
        200, content="<SendMessageResponse>...</SendMessageResponse>"
    )

    event = {"event_id": "evt_smoke_123", "machine_id": "motor_01"}
    success = client.send_ingest_event(event)

    assert success is True
    # Two calls: 1 to SQS CreateQueue, 1 to SQS SendMessage
    assert mock_post.call_count == 2
    
    # Check SQS SendMessage POST details
    call_args = mock_post.call_args_list[1]
    url = call_args[0][0]
    params = call_args[1].get("params", {})

    assert url == "http://localhost:4566/000000000000/smoke-queue"
    assert params["Action"] == "SendMessage"
    assert "evt_smoke_123" in params["MessageBody"]
