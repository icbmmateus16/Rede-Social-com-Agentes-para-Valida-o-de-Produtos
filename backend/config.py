import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

AGENT_COUNT = int(os.getenv("AGENT_COUNT", "200"))
PROPAGATION_TICKS = int(os.getenv("PROPAGATION_TICKS", "20"))
TICK_DELAY_MS = int(os.getenv("TICK_DELAY_MS", "600"))

SOCIAL_PRESSURE_WEIGHT = float(os.getenv("SOCIAL_PRESSURE_WEIGHT", "0.35"))
INFLUENCER_TOP_PCT = float(os.getenv("INFLUENCER_TOP_PCT", "0.05"))
GRAPH_K_NEIGHBORS = int(os.getenv("GRAPH_K_NEIGHBORS", "6"))
GRAPH_REWIRE_PROB = float(os.getenv("GRAPH_REWIRE_PROB", "0.15"))
# Opinion model tuning
CONFIDENCE_DECAY_RATE = float(os.getenv("CONFIDENCE_DECAY_RATE", "0.02"))
