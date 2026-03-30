
from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.validators import validate_json_payload


class ValidationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type and request.method in ["POST", "PUT", "PATCH"]:
            body = await request.body()
            if body:
                is_valid, error = validate_json_payload(body)
                if not is_valid:
                    raise HTTPException(status_code=400, detail=error)

        response = await call_next(request)
        return response
