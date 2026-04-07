import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Simulation } from "../types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  generating: "Gerando agentes...",
  building: "Montando grafo...",
  running: "Em execução",
  paused: "Pausado",
  complete: "Concluído",
  error: "Erro",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  generating: "#3b82f6",
  building: "#8b5cf6",
  running: "#22c55e",
  paused: "#eab308",
  complete: "#10b981",
  error: "#ef4444",
};

const STATUS_ICONS: Record<string, string> = {
  draft: "○",
  generating: "⟳",
  building: "⟳",
  running: "▶",
  paused: "⏸",
  complete: "✓",
  error: "✕",
};

export default function Home() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.listSimulations()
      .then(setSimulations)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deletar esta simulação?")) return;
    await api.deleteSimulation(id);
    setSimulations((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "2rem" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--accent-dim)", border: "1px solid rgba(34,197,94,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem",
              }}>◎</div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
                Market<span style={{ color: "var(--accent)" }}>Sim</span>
              </h1>
            </div>
            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.88rem" }}>
              Simule como o mercado reage ao seu produto — com agentes de IA
            </p>
          </div>
          <button
            onClick={() => navigate("/new")}
            style={{
              background: "var(--accent)",
              color: "#000",
              border: "none",
              padding: "0.65rem 1.25rem",
              borderRadius: "var(--radius-md)",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.9rem",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 0 20px rgba(34,197,94,0.2)",
            }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Nova Simulação
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[1, 2].map(i => (
              <div key={i} style={{
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "1.25rem 1.5rem", height: 80,
                opacity: 0.4,
              }} />
            ))}
          </div>
        ) : simulations.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "5rem 2rem",
            border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.3 }}>◎</div>
            <div style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: "1.05rem", marginBottom: 8 }}>
              Nenhuma simulação ainda
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: 320, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
              Crie sua primeira simulação para ver como 50–500 pessoas reagem ao seu produto
            </p>
            <button
              onClick={() => navigate("/new")}
              style={{
                background: "var(--accent-dim)", border: "1px solid rgba(34,197,94,0.3)",
                color: "var(--accent)", padding: "0.6rem 1.4rem",
                borderRadius: "var(--radius-sm)", cursor: "pointer",
                fontWeight: 600, fontSize: "0.9rem",
              }}
            >
              Criar primeira simulação
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: 4, paddingLeft: 2 }}>
              {simulations.length} simulação{simulations.length !== 1 ? "ões" : ""}
            </div>
            {simulations.map((sim) => {
              const color = STATUS_COLORS[sim.status] || "#6b7280";
              const isComplete = sim.status === "complete";
              const convRate = sim.metrics?.estimated_conversion_rate ?? 0;
              return (
                <div
                  key={sim.id}
                  onClick={() => navigate(`/simulation/${sim.id}`)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem 1.25rem",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#363640";
                    e.currentTarget.style.background = "var(--bg-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--bg-surface)";
                  }}
                >
                  {/* Conversion bar at bottom */}
                  {isComplete && convRate > 0 && (
                    <div style={{
                      position: "absolute", bottom: 0, left: 0,
                      height: 2, width: `${Math.min(convRate, 100)}%`,
                      background: "var(--accent)", borderRadius: "0 99px 0 0",
                      opacity: 0.6,
                    }} />
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ color, fontSize: "0.8rem" }}>{STATUS_ICONS[sim.status]}</span>
                        <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                          {sim.name}
                        </span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {sim.product.name} · R${sim.product.price_brl.toFixed(2)}/mês · {sim.agent_count} agentes
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0, marginLeft: "1rem", overflow: "visible" }}>
                      {isComplete && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1rem" }}>
                            {convRate.toFixed(1)}%
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>conversão</div>
                        </div>
                      )}
                      <span style={{
                        background: color + "18",
                        color,
                        padding: "0.2rem 0.65rem",
                        borderRadius: 99,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: `1px solid ${color}30`,
                        whiteSpace: "nowrap",
                      }}>
                        {STATUS_LABELS[sim.status] || sim.status}
                      </span>
                      <button
                        onClick={(e) => handleDelete(sim.id, e)}
                        style={{
                          background: "transparent", border: "1px solid transparent",
                          color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem",
                          padding: "0.2rem 0.4rem", borderRadius: 4,
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                          e.currentTarget.style.borderColor = "#ef444440";
                          e.currentTarget.style.background = "#ef444410";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.borderColor = "transparent";
                          e.currentTarget.style.background = "transparent";
                        }}
                        title="Deletar simulação"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}