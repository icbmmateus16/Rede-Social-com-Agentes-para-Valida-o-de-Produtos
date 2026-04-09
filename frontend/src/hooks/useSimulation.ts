import { useEffect, useRef, useCallback } from "react";
import { useSimulationStore } from "../store/simulationStore";
import { createWsUrl, api } from "../api/client";
import type { WsMessage } from "../types";

const MAX_RETRIES = 6;

export function useSimulation(simId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const store = useSimulationStore();

  const connect = useCallback(() => {
    if (!simId || !mountedRef.current) return;

    const ws = new WebSocket(createWsUrl(simId));
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      store.setError(null);
      console.log("[WS] connected to simulation", simId);
    };

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);

      if (msg.type === "connected") {
        store.setError(null);
        api.getSimulation(simId).then(store.setSimulation).catch(() => {});
      } else if (msg.type === "generation_progress") {
        store.setGenerationProgress(msg.phase, msg.pct);
      } else if (msg.type === "graph_ready") {
        store.setGraphData({ nodes: msg.nodes, edges: msg.edges });
        api.getSimulation(simId).then(store.setSimulation).catch(() => {});
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
        api.getSimulation(simId).then(store.setSimulation).catch(() => {});
      } else if (msg.type === "error") {
        console.error("Simulation error:", msg.message);
        store.setIsRunning(false);
        store.setError(msg.message);
      }
    };

    ws.onerror = () => {
      // Triggers onclose, which handles reconnection
      ws.close();
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;
        console.log(`[WS] disconnected. Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        retryTimerRef.current = setTimeout(connect, delay);
      } else {
        console.error("[WS] max retries reached");
        store.setError("WebSocket desconectado. Recarregue a página.");
      }
    };
  }, [simId]);

  useEffect(() => {
    if (!simId) return;
    mountedRef.current = true;

    // Load initial simulation state
    api.getSimulation(simId).then((sim) => {
      store.setSimulation(sim);
    }).catch(() => {
      window.location.href = "/";
    });

    connect();

    // Load graph if already built
    api.getGraph(simId).then(store.setGraphData).catch(() => {});

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [simId, connect]);

  const run = () => simId && api.runSimulation(simId).catch((e) => store.setError(String(e)));
  const pause = () => simId && api.pauseSimulation(simId).catch((e) => store.setError(String(e)));

  return { run, pause };
}
