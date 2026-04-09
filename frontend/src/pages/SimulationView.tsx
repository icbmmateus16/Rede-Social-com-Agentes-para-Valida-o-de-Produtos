import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation";
import { useSimulationStore } from "../store/simulationStore";
import GraphCanvas from "../components/graph/GraphCanvas";
import MetricsBar from "../components/panels/MetricsBar";
import LiveFeed from "../components/panels/LiveFeed";
import AgentDetailPanel from "../components/panels/AgentDetailPanel";
import { api } from "../api/client";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_METRICS = {
  purchased_pct: 0, considering_pct: 0, aware_pct: 0,
  unaware_pct: 0, rejected_pct: 0, avg_opinion_score: 0,
  top_objections: [], top_motivators: [], estimated_conversion_rate: 0,
  opinion_score_std: 0, opinion_ci_low: 0, opinion_ci_high: 0,
};

export default function SimulationView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { run, pause } = useSimulation(id);
  const {
    simulation, graphData, metrics, currentTick,
    isRunning, generationProgress, generationPhase,
    liveFeedEvents, selectedAgentId, selectAgent, reset,
    colorMode, setColorMode, errorMessage, setError,
  } = useSimulationStore();

  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    return () => reset();
  }, [id]);

  const handleGenerateReport = async () => {
    if (!id) return;
    await api.generateReport(id);
    navigate(`/simulation/${id}/report`);
  };

  const totalTicks = simulation?.propagation_ticks || 20;
  const status = simulation?.status || "draft";

  const showGraph = !!graphData;
  const showGenerating = ["generating", "building"].includes(status);
  const showComplete = status === "complete";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)", color: "var(--text-primary)", overflow: "hidden" }}>
      {/* Top bar */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          display: "flex", alignItems: "center", gap: "1.5rem",
          padding: "0.75rem 1.75rem",
          background: "var(--bg-glass)", 
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
          flexShrink: 0,
          zIndex: 40,
        }}
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/")} 
          style={{
            background: "var(--bg-elevated)", border: "1px solid var(--border-glow)",
            color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "1rem", padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)",
          }}
        >
          ←
        </motion.button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.02em" }}>
            {simulation?.name || "Carregando..."}
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 500, marginTop: 2 }}>
            {simulation?.product?.name ?? "—"} <span style={{ opacity: 0.5 }}>·</span> <strong style={{ color: "var(--accent)" }}>R${(simulation?.product?.price_brl ?? 0).toFixed(2)}/mês</strong> <span style={{ opacity: 0.5 }}>·</span> {simulation?.agent_count ?? 0} agentes
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: "var(--bg-hover)" }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowGuide(v => !v)}
          style={{
            background: showGuide ? "var(--bg-elevated)" : "transparent",
            border: "1px solid var(--border-glow)",
            color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "0.85rem", fontWeight: 600, padding: "0.5rem 1rem",
            borderRadius: "var(--radius-sm)", flexShrink: 0, transition: "color 0.2s"
          }}
        >
          {showGuide ? "✕ Fechar Guia" : "? Como usar"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyLink}
          title="Copiar link da simulação"
          style={{
            background: "transparent",
            border: "1px solid var(--border-glow)",
            color: copied ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
            padding: "0.4rem 0.8rem", borderRadius: "var(--radius-sm)",
            flexShrink: 0, transition: "color 0.2s",
          }}
        >
          {copied ? "✓ Copiado" : "⎘ Link"}
        </motion.button>

        {showComplete && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px var(--accent-glow)" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleGenerateReport}
            style={{
              background: "var(--accent)", color: "#000",
              border: "none", padding: "0.55rem 1.25rem",
              borderRadius: "var(--radius-sm)", fontWeight: 800, cursor: "pointer",
              fontSize: "0.9rem", whiteSpace: "nowrap",
              boxShadow: "0 4px 15px var(--accent-dim)",
            }}
          >
            Ver Relatório →
          </motion.button>
        )}
      </motion.div>

      {/* Guide overlay */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(4,4,5,0.85)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }} onClick={() => setShowGuide(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: "var(--bg-surface)", border: "1px solid var(--border-glow)",
                borderRadius: "var(--radius-lg)", padding: "2rem",
                maxWidth: 480, width: "100%", boxShadow: "var(--shadow-md)"
              }} onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Como usar a simulação</h2>
                <button onClick={() => setShowGuide(false)} style={{
                  background: "none", border: "none", color: "var(--text-muted)",
                  cursor: "pointer", fontSize: "1.2rem", padding: 0,
                }}>✕</button>
              </div>
              {[
                { step: "1", title: "Aguarde a geração", desc: "A IA está criando cada pessoa com perfil único — personalidade, valores, dores." },
                { step: "2", title: "Veja o grafo aparecer", desc: "Cada bolinha é uma pessoa. A cor indica a opinião (verde = compra, vermelho = rejeita)." },
                { step: "3", title: "Clique em Espalhar", desc: "As opiniões se espalham pela rede social como na vida real. Acompanhe a mudança em tempo real." },
                { step: "4", title: "Clique em qualquer bolinha", desc: "Abre o perfil completo da pessoa." },
                { step: "5", title: "Gere o Relatório", desc: "Obtenha uma análise B2B completa com segmentos, objeções e recomendações estratégicas." },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: "var(--accent-glow)", color: "var(--accent)", border: "1px solid var(--accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.85rem", fontWeight: 800, marginTop: 2,
                    boxShadow: "0 0 10px var(--accent-dim)"
                  }}>{step}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: 4, color: "var(--text-primary)" }}>{title}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              padding: "0.6rem 1.75rem",
              background: "rgba(239,68,68,0.08)",
              borderBottom: "1px solid rgba(239,68,68,0.3)",
              display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
            }}
          >
            <span style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: 600 }}>
              Erro: {errorMessage}
            </span>
            <button
              onClick={() => setError(null)}
              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: "auto", fontSize: "1rem" }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics bar */}
      <MetricsBar
        metrics={metrics || EMPTY_METRICS}
        tick={currentTick}
        totalTicks={totalTicks}
        isRunning={isRunning}
        onRun={run}
        onPause={pause}
        status={status}
      />

      {/* Context strip — live ticker */}
      <AnimatePresence>
        {!showGenerating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            style={{
              padding: "0.6rem 1.75rem",
              background: "var(--bg-elevated)",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
            }}
          >
            {/* Status dot */}
            <motion.div 
              animate={{ 
                scale: isRunning && currentTick > 0 ? [1, 1.2, 1] : 1,
                opacity: isRunning && currentTick > 0 ? [1, 0.7, 1] : 1
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                background: isRunning && currentTick > 0 ? "var(--accent)"
                  : status === "complete" ? "var(--accent)"
                  : status === "paused" ? "#eab308"
                  : status === "running" && currentTick === 0 ? "#3b82f6"
                  : "#6b7280",
                boxShadow: isRunning && currentTick > 0 ? "0 0 12px var(--accent)" : "none",
              }} 
            />

            {/* Live event ticker when running */}
            {isRunning && currentTick > 0 && liveFeedEvents.length > 0 ? (() => {
              const latest = liveFeedEvents[0];
              const safeName = latest?.agent_name || "Agente";
              const name = safeName.split(" ")[0];
              const connections = latest?.influenced_by?.length ?? 0;
              const safeToIntent = latest?.to_intent || "unaware";
              const toLabel = { purchased: "comprou", considering: "está considerando", aware: "descobriu", unaware: "desconhece", rejected: "rejeitou" }[safeToIntent] ?? "";
              const toColor = { purchased: "#22c55e", considering: "#eab308", aware: "#3b82f6", unaware: "#52525b", rejected: "#ef4444" }[safeToIntent] ?? "#fff";
              return (
                <motion.span 
                  key={latest.agent_id + latest.tick}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{ fontSize: "0.85rem", color: "var(--text-secondary)", flex: 1 }}
                >
                  <strong style={{ color: "var(--text-primary)" }}>{name}</strong>
                  {connections > 0 ? ` foi influenciado por ${connections} contato${connections > 1 ? "s" : ""} e` : ""}
                  {" "}agora{" "}
                  <strong style={{ color: toColor }}>{toLabel}</strong>
                  <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>· rodada {latest.tick}</span>
                </motion.span>
              );
            })() : (
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem", flex: 1, fontWeight: 500 }}>
                {isRunning && currentTick > 0 ? "As opiniões se espalhando pela rede..." :
                 status === "running" && currentTick === 0 ? "✨ Grafo pronto — aguardando comando para espalhar opiniões" :
                 status === "paused" ? "Simulação pausada" :
                 status === "complete" ? "Simulação concluída com sucesso" :
                 status === "error" ? "⚠ Ocorreu um erro no servidor" :
                 showGraph ? "Pronto para iniciar" : ""}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        
        {/* Subtle grid background for the canvas to look premium */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "40px 40px", opacity: 0.5
        }} />

        {/* Radial vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          background: "radial-gradient(circle at center, transparent 30%, var(--bg-base) 100%)"
        }} />

        {/* Agent detail panel */}
        <AnimatePresence>
          {selectedAgentId && id && (
            <AgentDetailPanel simId={id} onClose={() => selectAgent(null)} />
          )}
        </AnimatePresence>

        {/* Graph area */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", zIndex: 5 }}>
          
          <AnimatePresence>
            {showGenerating && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                style={{
                  position: "absolute", inset: 0, zIndex: 20,
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  background: "rgba(4,4,5,0.85)", backdropFilter: "blur(16px)",
                }}
              >
                <div style={{ marginBottom: "2rem", position: "relative" }}>
                  {/* Cinematic Spinner */}
                  <motion.svg 
                    width={80} height={80} viewBox="0 0 100 100" 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  >
                    <circle cx={50} cy={50} r={40} fill="none" stroke="var(--border-glow)" strokeWidth={4} />
                    <motion.path 
                      d="M50 10 A40 40 0 0 1 90 50" 
                      fill="none" stroke="var(--accent)" strokeWidth={4} strokeLinecap="round" 
                      animate={{ pathLength: [0.2, 0.8, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                  </motion.svg>
                  {/* Pulse behind spinner */}
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ position: "absolute", inset: 0, background: "var(--accent)", borderRadius: "50%", filter: "blur(20px)", zIndex: -1 }}
                  />
                </div>
                
                {/* Phase title */}
                <h3 style={{ color: "var(--text-primary)", fontSize: "1.25rem", fontWeight: 800, marginBottom: 8, letterSpacing: "-0.01em" }}>
                  {generationPhase === "forming_opinions" ? "Definindo crenças iniciais..." :
                   generationPhase === "building_graph" ? "Conectando a rede social..." :
                   `Sintetizando ${simulation?.agent_count ?? ""} agentes de IA...`}
                </h3>

                {/* Contextual description */}
                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: 320, textAlign: "center", marginBottom: 24, lineHeight: 1.5 }}>
                  {generationPhase === "forming_opinions"
                    ? "Cada agente avalia o produto com base no seu perfil psicológico único."
                    : generationPhase === "building_graph"
                    ? "Algoritmo Watts-Strogatz clusterizando comunidades por afinidade."
                    : "Gerando identidades ultra-realistas com o modelo Groq LLM."}
                </div>

                {/* Percentage + progress bar */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 280 }}>
                  <motion.div
                    key={Math.floor(generationProgress / 5)}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    style={{
                      fontSize: "2.75rem", fontWeight: 900, lineHeight: 1,
                      color: "var(--accent)", fontFamily: "var(--font-mono, monospace)",
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {Math.round(generationProgress)}%
                  </motion.div>

                  <div style={{ width: "100%", background: "var(--bg-elevated)", border: "1px solid var(--border-glow)", borderRadius: 99, height: 6, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ type: "spring", stiffness: 50, damping: 15 }}
                      style={{ height: "100%", background: "var(--accent)", borderRadius: 99, boxShadow: "0 0 10px var(--accent-glow)" }}
                    />
                  </div>

                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                    {generationPhase === "building_graph"
                      ? "Quase pronto — construindo conexões..."
                      : generationPhase === "forming_opinions"
                      ? "Formando opiniões individuais..."
                      : "Isso pode levar 1-2 minutos"}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showGraph && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 1 }}
              style={{ width: "100%", height: "100%" }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                <GraphCanvas
                  graphData={graphData}
                  onNodeClick={(nodeId) => selectAgent(nodeId)}
                  colorMode={colorMode}
                />
              </div>
            </motion.div>
          )}

          {/* Legend overlay */}
          <AnimatePresence>
            {showGraph && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={{
                  position: "absolute", bottom: 24, left: 24,
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid var(--border-glow)",
                  borderRadius: "var(--radius-md)", padding: "1.25rem",
                  minWidth: 180,
                  boxShadow: "var(--shadow-md)"
                }}
              >
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {(["intent", "community"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setColorMode(mode)}
                      style={{
                        flex: 1,
                        background: colorMode === mode ? "var(--accent-dim)" : "transparent",
                        border: `1px solid ${colorMode === mode ? "var(--accent)" : "var(--border)"}`,
                        color: colorMode === mode ? "var(--accent)" : "var(--text-muted)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.25rem 0.4rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {mode === "intent" ? "Opinião" : "Comunidade"}
                    </button>
                  ))}
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                  {colorMode === "intent" ? "Mapa de Opiniões" : "Comunidades"}
                </div>
                {([
                  { color: "#22c55e", label: "Comprou", key: "purchased_pct" },
                  { color: "#eab308", label: "Considera", key: "considering_pct" },
                  { color: "#3b82f6", label: "Consciente", key: "aware_pct" },
                  { color: "#52525b", label: "Desconhece", key: "unaware_pct" },
                  { color: "#ef4444", label: "Rejeita", key: "rejected_pct" },
                ] as const).map(({ color, label, key }) => {
                  const pct = metrics ? (metrics as any)[key] as number : 0;
                  const agentCount = simulation?.agent_count ?? 0;
                  const count = Math.round((pct / 100) * agentCount);
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}80` }} />
                      <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", flex: 1, fontWeight: 500 }}>{label}</span>
                      {count > 0 && (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700 }}>{count}</span>
                      )}
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, borderTop: "1px solid var(--border-subtle)", paddingTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #a78bfa", background: "#7c3aed33", flexShrink: 0, boxShadow: "0 0 8px #a78bfa50" }} />
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500 }}>Influenciador</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live feed */}
        <div style={{ zIndex: 10, position: "relative" }}>
          <LiveFeed
            events={liveFeedEvents}
            generationPhase={generationPhase}
            generationProgress={generationProgress}
            status={status}
          />
        </div>
      </div>
    </div>
  );
}
