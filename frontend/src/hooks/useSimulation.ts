import { useEffect, useRef } from "react";
import { useSimulationStore } from "../store/simulationStore";
import { createWsUrl, api } from "../api/client";
import type { WsMessage } from "../types";

export function useSimulation(simId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const store = useSimulationStore();

  useEffect(() => {
    if (!simId) return;

    // Load initial simulation state
    api.getSimulation(simId).then((sim) => {
      store.setSimulation(sim);
    }).catch(() => {
      window.location.href = "/";
    });

    // Connect WebSocket
    const ws = new WebSocket(createWsUrl(simId));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);

      if (msg.type === "connected") {
        store.setError(null);
        // Refresh the simulation to get current status
        api.getSimulation(simId).then(store.setSimulation);
      } else if (msg.type === "generation_progress") {
        store.setGenerationProgress(msg.phase, msg.pct);
      } else if (msg.type === "graph_ready") {
        store.setGraphData({ nodes: msg.nodes, edges: msg.edges });
        // Refresh simulation to get the updated status (now 'running')
        api.getSimulation(simId).then(store.setSimulation);
      } else if (msg.type === "metrics_update") {
        store.setMetrics(msg.metrics);
      } else if (msg.type === "tick_complete") {
        store.setIsRunning(true);
        store.applyNodeUpdates(msg.node_updates);
        store.setMetrics(msg.metrics);
        store.setTick(msg.tick);
        if (msg.events && msg.events.length > 0) {
          store.appendEvents(msg.events);
        }
      } else if (msg.type === "simulation_complete") {
        store.setMetrics(msg.metrics);
        store.setIsRunning(false);
        // Refresh sim state
        api.getSimulation(simId).then(store.setSimulation);
      } else if (msg.type === "error") {
        console.error("Simulation error:", msg.message);
        store.setIsRunning(false);
        store.setError(msg.message);
      }
    };

    ws.onopen = () => {
      // Connection established — state will be driven by WS messages
      console.log("[WS] connected to simulation", simId);
    };

    ws.onclose = () => {
      console.log("[WS] disconnected from simulation", simId);
    };

    // Load graph if already built
    api.getGraph(simId).then(store.setGraphData).catch(() => {});

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [simId]);

  const run = () => simId && api.runSimulation(simId);
  const pause = () => simId && api.pauseSimulation(simId);

  return { run, pause };
}
