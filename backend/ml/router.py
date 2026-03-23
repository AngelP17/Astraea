from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Protocol
from functools import wraps
import time
import asyncio


class ModelTier(Enum):
    FAST = "fast"
    STANDARD = "standard"
    PREMIUM = "premium"


class ModelCapability(Enum):
    ANOMALY_DETECTION = "anomaly_detection"
    CLASSIFICATION = "classification"
    REGRESSION = "regression"
    RANKING = "ranking"


@dataclass
class ModelConfig:
    name: str
    tier: ModelTier
    capabilities: List[ModelCapability]
    max_latency_ms: float = 1000.0
    cost_weight: float = 1.0
    fallback_to: Optional[str] = None


@dataclass
class InferenceRequest:
    request_id: str
    model_name: str
    input_data: Dict[str, Any]
    preferred_tier: ModelTier
    required_capabilities: List[ModelCapability]
    timeout_ms: float = 5000.0


@dataclass
class InferenceResult:
    request_id: str
    model_name: str
    success: bool
    output: Any
    latency_ms: float
    tier_used: ModelTier
    error: Optional[str] = None
    fallback_used: bool = False


@dataclass
class RoutingDecision:
    model_name: str
    tier: ModelTier
    reasoning: List[str]
    estimated_latency_ms: float


class ModelRouter:
    DEFAULT_CONFIGS = {
        "fast_anomaly": ModelConfig(
            name="fast_anomaly",
            tier=ModelTier.FAST,
            capabilities=[ModelCapability.ANOMALY_DETECTION],
            max_latency_ms=100.0,
            cost_weight=0.3,
            fallback_to="standard_anomaly",
        ),
        "standard_anomaly": ModelConfig(
            name="standard_anomaly",
            tier=ModelTier.STANDARD,
            capabilities=[
                ModelCapability.ANOMALY_DETECTION,
                ModelCapability.CLASSIFICATION,
            ],
            max_latency_ms=500.0,
            cost_weight=0.6,
            fallback_to="premium_anomaly",
        ),
        "premium_anomaly": ModelConfig(
            name="premium_anomaly",
            tier=ModelTier.PREMIUM,
            capabilities=[
                ModelCapability.ANOMALY_DETECTION,
                ModelCapability.CLASSIFICATION,
                ModelCapability.RANKING,
            ],
            max_latency_ms=2000.0,
            cost_weight=1.0,
        ),
    }

    def __init__(self):
        self._models: Dict[str, ModelConfig] = self.DEFAULT_CONFIGS.copy()
        self._metrics: Dict[str, List[float]] = {}

    def register_model(self, config: ModelConfig):
        self._models[config.name] = config

    def route(self, request: InferenceRequest) -> RoutingDecision:
        suitable_models = []

        for name, config in self._models.items():
            if not any(
                cap in config.capabilities for cap in request.required_capabilities
            ):
                continue
            if (
                config.tier != request.preferred_tier
                and request.preferred_tier != ModelTier.STANDARD
            ):
                continue
            suitable_models.append((name, config))

        if not suitable_models:
            for name, config in self._models.items():
                if any(
                    cap in config.capabilities for cap in request.required_capabilities
                ):
                    suitable_models.append((name, config))

        if not suitable_models:
            fallback = list(self._models.values())[0]
            return RoutingDecision(
                model_name=fallback.name,
                tier=fallback.tier,
                reasoning=["No exact match - using default model"],
                estimated_latency_ms=fallback.max_latency_ms,
            )

        suitable_models.sort(key=lambda x: x[1].cost_weight)

        selected_name, selected_config = suitable_models[0]
        reasoning = [f"Selected {selected_name} ({selected_config.tier.value})"]

        if len(suitable_models) > 1:
            reasoning.append(
                f"Cheaper than alternatives: {[n for n, _ in suitable_models[1:]]}"
            )

        return RoutingDecision(
            model_name=selected_name,
            tier=selected_config.tier,
            reasoning=reasoning,
            estimated_latency_ms=selected_config.max_latency_ms,
        )

    def record_latency(self, model_name: str, latency_ms: float):
        if model_name not in self._metrics:
            self._metrics[model_name] = []
        self._metrics[model_name].append(latency_ms)
        if len(self._metrics[model_name]) > 1000:
            self._metrics[model_name] = self._metrics[model_name][-1000:]

    def get_model_health(self, model_name: str) -> Dict[str, Any]:
        if model_name not in self._metrics:
            return {"status": "unknown", "avg_latency_ms": None, "sample_count": 0}

        latencies = self._metrics[model_name]
        return {
            "status": "healthy",
            "avg_latency_ms": sum(latencies) / len(latencies) if latencies else 0,
            "max_latency_ms": max(latencies) if latencies else 0,
            "min_latency_ms": min(latencies) if latencies else 0,
            "sample_count": len(latencies),
        }


class ResilienceRouter:
    def __init__(self, router: ModelRouter, max_retries: int = 3):
        self.router = router
        self.max_retries = max_retries
        self._circuit_breakers: Dict[str, CircuitBreaker] = {}

    def get_circuit_breaker(self, model_name: str) -> "CircuitBreaker":
        if model_name not in self._circuit_breakers:
            self._circuit_breakers[model_name] = CircuitBreaker(model_name)
        return self._circuit_breakers[model_name]


class CircuitBreaker:
    def __init__(
        self, name: str, failure_threshold: int = 5, timeout_seconds: float = 30.0
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self._failure_count = 0
        self._last_failure_time: Optional[float] = None
        self._state = "closed"

    @property
    def state(self) -> str:
        if self._state == "open":
            if self._last_failure_time:
                if time.time() - self._last_failure_time > self.timeout_seconds:
                    self._state = "half_open"
            return self._state
        return self._state

    def record_success(self):
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self):
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self.failure_threshold:
            self._state = "open"

    def is_available(self) -> bool:
        return self.state != "open"


@dataclass
class RetryPolicy:
    max_attempts: int
    base_delay_ms: float
    max_delay_ms: float
    exponential_base: float = 2.0


def with_retry(policy: RetryPolicy, retryable_errors: Optional[List[type]] = None):
    _retryable_errors = retryable_errors or [Exception]

    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_error: Optional[Exception] = None
            for attempt in range(policy.max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if type(e) not in _retryable_errors:
                        raise
                    last_error = e
                    if attempt < policy.max_attempts - 1:
                        delay = min(
                            policy.base_delay_ms * (policy.exponential_base**attempt),
                            policy.max_delay_ms,
                        )
                        await asyncio.sleep(delay / 1000.0)
            if last_error:
                raise last_error

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_error: Optional[Exception] = None
            for attempt in range(policy.max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if type(e) not in _retryable_errors:
                        raise
                    last_error = e
                    if attempt < policy.max_attempts - 1:
                        delay = min(
                            policy.base_delay_ms * (policy.exponential_base**attempt),
                            policy.max_delay_ms,
                        )
                        time.sleep(delay / 1000.0)
            if last_error:
                raise last_error

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


DEFAULT_RETRY_POLICY = RetryPolicy(
    max_attempts=3,
    base_delay_ms=100.0,
    max_delay_ms=2000.0,
)
