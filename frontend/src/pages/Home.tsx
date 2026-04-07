import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Simulation } from "../types";
import { HeroPlayer } from "../components/remotion/HeroPlayer";
import { motion } from "framer-motion";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  generating: "Gerando",
  building: "Montando",
  running: "Rodando",
  paused: "Pausado",
  complete: "Pronto",
  error: "Falha",
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

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "var(--bg-base)", overflow: "hidden" }}>
      {/* Left Panel: Hero & Presentation (Remotion) */}
      <div style={{
        flex: 1,
        position: "relative",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "var(--bg-surface)",
      }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.6 }}>
          <HeroPlayer />
        </div>
        
        {/* Vignette to ensure text readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at center, transparent 0%, var(--bg-surface) 90%)"
        }} />

        <div style={{ zIndex: 10, textAlign: "center", padding: "3rem", maxWidth: 600 }}>
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: 'inline-block', padding: '6px 12px', border: '1px solid var(--border-glow)', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '1.5rem', background: 'var(--accent-dim)' }}>
              Market<span style={{ color: "#fff" }}>Sim</span> B2B Engine v2.0
            </div>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 800, margin: "0 0 1rem 0", lineHeight: 1.1, letterSpacing: "-0.04em" }}>
              Simule a <br/><span style={{ color: "var(--accent)" }}>Adoção Reversa</span>.
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.2rem", lineHeight: 1.6, marginBottom: "2.5rem", fontWeight: 400 }}>
              Use Inteligência Artificial e Agentes Autônomos para validar a adesão do seu produto antes do go-to-market. 
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: The Console (Operations) */}
      <div style={{
        width: "500px",
        flexShrink: 0,
        backgroundColor: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
        zIndex: 5
      }}>
        {/* Header Terminal Style */}
        <div style={{
          padding: "1.5rem 2rem",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backgroundColor: "var(--bg-elevated)",
        }}>
          <div className="panel-header">
            <span className="status-dot">●</span> SYSTEM_READY
          </div>
          <button
            onClick={() => navigate("/new")}
            style={{
              background: "var(--accent)", color: "#000", border: "none",
              padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)",
              fontWeight: 800, cursor: "pointer", fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
              boxShadow: "0 0 10px var(--accent-glow)",
            }}
          >
            [+ NEW_SIMULATION]
          </button>
        </div>

        {/* Console Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)", marginBottom: "1.5rem", textTransform: "uppercase" }}>
            {">"} Carregando histórico da base...
          </div>

          {loading ? (
            <div className="console-box" style={{ opacity: 0.5, borderStyle: "dashed" }}>
              <div className="mono-text" style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Fetching data... <span className="blinking-cursor">_</span>
              </div>
            </div>
          ) : simulations.length === 0 ? (
            <div className="console-box" style={{ borderStyle: "dashed", textAlign: "left", padding: "1.5rem" }}>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.5rem", fontFamily: "var(--font-mono)" }}>Nenhum processo ativo.</div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                Inicie uma nova simulação para gerar um relatório analítico.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {simulations.map((sim) => {
                const isComplete = sim.status === "complete";
                const convRate = sim.metrics?.estimated_conversion_rate ?? 0;
                return (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={sim.id}
                    onClick={() => navigate(`/simulation/${sim.id}`)}
                    className="console-box"
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--bg-base)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span className="mono-text" style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 800 }}>
                        {sim.name}
                      </span>
                      <span className="orange-tag" style={{ background: isComplete ? "var(--accent)" : "var(--bg-elevated)", color: isComplete ? "#000" : "var(--text-secondary)" }}>
                        {STATUS_LABELS[sim.status] || sim.status}
                      </span>
                    </div>
                    
                    <div className="mono-text" style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
                      ID: {sim.id.split('-')[0]} // AGENTS: {sim.agent_count} // PRODUCT: {sim.product.name}
                    </div>

                    {isComplete && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "1rem" }}>
                        <div style={{ flex: 1, height: 4, background: "var(--bg-elevated)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(convRate, 100)}%`, height: "100%", background: "var(--accent)" }} />
                        </div>
                        <div className="mono-text" style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 800 }}>
                          CONV: {convRate.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}