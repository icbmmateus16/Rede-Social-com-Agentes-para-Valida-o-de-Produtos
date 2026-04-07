import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { AudienceDefinition, ProductDefinition } from "../types";

const input: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  color: "var(--text-primary)",
  padding: "0.65rem 0.85rem",
  fontSize: "0.9rem",
  width: "100%",
  boxSizing: "border-box",
  outline: "none",
};

const label: React.CSSProperties = {
  display: "block",
  color: "var(--text-secondary)",
  fontSize: "0.78rem",
  marginBottom: "0.4rem",
  fontWeight: 500,
};

const section: React.CSSProperties = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "1.5rem",
  marginBottom: "1rem",
};

function SectionHeader({ num, title, desc }: { num: string; title: string; desc?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "1.25rem" }}>
      <div style={{
        width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
        background: "var(--accent-dim)", color: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.72rem", fontWeight: 800, marginTop: 1,
      }}>{num}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>{title}</div>
        {desc && <div style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "0.4rem 1rem", borderRadius: "var(--radius-sm)", cursor: "pointer",
      background: active ? "var(--accent-dim)" : "var(--bg-elevated)",
      border: active ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--border)",
      color: active ? "var(--accent)" : "var(--text-muted)",
      fontSize: "0.84rem", fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
    }}>{children}</button>
  );
}

function TagInput({ value, onChange, placeholder }: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [inp, setInp] = useState("");
  const add = () => {
    const t = inp.trim();
    if (t && !value.includes(t)) { onChange([...value, t]); setInp(""); }
  };
  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
          {value.map((tag) => (
            <span key={tag} style={{
              background: "var(--accent-dim)", color: "var(--accent)",
              padding: "0.2rem 0.55rem", borderRadius: 99,
              fontSize: "0.78rem", display: "flex", alignItems: "center", gap: 4,
              border: "1px solid rgba(34,197,94,0.2)",
            }}>
              {tag}
              <button onClick={() => onChange(value.filter((t) => t !== tag))}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: "0.9rem" }}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...input, flex: 1 }} value={inp}
          onChange={(e) => setInp(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder || "Digite e pressione Enter"} />
        <button onClick={add} style={{
          background: "var(--bg-elevated)", border: "1px solid var(--border)",
          color: "var(--text-secondary)", padding: "0.65rem 0.85rem",
          borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.9rem",
        }}>+</button>
      </div>
    </div>
  );
}

const TEST_TEMPLATE = {
  name: "App de finanças pessoais - Teste",
  agentCount: 50,
  audience: {
    age_min: 25, age_max: 40,
    genders: ["masculino", "feminino"],
    income_classes: ["B"],
    cities: ["São Paulo"],
    interests: ["tecnologia", "produtividade", "finanças"],
    custom_description: "Pessoas que já usam pelo menos um app de banco digital (Nubank, Inter) e têm o hábito de acompanhar gastos. Preocupadas com dívidas mas sem disciplina financeira consolidada.",
  } as AudienceDefinition,
  product: {
    name: "App de finanças pessoais",
    category: "Software / App",
    description: "Aplicativo que organiza gastos, categoriza transações automaticamente via IA e sugere onde economizar, sem precisar conectar ao banco.",
    price_brl: 29.90,
    key_benefits: ["organização automática", "metas de economia", "relatórios mensais"],
    differentiators: ["Categoriza via IA sem conectar ao banco", "Sem taxa de configuração", "Interface mais simples que Mobills e Organizze"],
  } as ProductDefinition,
};

export default function NewSimulation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [agentCount, setAgentCount] = useState(50);

  const [audience, setAudience] = useState<AudienceDefinition>({
    age_min: 18, age_max: 55,
    genders: ["masculino", "feminino"],
    income_classes: ["B"],
    cities: ["São Paulo"],
    interests: [],
    custom_description: "",
  });

  const [product, setProduct] = useState<ProductDefinition>({
    name: "", category: "", description: "",
    price_brl: 0, key_benefits: [], differentiators: [],
  });

  const fillTemplate = () => {
    setName(TEST_TEMPLATE.name);
    setAgentCount(TEST_TEMPLATE.agentCount);
    setAudience(TEST_TEMPLATE.audience);
    setProduct(TEST_TEMPLATE.product);
  };

  const updateAudience = (patch: Partial<AudienceDefinition>) =>
    setAudience((prev) => ({ ...prev, ...patch }));
  const updateProduct = (patch: Partial<ProductDefinition>) =>
    setProduct((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async () => {
    if (!name || !product.name || !product.description) {
      setError("Preencha: nome da simulação, nome do produto e descrição.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const sim = await api.createSimulation({ name, audience, product, agent_count: agentCount });
      navigate(`/simulation/${sim.id}`);
    } catch (e: any) {
      setError(e.message || "Erro ao criar simulação");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", color: "var(--text-primary)", padding: "2rem" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "2rem" }}>
          <button onClick={() => navigate("/")} style={{
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", cursor: "pointer",
            fontSize: "0.8rem", padding: "0.35rem 0.7rem",
            borderRadius: "var(--radius-sm)", lineHeight: 1,
          }}>← Voltar</button>
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.3px" }}>
            Nova Simulação
          </h1>
          <button onClick={fillTemplate} style={{
            marginLeft: "auto",
            background: "var(--bg-surface)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", padding: "0.4rem 0.85rem",
            borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: "0.78rem",
          }}>⚡ Preencher com teste</button>
        </div>

        {/* Section 1: Informações */}
        <div style={section}>
          <SectionHeader num="1" title="Informações gerais" desc="Dê um nome para identificar esta simulação" />
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={label}>Nome da simulação</label>
            <input style={input} value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Teste app de finanças - SP" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <label style={{ ...label, marginBottom: 0 }}>Quantidade de agentes (pessoas simuladas)</label>
              <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem" }}>{agentCount}</span>
            </div>
            <input type="range" min={50} max={500} step={10} defaultValue={agentCount}
              onChange={(e) => setAgentCount(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
              <span>50 — rápido (~1 min)</span>
              <span>500 — completo (~5 min)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Público */}
        <div style={section}>
          <SectionHeader num="2" title="Público-alvo" desc="Quem você quer atingir com esse produto?" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={label}>Idade mínima</label>
              <input type="number" style={input} value={audience.age_min}
                onChange={(e) => updateAudience({ age_min: Number(e.target.value) })} />
            </div>
            <div>
              <label style={label}>Idade máxima</label>
              <input type="number" style={input} value={audience.age_max}
                onChange={(e) => updateAudience({ age_max: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Gênero</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["masculino", "feminino"].map((g) => (
                <ToggleButton key={g} active={audience.genders.includes(g)} onClick={() => {
                  const has = audience.genders.includes(g);
                  if (has && audience.genders.length === 1) return;
                  updateAudience({ genders: has ? audience.genders.filter((x) => x !== g) : [...audience.genders, g] });
                }}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </ToggleButton>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Classe de renda</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { key: "A", desc: "Alta" },
                { key: "B", desc: "Média-alta" },
                { key: "C", desc: "Média" },
                { key: "D", desc: "Baixa" },
              ].map(({ key: c, desc }) => (
                <ToggleButton key={c} active={audience.income_classes.includes(c)} onClick={() => {
                  const has = audience.income_classes.includes(c);
                  if (has && audience.income_classes.length === 1) return;
                  updateAudience({ income_classes: has ? audience.income_classes.filter((x) => x !== c) : [...audience.income_classes, c] });
                }}>
                  <span style={{ fontWeight: 700 }}>{c}</span>
                  <span style={{ fontSize: "0.68rem", display: "block", opacity: 0.7 }}>{desc}</span>
                </ToggleButton>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Cidades</label>
            <TagInput value={audience.cities} onChange={(v) => updateAudience({ cities: v })}
              placeholder="São Paulo, Rio de Janeiro..." />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Interesses principais</label>
            <TagInput value={audience.interests} onChange={(v) => updateAudience({ interests: v })}
              placeholder="tecnologia, finanças, saúde..." />
          </div>
          <div>
            <label style={label}>Contexto adicional <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional — melhora a qualidade)</span></label>
            <textarea style={{ ...input, height: 72, resize: "vertical" } as React.CSSProperties}
              value={audience.custom_description || ""}
              onChange={(e) => updateAudience({ custom_description: e.target.value })}
              placeholder="Ex: pessoas que já usam app de banco digital e se preocupam com dívidas..." />
          </div>
        </div>

        {/* Section 3: Produto */}
        <div style={section}>
          <SectionHeader num="3" title="Produto / Ideia" desc="O que você quer testar com esse público?" />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={label}>Nome do produto</label>
              <input style={input} value={product.name}
                onChange={(e) => updateProduct({ name: e.target.value })}
                placeholder="Ex: AppFinance" />
            </div>
            <div>
              <label style={label}>Preço mensal (R$)</label>
              <input type="number" style={input} value={product.price_brl || ""}
                onChange={(e) => updateProduct({ price_brl: Number(e.target.value) })}
                placeholder="29,90" />
            </div>
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Categoria</label>
            <input style={input} value={product.category}
              onChange={(e) => updateProduct({ category: e.target.value })}
              placeholder="Ex: Finanças pessoais, Saúde, Educação..." />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Descrição do produto</label>
            <textarea style={{ ...input, height: 90, resize: "vertical" } as React.CSSProperties}
              value={product.description}
              onChange={(e) => updateProduct({ description: e.target.value })}
              placeholder="O que faz, como funciona, para quem é. Explique como diria para um cliente..." />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={label}>Principais benefícios <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(um por vez, Enter para adicionar)</span></label>
            <TagInput value={product.key_benefits} onChange={(v) => updateProduct({ key_benefits: v })}
              placeholder="economiza tempo, fácil de usar..." />
          </div>
          <div>
            <label style={label}>Diferenciais vs. concorrência <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span></label>
            <TagInput value={product.differentiators} onChange={(v) => updateProduct({ differentiators: v })}
              placeholder="sem mensalidade mínima, sem burocracia..." />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#ef444415", border: "1px solid #ef444440",
            color: "#fca5a5", borderRadius: "var(--radius-sm)",
            padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.85rem",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%",
          background: loading ? "var(--bg-elevated)" : "var(--accent)",
          color: loading ? "var(--text-muted)" : "#000",
          border: "none", padding: "1rem",
          borderRadius: "var(--radius-md)",
          fontWeight: 800, fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: loading ? "none" : "0 0 24px rgba(34,197,94,0.25)",
          letterSpacing: "0.01em",
        }}>
          {loading ? "Iniciando simulação..." : "Iniciar Simulação →"}
        </button>
        <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 10 }}>
          A IA vai gerar {agentCount} pessoas e simular as reações ao seu produto
        </div>
      </div>
    </div>
  );
}