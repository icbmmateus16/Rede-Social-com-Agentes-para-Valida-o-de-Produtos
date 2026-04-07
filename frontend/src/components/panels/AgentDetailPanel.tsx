import { useEffect } from "react";
import { useSimulationStore } from "../../store/simulationStore";
import { api } from "../../api/client";
import { INTENT_COLORS, INTENT_LABELS } from "../../types";

interface Props {
  simId: string;
  onClose: () => void;
}

function ScoreBar({ score }: { score: number }) {
  const pct = ((score + 1) / 2) * 100;
  const color = score > 0.2 ? "#22c55e" : score < -0.2 ? "#ef4444" : "#eab308";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Rejeita</span>
        <span style={{ color, fontWeight: 800, fontSize: "0.9rem" }}>
          {score > 0 ? "+" : ""}{score.toFixed(2)}
        </span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Compra</span>
      </div>
      <div style={{
        background: "linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)",
        borderRadius: 99, height: 5, position: "relative", opacity: 0.4,
      }}>
        <div style={{
          position: "absolute",
          left: `${pct}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 11, height: 11,
          borderRadius: "50%",
          background: color,
          border: "2px solid var(--bg-base)",
          opacity: 1,
          boxShadow: `0 0 6px ${color}80`,
        }} />
      </div>
    </div>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  const c = color || "#6b7280";
  return (
    <span style={{
      background: c + "14",
      color: c,
      padding: "0.15rem 0.5rem",
      borderRadius: 99,
      fontSize: "0.72rem",
      border: `1px solid ${c}28`,
    }}>{children}</span>
  );
}

export default function AgentDetailPanel({ simId, onClose }: Props) {
  const { selectedAgentId, selectedAgent, setSelectedAgent } = useSimulationStore();

  useEffect(() => {
    if (!selectedAgentId) return;
    api.getAgent(simId, selectedAgentId).then(setSelectedAgent).catch(() => {});
  }, [selectedAgentId]);

  if (!selectedAgentId) return null;

  const agent = selectedAgent;
  const intentColor = agent ? INTENT_COLORS[agent.intent] : "#6b7280";
  const initial = agent?.name?.[0]?.toUpperCase() || "?";

  return (
    <div style={{
      width: 280,
      background: "var(--bg-base)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: "0.65rem 1rem",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Perfil do Agente
        </span>
        <button
          onClick={onClose}
          style={{
            background: "transparent", border: "1px solid transparent",
            color: "var(--text-muted)", cursor: "pointer",
            fontSize: "0.8rem", padding: "0.2rem 0.4rem", borderRadius: 4, lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.background = "var(--bg-elevated)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.background = "transparent";
          }}
        >✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
        {!agent ? (
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem 0" }}>
            Carregando perfil...
          </div>
        ) : (
          <>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                background: intentColor + "20",
                border: `2px solid ${intentColor}50`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", fontWeight: 800, color: intentColor,
              }}>
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {agent.name}
                  </span>
                  {agent.is_influencer && (
                    <span style={{
                      background: "#7c3aed20", color: "#a78bfa",
                      fontSize: "0.62rem", padding: "0.1rem 0.4rem",
                      borderRadius: 99, border: "1px solid #7c3aed30", fontWeight: 600,
                    }}>⬟ Influenciador</span>
                  )}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 2 }}>
                  {agent.profile.age}a · {agent.profile.city} · Classe {agent.profile.income_class}
                </div>
              </div>
            </div>

            {/* Profile grid */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
              marginBottom: "1rem",
              background: "var(--bg-surface)", borderRadius: "var(--radius-sm)", padding: "0.75rem",
            }}>
              {[
                { label: "Gênero", value: agent.profile.gender },
                { label: "Educação", value: agent.profile.education },
                { label: "Ocupação", value: agent.profile.occupation },
                { label: "Digital", value: `${(agent.profile.digital_savviness * 100).toFixed(0)}%` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.64rem", marginBottom: 1 }}>{label}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Opinion */}
            <div style={{
              background: "var(--bg-surface)", borderRadius: "var(--radius-sm)",
              padding: "0.75rem", marginBottom: "0.75rem",
              borderLeft: `2px solid ${intentColor}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>Intenção de compra</span>
                <span style={{ color: intentColor, fontWeight: 700, fontSize: "0.82rem" }}>
                  {INTENT_LABELS[agent.intent]}
                </span>
              </div>
              <ScoreBar score={agent.opinion.score} />
            </div>

            {/* Reasoning */}
            {agent.opinion.reasoning && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Raciocínio
                </div>
                <div style={{
                  color: "var(--text-secondary)", fontSize: "0.8rem", lineHeight: 1.6,
                  fontStyle: "italic",
                  background: "var(--bg-surface)", padding: "0.6rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                }}>
                  "{agent.opinion.reasoning}"
                </div>
              </div>
            )}

            {/* Objection */}
            {agent.opinion.key_objection && (
              <div style={{
                background: "#ef444410", borderRadius: "var(--radius-sm)",
                padding: "0.6rem 0.75rem", marginBottom: "0.75rem",
                borderLeft: "2px solid #ef444450",
              }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 3 }}>⚠ Objeção principal</div>
                <div style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{agent.opinion.key_objection}</div>
              </div>
            )}

            {/* Bio */}
            {agent.profile.bio && (
              <div style={{ marginBottom: "0.75rem" }}>
                <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Perfil
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", lineHeight: 1.6 }}>
                  {agent.profile.bio}
                </div>
              </div>
            )}

            {/* Tags row */}
            {(agent.profile.interests.length > 0 || agent.profile.values.length > 0 || agent.profile.pain_points.length > 0) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {agent.profile.interests.length > 0 && (
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 4 }}>Interesses</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {agent.profile.interests.map((i) => <Tag key={i} color="#6b7280">{i}</Tag>)}
                    </div>
                  </div>
                )}
                {agent.profile.values.length > 0 && (
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 4 }}>Valores</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {agent.profile.values.map((v) => <Tag key={v} color="#22c55e">{v}</Tag>)}
                    </div>
                  </div>
                )}
                {agent.profile.pain_points.length > 0 && (
                  <div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.68rem", marginBottom: 4 }}>Dores</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {agent.profile.pain_points.map((p) => <Tag key={p} color="#ef4444">{p}</Tag>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}