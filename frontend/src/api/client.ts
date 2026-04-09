import type { Simulation, Agent, GraphData, SimulationReport, AudienceDefinition, ProductDefinition } from "../types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => null);
  // Unwrap ApiResponse envelope { success, data, error }
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) {
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return body.data as T;
  }
  // Fallback for non-enveloped responses
  if (!res.ok) {
    throw new Error(body ? JSON.stringify(body) : `HTTP ${res.status}`);
  }
  return body as T;
}

export const api = {
  createSimulation: (data: {
    name: string;
    audience: AudienceDefinition;
    product: ProductDefinition;
    agent_count: number;
  }) =>
    request<Simulation>("/simulations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listSimulations: () => request<Simulation[]>("/simulations"),

  getSimulation: (id: string) => request<Simulation>(`/simulations/${id}`),

  deleteSimulation: (id: string) =>
    request<{ ok: boolean }>(`/simulations/${id}`, { method: "DELETE" }),

  runSimulation: (id: string) =>
    request<{ ok: boolean }>(`/simulations/${id}/run`, { method: "POST" }),

  pauseSimulation: (id: string) =>
    request<{ ok: boolean }>(`/simulations/${id}/pause`, { method: "POST" }),

  getGraph: (id: string) => request<GraphData>(`/simulations/${id}/graph`),

  getAgent: (simId: string, agentId: string) =>
    request<Agent>(`/simulations/${simId}/agents/${agentId}`),

  listAgents: (simId: string, intent?: string) =>
    request<{ total: number; agents: Agent[] }>(
      `/simulations/${simId}/agents${intent ? `?intent=${intent}` : ""}`
    ),

  generateReport: (id: string) =>
    request<SimulationReport>(`/simulations/${id}/report`, { method: "POST" }),

  getReport: (id: string) => request<SimulationReport>(`/simulations/${id}/report`),

  exportSimulation: (id: string) => request<object>(`/simulations/${id}/export`),
};

export function createWsUrl(simId: string): string {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  // Remove trailing /api to get the base host, then build ws path
  const baseUrl = apiUrl.replace(/\/api\/?$/, "");
  const wsBase = baseUrl
    .replace("https://", "wss://")
    .replace("http://", "ws://");
  return `${wsBase}/api/ws/simulations/${simId}`;
}
