import type { SimulationMetrics } from "../../types";
import { INTENT_COLORS, INTENT_LABELS } from "../../types";
import { motion } from "framer-motion";

interface Props {
  metrics: SimulationMetrics;
  tick: number;
  totalTicks: number;
  isRunning: boolean;
  onRun: () => void;
  onPause: () => void;
  status: string;
}

export default function MetricsBar({ metrics, tick, totalTicks, isRunning, onRun, onPause, status }: Props) {
  const bars = [
    { key: "purchased", pct: metrics?.purchased_pct ?? 0, label: INTENT_LABELS.purchased },
    { key: "considering", pct: metrics?.considering_pct ?? 0, label: INTENT_LABELS.considering },
    { key: "aware", pct: metrics?.aware_pct ?? 0, label: INTENT_LABELS.aware },
    { key: "unaware", pct: metrics?.unaware_pct ?? 0, label: INTENT_LABELS.unaware },
    { key: "rejected", pct: metrics?.rejected_pct ?? 0, label: INTENT_LABELS.rejected },
  ] as const;

  const progressPct = totalTicks > 0 ? (tick / totalTicks) * 100 : 0;
  // isRunning comes from the store — only true when tick_complete messages arrive
  const isPropagating = isRunning && tick > 0;
  const isComplete = status === "complete";
  const isGenerating = ["generating", "building"].includes(status);

  return (
    <div style={{
      background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      padding: "1rem 1.75rem",
      display: "flex",
      alignItems: "center",
      gap: "2rem",
      flexShrink: 0,
      minHeight: 80,
    }}>
      {/* Intent metrics */}
      <div style={{ display: "flex", gap: "1.25rem", flex: 1, flexWrap: "wrap", alignItems: "center" }}>
        {bars.map(({ key, pct, label }) => {
          const color = INTENT_COLORS[key as keyof typeof INTENT_COLORS];
          return (
            <div key={key} style={{
              display: "flex", flexDirection: "column", minWidth: 64,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 6 }}>
                <span style={{ color, fontSize: "1.2rem", fontWeight: 800, lineHeight: 1 }}>
                  {pct.toFixed(0)}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 600 }}>%</span>
              </div>
              <div style={{ width: "100%", height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  style={{
                    height: "100%", background: color, borderRadius: 99,
                    boxShadow: `0 0 8px ${color}80`
                  }} 
                />
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.7rem", fontWeight: 500, marginTop: 6, whiteSpace: "nowrap" }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 40, background: "var(--border)", flexShrink: 0 }} />

      {/* Conversion */}
      <div style={{ textAlign: "center", flexShrink: 0, minWidth: 90 }}>
        <motion.div 
          key={metrics?.estimated_conversion_rate ?? 0}
          initial={{ scale: 1.1, color: "#fff" }}
          animate={{ scale: 1, color: "var(--accent)" }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1 }}
        >
          {(metrics?.estimated_conversion_rate ?? 0).toFixed(1)}%
        </motion.div>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500, marginTop: 4, whiteSpace: "nowrap" }}>
          Conversão est.
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 40, background: "var(--border)", flexShrink: 0 }} />

      {/* Tick progress */}
      <div style={{ flexShrink: 0, width: 160 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 500 }}>Rodadas de impacto</span>
          <span style={{ color: isComplete ? "var(--accent)" : "var(--text-primary)", fontSize: "0.85rem", fontWeight: 700 }}>
            {tick} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>/ {totalTicks}</span>
          </span>
        </div>
        <div style={{ width: "100%", height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)" }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 15 }}
            style={{
              height: "100%", background: isComplete ? "var(--accent)" : "#3b82f6",
              borderRadius: 99,
              boxShadow: isComplete ? "0 0 10px var(--accent-glow)" : "0 0 10px rgba(59,130,246,0.5)"
            }} 
          />
        </div>
      </div>

      {/* Control button */}
      {!isComplete && !isGenerating && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isPropagating ? onPause : onRun}
          style={{
            marginLeft: "1rem",
            background: isPropagating ? "var(--bg-elevated)" : "var(--accent)",
            border: isPropagating ? "1px solid var(--border-glow)" : "none",
            color: isPropagating ? "var(--text-primary)" : "#000",
            padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: 800,
            display: "flex", alignItems: "center", gap: 8,
            flexShrink: 0,
            whiteSpace: "nowrap",
            boxShadow: isPropagating ? "none" : "0 4px 15px var(--accent-dim)",
          }}
        >
          {isPropagating ? (
            <><span style={{ color: "#eab308" }}>⏸</span> Pausar</>
          ) : (
            <>▶ Espalhar Opiniões</>
          )}
        </motion.button>
      )}
      
      {isComplete && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            marginLeft: "1rem",
            background: "var(--accent-dim)", border: "1px solid var(--accent-glow)",
            color: "var(--accent)", padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-md)", fontSize: "0.95rem", fontWeight: 800,
            flexShrink: 0, display: "flex", alignItems: "center", gap: 6
          }}>
          ✓ Concluído
        </motion.div>
      )}
    </div>
  );
}