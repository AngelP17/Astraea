from __future__ import annotations

from fastapi.testclient import TestClient

from backend.api.main import app
from backend.ingestion.normalizer import normalize_event


def _sample_event(event_id: str = "evt_demo_001") -> object:
    return normalize_event(
        {
            "event_id": event_id,
            "machine_id": "press_07",
            "line_id": "line_2",
            "event_type": "vibration_spike",
            "timestamp": "2026-03-23T02:13:00Z",
            "raw_values": {
                "vibration_rms": 12.4,
                "vibration_peak": 28.7,
                "temperature_c": 78.3,
                "current_amps": 14.2,
                "rpm": 1750.0,
            },
            "source": "sensor_gateway",
            "metadata": {"duration_seconds": 120},
        }
    )


def test_public_demo_endpoints_work_without_login(monkeypatch, tmp_path) -> None:
    monkeypatch.chdir(tmp_path)

    demo_events = [_sample_event("evt_demo_001")]
    synthetic_events = [_sample_event(f"evt_demo_{index:03d}") for index in range(1, 101)]

    def fake_load_events(path: str = "data/sample_events.json") -> list[object]:
        return synthetic_events if "synthetic_events_100" in path else demo_events

    async def fake_streaming_demo(*args, **kwargs):
        del args, kwargs
        yield {
            "stage": 0,
            "stage_name": "event_capture",
            "stage_label": "SIGNAL_ENTRY",
            "event_id": "evt_demo_001",
            "case_id": "case_evt_demo_001",
            "partial_result": {"event": demo_events[0].to_dict()},
            "completed": False,
            "timestamp": "2026-03-30T00:00:00Z",
        }
        yield {
            "stage": 7,
            "stage_name": "complete",
            "stage_label": "DONE",
            "event_id": "evt_demo_001",
            "case_id": "case_evt_demo_001",
            "partial_result": {"event": demo_events[0].to_dict()},
            "completed": True,
            "timestamp": "2026-03-30T00:00:01Z",
        }

    monkeypatch.setattr("backend.api.main.load_events", fake_load_events)
    monkeypatch.setattr("backend.api.main.run_streaming_demo", fake_streaming_demo)
    monkeypatch.setattr("backend.api.main.replay_store.save", lambda *args, **kwargs: None)
    monkeypatch.setattr("backend.api.main.DB_AVAILABLE", False)

    client = TestClient(app)

    cases = client.get("/api/cases")
    assert cases.status_code == 200
    assert cases.status_code != 401

    run = client.post("/api/run")
    assert run.status_code == 200
    assert run.json()["case_id"]

    demo = client.post("/api/demo")
    assert demo.status_code == 200
    assert demo.json()["count"] == 100

    stream = client.get("/api/demo/stream")
    assert stream.status_code == 200
    assert "text/event-stream" in stream.headers.get("content-type", "")
    assert "event: stage" in stream.text

    admin = client.post("/api/admin/cleanup")
    assert admin.status_code == 401
