import json
import re
import logging
from groq import AsyncGroq
from groq import RateLimitError, APIStatusError, APIConnectionError
from config import GROQ_API_KEY, GROQ_MODEL
from llm.retry import async_retry

logger = logging.getLogger(__name__)

_client: AsyncGroq | None = None


def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=GROQ_API_KEY)
    return _client


@async_retry(
    max_retries=4,
    initial_delay=1.0,
    max_delay=60.0,
    backoff_factor=2.0,
    jitter=True,
    exceptions=(RateLimitError, APIStatusError, APIConnectionError, Exception),
)
async def complete(prompt: str, max_tokens: int = 4096) -> str:
    """Call Groq API with automatic exponential-backoff retry."""
    client = get_client()
    response = await client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
        temperature=0.8,
    )
    return response.choices[0].message.content or ""


def extract_json(text: str) -> str:
    text = text.strip()
    # Remove markdown code fences
    text = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    # Try direct parse first — LLM may already return clean JSON
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass
    # Bracket-counting scan: correctly handles nested structures and strings
    for start_char, end_char in [("[", "]"), ("{", "}")]:
        start = text.find(start_char)
        if start == -1:
            continue
        depth = 0
        in_string = False
        escape_next = False
        for i, ch in enumerate(text[start:], start=start):
            if escape_next:
                escape_next = False
                continue
            if ch == "\\" and in_string:
                escape_next = True
                continue
            if ch == '"':
                in_string = not in_string
                continue
            if in_string:
                continue
            if ch == start_char:
                depth += 1
            elif ch == end_char:
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
    return text


def parse_json_array(text: str) -> list:
    cleaned = extract_json(text)
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict):
            return [result]
        return []
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nText: {cleaned[:500]}")
        return []


def parse_json_object(text: str) -> dict:
    cleaned = extract_json(text)
    try:
        result = json.loads(cleaned)
        if isinstance(result, dict):
            return result
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nText: {cleaned[:500]}")
        return {}
