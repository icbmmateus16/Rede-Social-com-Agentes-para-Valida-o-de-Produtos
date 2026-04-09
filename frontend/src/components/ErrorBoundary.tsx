import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            padding: "2rem",
            background: "var(--bg-base, #0a0a0b)",
            color: "var(--text-primary, #e4e4e7)",
            fontFamily: "var(--font-mono, monospace)",
          }}
        >
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "12px",
              padding: "2rem 2.5rem",
              maxWidth: 500,
              width: "100%",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠</div>
            <h2
              style={{
                margin: "0 0 0.75rem",
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "#ef4444",
              }}
            >
              Erro inesperado
            </h2>
            <pre
              style={{
                fontSize: "0.75rem",
                color: "rgba(239,68,68,0.7)",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "6px",
                padding: "0.75rem",
                textAlign: "left",
                overflow: "auto",
                maxHeight: 120,
                margin: "0 0 1.5rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: "var(--accent, #a78bfa)",
                color: "#000",
                border: "none",
                padding: "0.65rem 1.5rem",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
