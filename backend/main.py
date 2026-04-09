import logging
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from api.routes import router
from storage.store import load_persisted_simulations
from config import GROQ_API_KEY
from core.logger import setup_logging

setup_logging()

app = FastAPI(title="Market Sim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"success": False, "error": str(exc.errors()), "data": None},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "data": None},
    )


@app.on_event("startup")
async def startup():
    if not GROQ_API_KEY:
        logging.critical(
            "GROQ_API_KEY não está definida. "
            "Configure-a no arquivo .env ou como variável de ambiente. Encerrando."
        )
        sys.exit(1)
    load_persisted_simulations()


@app.get("/health")
def health():
    return {"status": "ok"}
