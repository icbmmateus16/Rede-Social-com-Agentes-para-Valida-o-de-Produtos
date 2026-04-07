import { useEffect, useRef } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import FA2Layout from "graphology-layout-forceatlas2/worker";
import type { GraphData } from "../../types";
import { COMMUNITY_COLORS } from "../../types";

interface Props {
  graphData: GraphData;
  onNodeClick: (nodeId: string) => void;
  colorMode: "intent" | "community";
}

export default function GraphCanvas({ graphData, onNodeClick, colorMode }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const fa2Ref = useRef<FA2Layout | null>(null);
  const initializedRef = useRef(false);

  // Initialize graph only ONCE when first graphData arrives
  useEffect(() => {
    if (!containerRef.current || !graphData || initializedRef.current) return;
    initializedRef.current = true;

    const graph = new Graph({ multi: false, type: "undirected" });
    graphRef.current = graph;

    // Add nodes
    for (const node of graphData.nodes) {
      graph.addNode(node.id, {
        label: node.label,
        x: node.x,
        y: node.y,
        size: node.size,
        color: node.color,
        community: node.community,
        intent: node.intent,
        score: node.score,
        is_influencer: node.is_influencer,
      });
    }

    // Add edges
    for (const edge of graphData.edges) {
      try {
        graph.addEdge(edge.source, edge.target, {
          size: 0.5,
          color: "#2a2a2a",
        });
      } catch {}
    }

    const sigma = new Sigma(graph, containerRef.current, {
      renderEdgeLabels: false,
      defaultEdgeColor: "#2a2a2a",
      defaultEdgeType: "line",
      labelColor: { color: "#9ca3af" },
      labelSize: 10,
      minCameraRatio: 0.1,
      maxCameraRatio: 10,
    });
    sigmaRef.current = sigma;

    // Click handler
    sigma.on("clickNode", ({ node }) => {
      onNodeClick(node);
    });

    // Start ForceAtlas2 layout
    const fa2 = new FA2Layout(graph, {
      settings: {
        gravity: 1,
        scalingRatio: 2,
        strongGravityMode: false,
        barnesHutOptimize: true,
        adjustSizes: false,
      },
    });
    fa2Ref.current = fa2;
    fa2.start();

    // Stop layout after stabilization
    setTimeout(() => {
      fa2.stop();
    }, 4000);

    return () => {
      fa2.stop();
      sigma.kill();
      initializedRef.current = false;
    };
  }, [graphData]);

  // Sync node color/intent/score/size updates from the Zustand store to graphology
  useEffect(() => {
    const graph = graphRef.current;
    const sigma = sigmaRef.current;
    if (!graph || !sigma || !graphData || !initializedRef.current) return;

    let changed = false;
    for (const node of graphData.nodes) {
      if (!graph.hasNode(node.id)) continue;
      const targetColor = colorMode === "community"
        ? COMMUNITY_COLORS[node.community % COMMUNITY_COLORS.length]
        : node.color;
      const currentColor = graph.getNodeAttribute(node.id, "color");
      const currentSize = graph.getNodeAttribute(node.id, "size");
      if (currentColor !== targetColor) {
        graph.setNodeAttribute(node.id, "color", targetColor);
        graph.setNodeAttribute(node.id, "score", node.score);
        graph.setNodeAttribute(node.id, "intent", node.intent);
        changed = true;
      }
      if (currentSize !== node.size) {
        graph.setNodeAttribute(node.id, "size", node.size);
        graph.setNodeAttribute(node.id, "is_influencer", node.is_influencer);
        changed = true;
      }
    }
    if (changed) {
      sigma.refresh();
    }
  }, [graphData, colorMode]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#0a0a0a" }}
    />
  );
}
