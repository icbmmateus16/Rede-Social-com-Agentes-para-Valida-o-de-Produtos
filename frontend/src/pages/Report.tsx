import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Simulation, SimulationReport } from "../types";
import { INTENT_COLORS, INTENT_LABELS } from "../types";

const FREQ_COLORS: Record<string, string> = {
  alta: "#ef4444",
  média: "#eab308",
  media: "#eab308",
  baixa: "#22c55e",
};

const SEG_COLORS = ["#22c55e", "#3b82f6", "#a78bfa", "#f97316", "#ec4899"];

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--bg-surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius-md)", padding: "1.5rem", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "1rem" }}>
      {icon && <span style={{ fontSize: "0.9rem", opacity: 0.7 }}>{icon}</span>}
      <h2 style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
        {children}
      </h2>
    </div>
  );
}

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sim, setSim] = useState<Simulation | null>(null);
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getSimulation(id), api.getReport(id).catch(() => null)])
      .then(([s, r]) => { setSim(s); setReport(r); })
      .finally(() => setLoading(false));
  }, [id]);

  const handleGenerate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const r = await api.generateReport(id);
      setReport(r);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    const data = await api.exportSimulation(id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketsim-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Carregando relatório...</div>
      </div>
    );
  }

  const convRate = sim?.metrics.estimated_conversion_rate ?? 0;
  const avgScore = sim?.metrics.avg_opinion_score ?? 0;
  const convColor = convRate >= 50 ? "#22c55e" : convRate >= 25 ? "#eab308" : "#ef4444";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "2rem" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button onClick={() => navigate(`/simulation/${id}`)} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem",
            padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)", lineHeight: 1,
          }}>← Voltar</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
              Relatório de Mercado
            </h1>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 2 }}>
              {sim?.product.name} · {sim?.agent_count} agentes · R${sim?.product.price_brl.toFixed(2)}/mês
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button onClick={handleExport} style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", padding: "0.6rem 1rem",
              borderRadius: "var(--radius-sm)", fontWeight: 600,
              cursor: "pointer", fontSize: "0.82rem",
            }}>
              ↓ Exportar dados
            </button>
            {!report && !generating && (
              <button onClick={handleGenerate} style={{
                background: "var(--accent)", color: "#000", border: "none",
                padding: "0.6rem 1.2rem", borderRadius: "var(--radius-sm)",
                fontWeight: 700, cursor: "pointer", fontSize: "0.88rem",
                boxShadow: "0 0 16px rgba(34,197,94,0.2)",
              }}>
                ✦ Gerar com IA
              </button>
            )}
            {report && !generating && (
              <button onClick={handleGenerate} style={{
                background: "transparent", border: "1px solid var(--border-glow)",
                color: "var(--text-muted)", padding: "0.6rem 1rem",
                borderRadius: "var(--radius-sm)", fontWeight: 600,
                cursor: "pointer", fontSize: "0.82rem",
              }}>
                ↻ Regerar com IA
              </button>
            )}
          </div>
        </div>

        {/* Hero conversion metric */}
        {sim && (
          <div style={{
            background: `linear-gradient(135deg, ${convColor}10 0%, transparent 60%)`,
            border: `1px solid ${convColor}30`,
            borderRadius: "var(--radius-lg)", padding: "1.75rem 2rem",
            marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "2rem",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: convColor, fontSize: "3rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>
                {convRate.toFixed(1)}%
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>Taxa de conversão estimada</div>
            </div>
            <div style={{ width: 1, height: 60, background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ color: avgScore > 0 ? "#22c55e" : "#ef4444", fontSize: "2rem", fontWeight: 800, lineHeight: 1 }}>
                {avgScore > 0 ? "+" : ""}{avgScore.toFixed(2)}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>Score médio (-1 a +1)</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {(["strong_buy", "likely_buy", "neutral", "unlikely", "reject"] as const).map((key) => {
                  const pct = sim.metrics[`${key}_pct` as keyof typeof sim.metrics] as number;
                  if (pct < 1) return null;
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: INTENT_COLORS[key] }} />
                      <span style={{ color: INTENT_COLORS[key], fontSize: "0.78rem", fontWeight: 700 }}>
                        {pct.toFixed(0)}%
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                        {INTENT_LABELS[key]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Generate CTA */}
        {!report && !generating && (
          <Card style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.3 }}>✦</div>
            <div style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: 600 }}>
              Relatório detalhado ainda não gerado
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1.5rem" }}>
              A IA vai analisar os dados e gerar insights estratégicos
            </div>
            <button onClick={handleGenerate} style={{
              background: "var(--accent)", color: "#000", border: "none",
              padding: "0.75rem 1.75rem", borderRadius: "var(--radius-sm)",
              fontWeight: 700, cursor: "pointer", fontSize: "0.9rem",
            }}>
              ✦ Gerar com IA
            </button>
          </Card>
        )}

        {generating && (
          <Card style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ color: "#60a5fa", fontSize: "0.9rem", marginBottom: 8 }}>
              Analisando dados com IA...
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Isso pode levar alguns segundos
            </div>
          </Card>
        )}

        {report && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Executive Summary */}
            <Card>
              <SectionTitle icon="📋">Resumo Executivo</SectionTitle>
              <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, margin: 0, fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
                {report.executive_summary}
              </p>
            </Card>

            {/* Segments */}
            {report.segments.length > 0 && (
              <Card>
                <SectionTitle icon="◈">Segmentos de Compradores</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
                  {report.segments.map((seg, i) => {
                    const color = SEG_COLORS[i % SEG_COLORS.length];
                    return (
                      <div key={i} style={{
                        background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "1rem",
                        borderTop: `2px solid ${color}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "0.88rem" }}>{seg.name}</span>
                          <span style={{ color, fontWeight: 800, fontSize: "0.85rem" }}>
                            {seg.size_pct?.toFixed(0)}%
                          </span>
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.6 }}>
                          {seg.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Objections */}
            {report.top_objections.length > 0 && (
              <Card>
                <SectionTitle icon="⚠">Principais Objeções</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {report.top_objections.map((obj, i) => {
                    const freq = obj.frequency?.toLowerCase() || "baixa";
                    const freqColor = FREQ_COLORS[freq] || "#6b7280";
                    return (
                      <div key={i} style={{
                        background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "0.9rem 1rem",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: obj.suggested_response ? 8 : 0 }}>
                          <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 600, lineHeight: 1.4 }}>
                            {obj.objection}
                          </span>
                          <span style={{
                            background: freqColor + "18", color: freqColor,
                            fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 99,
                            fontWeight: 700, flexShrink: 0, border: `1px solid ${freqColor}28`,
                          }}>
                            {obj.frequency}
                          </span>
                        </div>
                        {obj.suggested_response && (
                          <div style={{
                            background: "#22c55e08", borderRadius: "var(--radius-sm)",
                            padding: "0.5rem 0.75rem",
                            color: "#86efac", fontSize: "0.78rem", lineHeight: 1.5,
                            borderLeft: "2px solid #22c55e30",
                          }}>
                            💡 {obj.suggested_response}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <Card>
                <SectionTitle icon="✦">Recomendações Estratégicas</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {report.recommendations.map((rec, i) => (
                    <div key={i} style={{
                      display: "flex", gap: "0.75rem", alignItems: "flex-start",
                      padding: "0.75rem 0",
                      borderBottom: i < report.recommendations.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "var(--accent-dim)", color: "var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.68rem", fontWeight: 800, flexShrink: 0, marginTop: 1,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>{rec}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pricing */}
            {report.pricing_insight && (
              <Card style={{ borderColor: "rgba(234,179,8,0.2)", background: "rgba(234,179,8,0.03)" }}>
                <SectionTitle icon="💰">Análise de Preço</SectionTitle>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, margin: 0, fontSize: "0.9rem" }}>
                  {report.pricing_insight}
                </p>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}