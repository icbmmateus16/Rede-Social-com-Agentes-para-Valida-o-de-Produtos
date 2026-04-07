from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid


class PurchaseIntent(str, Enum):
    STRONG_BUY = "strong_buy"
    LIKELY_BUY = "likely_buy"
    NEUTRAL = "neutral"
    UNLIKELY = "unlikely"
    REJECT = "reject"


INTENT_COLORS = {
    PurchaseIntent.STRONG_BUY: "#22c55e",
    PurchaseIntent.LIKELY_BUY: "#86efac",
    PurchaseIntent.NEUTRAL: "#eab308",
    PurchaseIntent.UNLIKELY: "#f97316",
    PurchaseIntent.REJECT: "#ef4444",
}


def score_to_intent(score: float) -> PurchaseIntent:
    if score >= 0.6:
        return PurchaseIntent.STRONG_BUY
    if score >= 0.2:
        return PurchaseIntent.LIKELY_BUY
    if score >= -0.2:
        return PurchaseIntent.NEUTRAL
    if score >= -0.6:
        return PurchaseIntent.UNLIKELY
    return PurchaseIntent.REJECT


class PersonaProfile(BaseModel):
    age: int
    gender: str
    city: str
    income_class: str
    education: str
    occupation: str
    digital_savviness: float = 0.5
    risk_tolerance: float = 0.5
    brand_loyalty: float = 0.5
    interests: list[str] = []
    pain_points: list[str] = []
    values: list[str] = []
    bio: str = ""


class OpinionState(BaseModel):
    score: float = 0.0
    confidence: float = 0.5
    reasoning: str = ""
    key_objection: Optional[str] = None
    price_sensitivity_score: float = 0.5
    history: list[float] = []


class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    simulation_id: str
    name: str
    profile: PersonaProfile
    opinion: OpinionState = Field(default_factory=OpinionState)
    intent: PurchaseIntent = PurchaseIntent.NEUTRAL

    influence_score: float = 0.0
    is_influencer: bool = False
    community_id: int = 0

    has_opinion: bool = False
    influenced_by: list[str] = []
    tick_of_change: int = 0
