import { create } from "zustand";
import type { Simulation, SimulationMetrics, GraphData, GraphNode, NodeUpdate, OpinionEvent, Agent } from "../types";

interface SimulationStore {
  simulation: Simulation | null;
  graphData: GraphData | null;
  metrics: SimulationMetrics | null;
  currentTick: number;
  isRunning: boolean;
  generationProgress: number;
  generationPhase: string;
  liveFeedEvents: (OpinionEvent & { id: string })[];
  selectedAgentId: string | null;
  selectedAgent: Agent | null;
  colorMode: "intent" | "community";
  errorMessage: string | null;

  setSimulation: (sim: Simulation) => void;
  setGraphData: (data: GraphData) => void;
  applyNodeUpdates: (updates: NodeUpdate[]) => void;
  setMetrics: (metrics: SimulationMetrics) => void;
  setTick: (tick: number) => void;
  setIsRunning: (v: boolean) => void;
  setGenerationProgress: (phase: string, pct: number) => void;
  appendEvents: (events: OpinionEvent[]) => void;
  selectAgent: (id: string | null) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setColorMode: (mode: "intent" | "community") => void;
  setError: (msg: string | null) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationStore>((set) => ({
  simulation: null,
  graphData: null,
  metrics: null,
  currentTick: 0,
  isRunning: false,
  generationProgress: 0,
  generationPhase: "",
  liveFeedEvents: [],
  selectedAgentId: null,
  selectedAgent: null,
  colorMode: "intent",
  errorMessage: null,

  setSimulation: (sim) => set({ simulation: sim, metrics: sim.metrics, currentTick: sim.current_tick }),

  setGraphData: (data) => set({ graphData: data }),

  applyNodeUpdates: (updates) =>
    set((state) => {
      if (!state.graphData) return {};
      const updateMap = new Map(updates.map((u) => [u.id, u]));
      const newNodes: GraphNode[] = state.graphData.nodes.map((node) => {
        const upd = updateMap.get(node.id);
        if (!upd) return node;
        return {
          ...node,
          color: upd.color,
          score: upd.score,
          intent: upd.intent,
          ...(upd.size !== undefined && { size: upd.size }),
          ...(upd.is_influencer !== undefined && { is_influencer: upd.is_influencer }),
          ...(upd.community !== undefined && { community: upd.community }),
        };
      });
      return { graphData: { ...state.graphData, nodes: newNodes } };
    }),

  setMetrics: (metrics) => set({ metrics }),

  setTick: (tick) => set({ currentTick: tick }),

  setIsRunning: (v) => set({ isRunning: v }),

  setGenerationProgress: (phase, pct) =>
    set({ generationPhase: phase, generationProgress: pct }),

  appendEvents: (events) =>
    set((state) => {
      const tagged = events.map((e, i) => ({
        ...e,
        id: `${Date.now()}-${i}`,
      }));
      const all = [...tagged, ...state.liveFeedEvents].slice(0, 100);
      return { liveFeedEvents: all };
    }),

  selectAgent: (id) => set({ selectedAgentId: id, selectedAgent: null }),

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setColorMode: (mode) => set({ colorMode: mode }),

  setError: (msg) => set({ errorMessage: msg }),

  reset: () =>
    set({
      simulation: null,
      graphData: null,
      metrics: null,
      currentTick: 0,
      isRunning: false,
      generationProgress: 0,
      generationPhase: "",
      liveFeedEvents: [],
      selectedAgentId: null,
      selectedAgent: null,
      colorMode: "intent",
      errorMessage: null,
    }),
}));
