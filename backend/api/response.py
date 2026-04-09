from typing import TypeVar, Generic, Optional, Any
from pydantic import BaseModel
from fastapi.responses import JSONResponse

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None


def ok(data: Any) -> dict:
    """Return a successful response dict. FastAPI serializes it automatically."""
    return {"success": True, "data": data, "error": None}


def err(message: str, status_code: int = 400) -> JSONResponse:
    """Return a FastAPI JSONResponse with error envelope."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "data": None, "error": message},
    )
