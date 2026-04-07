import { useEffect, useRef } from "react";
import type { OpinionEvent } from "../../types";
import { INTENT_COLORS, INTENT_LABELS } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  events: (OpinionEvent & { id: string })[];
  generationPhase: string;
  generationProgress: number;
  status: string;
}

const PHASE_LABELS: Record<string, string> = {
  generating_personas: "Criando pessoas com IA...",
  forming_opinions: "Definindo crenças...",
  building_graph: "Conectando sociedade...",
};

function eventNarrative(event: OpinionEvent): { text: string; isPositive: boolean } {
  const name = (event?.agent_name || "Alguém").split(" ")[0]; // primeiro nome
  const connections = event?.influenced_by?.length ?? 0;
  
  const safeFromIntent = event?.from_intent || "neutral";
  const safeToIntent = event?.to_intent || "neutral";
  
  const from = INTENT_LABELS[safeFromIntent];
  const to = INTENT_LABELS[safeToIntent];

  const isPositive = ["strong_buy", "likely_buy"].includes(safeToIntent);
  const isNegative = ["reject", "unlikely"].includes(safeToIntent);
  const wasPositive = ["strong_buy", "likely_buy"].includes(safeFromIntent);

  let text = "";

  if (isPositive && !wasPositive) {
    if (connections > 0)
      text = `${name} foi convencido por ${connections} contato${connections > 1 ? "s" : ""} — agora ${to.toLowerCase()}`;
    else
      text = `${name} reconsiderou e passou a ${to.toLowerCase()}`;
  } else if (isNegative && !["reject", "unlikely"].includes(event.from_intent)) {
    if (connections > 0)
      text = `${name} ouviu ${connections} pessoa${connections > 1 ? "s" : ""} e focou mais cético — ${to.toLowerCase()}`;
    else
      text = `${name} ficou desanimado com a oferta`;
  } else if (event.to_intent === "neutral") {
    text = `${name} perdeu certeza — saiu de "${from}" para indiferente`;
  } else {
    text = `${name} mudou: ${from} → ${to}`;
  }

  return { text, isPositive };
}

export default function LiveFeed({ events, generationPhase, generationProgress, status }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const isGenerating = ["generating", "building"].includes(status);
  const isRunning = status === "running";

  // Group events by tick
  const byTick = events.reduce<Record<number, typeof events>>((acc, ev) => {
    if (!acc[ev.tick]) acc[ev.tick] = [];
    acc[ev.tick].push(ev);
    return acc;
  }, {});

  const sortedTicks = Object.keys(byTick).map(Number).sort((a, b) => b - a);

  return (
    <div style={{
      width: 320,
      borderLeft: "1px solid var(--border-subtle)",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-elevated)",
      overflow: "hidden",
      flexShrink: 0,
      boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
      zIndex: 20,
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border-glow)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg-glass)", backdropFilter: "blur(10px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isRunning && (
            <motion.div 
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              style={{
                width: 8, height: 8, borderRadius: "50%",
                background: "var(--accent)", flexShrink: 0,
                boxShadow: "0 0 10px var(--accent-glow)"
              }} 
            />
          )}
          <span style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Rede Social <span style={{ color: "var(--accent)" }}>Live</span>
          </span>
        </div>
        <AnimatePresence>
          {events.length > 0 && (
            <motion.span 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              style={{
                background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border-glow)",
                fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: 99, fontWeight: 700,
              }}>
              {events.length} logs
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Generation progress */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <motion.div 
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid var(--accent)", borderTopColor: "transparent" }} 
              />
              <span style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>
                {PHASE_LABELS[generationPhase] || "Inicializando..."}
              </span>
            </div>
            <div style={{ background: "var(--border)", borderRadius: 99, height: 4, overflow: "hidden", position: "relative" }}>
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${generationProgress}%` }} transition={{ type: "spring" }}
                style={{ height: "100%", background: "var(--accent)", borderRadius: 99, boxShadow: "0 0 10px var(--accent)" }} 
              />
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: 8, textAlign: "right", fontWeight: 600 }}>
              {generationProgress.toFixed(0)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem", display: "flex", flexDirection: "column" }}>
        {events.length === 0 && !isGenerating && (
          <div style={{ padding: "3rem 1.5rem", textAlign: "center", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{ fontSize: "2.5rem", opacity: 0.1 }}>⚡</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, fontWeight: 500 }}>
              Aguardando início da propagação. O histórico ao vivo aparecerá aqui com física em tempo real.
            </div>
          </div>
        )}

        <AnimatePresence>
          {sortedTicks.map((tick) => {
            const tickEvents = byTick[tick];
            const positiveCount = tickEvents.filter(e => ["strong_buy", "likely_buy"].includes(e.to_intent)).length;
            const negativeCount = tickEvents.filter(e => ["reject", "unlikely"].includes(e.to_intent)).length;

            return (
              <motion.div 
                key={`tick-${tick}`} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                style={{ marginBottom: "1rem" }}
              >
                {/* Tick header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: "0.75rem",
                  padding: "0 0.25rem",
                }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Rodada {tick}
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--border-glow)" }} />
                  {positiveCount > 0 && (
                    <span style={{ color: "#22c55e", fontSize: "0.75rem", fontWeight: 800, background: "rgba(34,197,94,0.1)", padding: "2px 6px", borderRadius: 4 }}>+{positiveCount}</span>
                  )}
                  {negativeCount > 0 && (
                    <span style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 800, background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: 4 }}>−{negativeCount}</span>
                  )}
                </div>

                {/* Events in this tick */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <AnimatePresence>
                    {tickEvents.map((event, i) => {
                      const { text, isPositive } = eventNarrative(event);
                      const toColor = INTENT_COLORS[event.to_intent];
                      const isNeg = ["reject", "unlikely"].includes(event.to_intent);

                      return (
                        <motion.div 
                          key={event.id}
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, damping: 20, delay: i * 0.05 }}
                          style={{
                            padding: "0.75rem",
                            background: "var(--bg-surface)",
                            borderRadius: "var(--radius-md)",
                            borderLeft: `3px solid ${toColor}`,
                            boxShadow: isPositive ? "0 4px 15px rgba(34,197,94,0.1)" : isNeg ? "0 4px 15px rgba(239,68,68,0.1)" : "0 2px 8px rgba(0,0,0,0.5)",
                          }}
                        >
                          <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5, fontWeight: 500 }}>
                            {text}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                            <span style={{ color: INTENT_COLORS[event.from_intent], fontSize: "0.75rem", fontWeight: 600 }}>
                              {INTENT_LABELS[event.from_intent]}
                            </span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>→</span>
                            <span style={{ color: toColor, fontSize: "0.75rem", fontWeight: 800 }}>
                              {INTENT_LABELS[event.to_intent]}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} style={{ height: 20 }} />
      </div>
    </div>
  );
}