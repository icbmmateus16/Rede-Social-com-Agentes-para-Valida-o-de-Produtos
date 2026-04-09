export type FunnelStage = "unaware" | "aware" | "considering" | "rejected" | "purchased";
export type SimulationStatus = "draft" | "generating" | "building" | "running" | "paused" | "complete" | "error";

export interface PersonaProfile {
  age: number;
  gender: string;
  city: string;
  income_class: string;
  education: string;
  occupation: string;
  digital_savviness: number;
  risk_tolerance: number;
  brand_loyalty: number;
  interests: string[];
  pain_points: string[];
  values: string[];
  bio: string;
}

export interface OpinionState {
  score: number;
  confidence: number;
  reasoning: string;
  key_objection: string | null;
  price_sensitivity_score: number;
  history: number[];
}

export interface Agent {
  id: string;
  simulation_id: string;
  name: string;
  profile: PersonaProfile;
  opinion: OpinionState;
  intent: FunnelStage;
  influence_score: number;
  is_influencer: boolean;
  community_id: number;
  has_opinion: boolean;
  influenced_by: string[];
}

export interface SimulationMetrics {
  unaware_pct: number;
  aware_pct: number;
  considering_pct: number;
  rejected_pct: number;
  purchased_pct: number;
  avg_opinion_score: number;
  top_objections: string[];
  top_motivators: string[];
  estimated_conversion_rate: number;
  opinion_score_std: number;
  opinion_ci_low: number;
  opinion_ci_high: number;
}

export interface SimulationReport {
  executive_summary: string;
  segments: { name: string; description: string; size_pct: number }[];
  top_objections: { objection: string; frequency: string; suggested_response: string }[];
  recommendations: string[];
  pricing_insight: string;
  generated_at: string;
  generation_passes: number;
}

export interface Simulation {
  id: string;
  name: string;
  audience: AudienceDefinition;
  product: ProductDefinition;
  agent_count: number;
  propagation_ticks: number;
  status: SimulationStatus;
  current_tick: number;
  metrics: SimulationMetrics;
  report: SimulationReport | null;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  generation_progress: number;
}

export interface AudienceDefinition {
  age_min: number;
  age_max: number;
  genders: string[];
  income_classes: string[];
  cities: string[];
  interests: string[];
  custom_description?: string;
}

export interface ProductDefinition {
  name: string;
  category: string;
  description: string;
  price_brl: number;
  key_benefits: string[];
  differentiators: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  community: number;
  intent: FunnelStage;
  score: number;
  is_influencer: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface NodeUpdate {
  id: string;
  color: string;
  score: number;
  intent: FunnelStage;
  size?: number;
  is_influencer?: boolean;
  community?: number;
}

export interface OpinionEvent {
  agent_id: string;
  agent_name: string;
  from_intent: FunnelStage;
  to_intent: FunnelStage;
  from_score: number;
  to_score: number;
  influenced_by: string[];
  tick: number;
}

export type WsMessage =
  | { type: "connected"; status: SimulationStatus }
  | { type: "generation_progress"; phase: string; pct: number }
  | { type: "graph_ready"; nodes: GraphNode[]; edges: GraphEdge[] }
  | { type: "metrics_update"; metrics: SimulationMetrics }
  | { type: "tick_complete"; tick: number; metrics: SimulationMetrics; node_updates: NodeUpdate[]; events: OpinionEvent[] }
  | { type: "simulation_complete"; metrics: SimulationMetrics }
  | { type: "error"; message: string }
  | { type: "ping" };

export const INTENT_COLORS: Record<FunnelStage, string> = {
  unaware: "#52525b",
  aware: "#3b82f6",
  considering: "#eab308",
  rejected: "#ef4444",
  purchased: "#22c55e",
};

export const COMMUNITY_COLORS = [
  "#3b82f6", "#a78bfa", "#f97316", "#ec4899",
  "#06b6d4", "#84cc16", "#f59e0b", "#10b981",
];

export const INTENT_LABELS: Record<FunnelStage, string> = {
  unaware: "Desconhece",
  aware: "Consciente",
  considering: "Considerando",
  rejected: "Rejeitou",
  purchased: "Comprou",
};
