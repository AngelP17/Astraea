import time
from collections import defaultdict

import structlog

logger = structlog.get_logger()


class RateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: defaultdict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str) -> tuple[bool, int]:
        now = time.time()
        minute_ago = now - 60

        self.requests[key] = [t for t in self.requests[key] if t > minute_ago]

        if len(self.requests[key]) >= self.requests_per_minute:
            return False, 0

        self.requests[key].append(now)
        remaining = self.requests_per_minute - len(self.requests[key])
        return True, remaining


rate_limiter = RateLimiter()
strict_rate_limiter = RateLimiter(requests_per_minute=10)


def check_rate_limit(
    ip: str,
    authenticated: bool = False,
) -> tuple[bool, str]:
    limiter = strict_rate_limiter if authenticated else rate_limiter
    allowed, remaining = limiter.is_allowed(ip)

    if not allowed:
        logger.warning("rate_limit_exceeded", ip=ip, authenticated=authenticated)
        return False, "Rate limit exceeded. Please try again later."

    return True, ""
