import asyncio
import functools
import logging
import random
from typing import Callable, Tuple, Type

logger = logging.getLogger(__name__)


def async_retry(
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
):
    """
    Decorator for async functions. Retries with exponential backoff + optional jitter.

    Usage:
        @async_retry(max_retries=4, initial_delay=1.0, exceptions=(RateLimitError,))
        async def call_api(): ...
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            delay = initial_delay
            last_exc: Exception = RuntimeError("No attempts made")
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    if attempt == max_retries:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts: {exc}"
                        )
                        raise
                    current_delay = min(delay, max_delay)
                    if jitter:
                        current_delay *= 0.5 + random.random()  # [0.5x, 1.5x]
                    logger.warning(
                        f"{func.__name__} attempt {attempt + 1}/{max_retries + 1} failed: {exc}. "
                        f"Retrying in {current_delay:.1f}s..."
                    )
                    await asyncio.sleep(current_delay)
                    delay = min(delay * backoff_factor, max_delay)
            raise last_exc  # unreachable but satisfies type checker
        return wrapper
    return decorator
