import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from storage.store import load_persisted_simulations
from config import GROQ_API_KEY

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

app = FastAPI(title="Market Sim API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


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
