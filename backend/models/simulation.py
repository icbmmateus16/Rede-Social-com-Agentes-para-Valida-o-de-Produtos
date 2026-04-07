from pydantic import BaseModel, Field, model_validator
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


class SimulationStatus(str, Enum):
    DRAFT = "draft"
    GENERATING = "generating"
    BUILDING = "building"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETE = "complete"
    ERROR = "error"


class AudienceDefinition(BaseModel):
    age_min: int = Field(default=18, ge=1, le=120)
    age_max: int = Field(default=65, ge=1, le=120)
    genders: list[str] = ["masculino", "feminino"]
    income_classes: list[str] = ["B"]
    cities: list[str] = ["São Paulo"]
    interests: list[str] = []
    custom_description: Optional[str] = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def age_range_valid(self) -> "AudienceDefinition":
        if self.age_min >= self.age_max:
            raise ValueError("age_min deve ser menor que age_max")
        return self


class ProductDefinition(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1, max_length=1000)
    price_brl: float = Field(..., ge=0)
    key_benefits: list[str] = []
    differentiators: list[str] = []


class SimulationMetrics(BaseModel):
    unaware_pct: float = 0.0
    aware_pct: float = 0.0
    considering_pct: float = 0.0
    rejected_pct: float = 0.0
    purchased_pct: float = 0.0
    avg_opinion_score: float = 0.0
    top_objections: list[str] = []
    top_motivators: list[str] = []
    estimated_conversion_rate: float = 0.0


class SimulationReport(BaseModel):
    executive_summary: str = ""
    segments: list[dict] = []
    top_objections: list[dict] = []
    recommendations: list[str] = []
    pricing_insight: str = ""
    generated_at: Optional[datetime] = None


class Simulation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    audience: AudienceDefinition
    product: ProductDefinition
    agent_count: int = 200
    propagation_ticks: int = 20
    status: SimulationStatus = SimulationStatus.DRAFT
    current_tick: int = 0
    metrics: SimulationMetrics = Field(default_factory=SimulationMetrics)
    report: Optional[SimulationReport] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    generation_progress: float = 0.0
