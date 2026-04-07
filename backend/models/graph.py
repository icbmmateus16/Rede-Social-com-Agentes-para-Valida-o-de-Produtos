from pydantic import BaseModel


class GraphNode(BaseModel):
    id: str
    label: str
    x: float = 0.0
    y: float = 0.0
    size: float = 6.0
    color: str = "#eab308"
    community: int = 0
    intent: str = "neutral"
    score: float = 0.0
    is_influencer: bool = False


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    weight: float = 1.0


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
