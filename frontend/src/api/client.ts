import type { Simulation, Agent, GraphData, SimulationReport, AudienceDefinition, ProductDefinition } from "../types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
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
