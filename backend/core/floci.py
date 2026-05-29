import json
import logging
from typing import Any

import httpx

from backend.core.config import settings

logger = logging.getLogger("astraea.floci")


class FlociClient:
    def __init__(self) -> None:
        self.enabled = settings.FLOCI_ENABLED
        self.base_url = settings.FLOCI_URL
        self.bucket = settings.FLOCI_BUCKET
        self.queue_url = settings.FLOCI_QUEUE_URL

    def check_availability(self) -> bool:
        """
        Check if the Floci local cloud server is reachable.
        """
        try:
            # LocalStack/Floci health endpoint is typically /_localstack/health or just GET base URL
            resp = httpx.get(f"{self.base_url}/_localstack/health", timeout=1.0)
            return resp.status_code == 200
        except Exception:
            try:
                # Fallback to GET base URL
                resp = httpx.get(self.base_url, timeout=1.0)
                return resp.status_code in (200, 403, 404, 405)
            except Exception:
                return False

    def write_audit_artifact(self, case_id: str, content: dict[str, Any]) -> bool:
        """
        Simulate writing an audit or evaluation artifact to S3 storage on Floci.
        """
        if not self.enabled:
            return False

        try:
            # 1. Ensure bucket exists by PUTing to it (S3 PUT bucket)
            httpx.put(f"{self.base_url}/{self.bucket}", timeout=2.0)
            
            # 2. PUT object to S3 (http://localhost:4566/bucket/key)
            url = f"{self.base_url}/{self.bucket}/{case_id}.json"
            headers = {"Content-Type": "application/json"}
            resp = httpx.put(url, content=json.dumps(content), headers=headers, timeout=2.0)
            if resp.status_code in (200, 201):
                logger.info("floci_write_success", case_id=case_id, bucket=self.bucket)
                return True
            logger.warning("floci_write_failed", status=resp.status_code, body=resp.text)
            return False
        except Exception as e:
            logger.error("floci_write_exception", error=str(e))
            return False

    def read_audit_artifact(self, case_id: str) -> dict[str, Any] | None:
        """
        Simulate reading an audit or evaluation artifact from S3 storage on Floci.
        """
        if not self.enabled:
            return None

        try:
            url = f"{self.base_url}/{self.bucket}/{case_id}.json"
            resp = httpx.get(url, timeout=2.0)
            if resp.status_code == 200:
                return resp.json()
            return None
        except Exception as e:
            logger.error("floci_read_exception", error=str(e))
            return None

    def send_ingest_event(self, event_data: dict[str, Any]) -> bool:
        """
        Simulate sending a telemetry event to a queue (SQS) on Floci.
        """
        if not self.enabled:
            return False

        try:
            # We send Action=SendMessage&MessageBody=event_data via standard query params or body
            # Create queue if it doesn't exist by making SQS request
            create_url = f"{self.base_url}/"
            params = {
                "Action": "CreateQueue",
                "QueueName": self.queue_url.split("/")[-1],
                "Version": "2012-11-05"
            }
            httpx.post(create_url, params=params, timeout=2.0)

            # Send message
            send_params = {
                "Action": "SendMessage",
                "MessageBody": json.dumps(event_data),
                "Version": "2012-11-05"
            }
            resp = httpx.post(self.queue_url, params=send_params, timeout=2.0)
            if resp.status_code == 200:
                logger.info("floci_queue_success", event_id=event_data.get("event_id"))
                return True
            return False
        except Exception as e:
            logger.error("floci_queue_exception", error=str(e))
            return False


floci_client = FlociClient()
