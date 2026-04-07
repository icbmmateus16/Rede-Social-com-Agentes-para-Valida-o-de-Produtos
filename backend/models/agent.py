from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid


class FunnelStage(str, Enum):
    UNAWARE = "unaware"
    AWARE = "aware"
    CONSIDERING = "considering"
    REJECTED = "rejected"
    PURCHASED = "purchased"


INTENT_COLORS = {
    FunnelStage.UNAWARE: "#52525b",      # Zinc 600
    FunnelStage.AWARE: "#3b82f6",        # Blue 500
    FunnelStage.CONSIDERING: "#eab308",  # Yellow 500
    FunnelStage.REJECTED: "#ef4444",     # Red 500
    FunnelStage.PURCHASED: "#22c55e",    # Green 500
}


def score_to_intent(score: float) -> FunnelStage:
    if score >= 0.7:
        return FunnelStage.PURCHASED
    if score >= 0.2:
        return FunnelStage.CONSIDERING
    if score >= -0.2:
        return FunnelStage.AWARE
    if score >= -0.6:
        return FunnelStage.UNAWARE
    return FunnelStage.REJECTED


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
    intent: FunnelStage = FunnelStage.UNAWARE

    influence_score: float = 0.0
    is_influencer: bool = False
    community_id: int = 0

    has_opinion: bool = False
    influenced_by: list[str] = []
    tick_of_change: int = 0
