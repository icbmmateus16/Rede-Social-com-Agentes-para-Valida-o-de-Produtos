"""
Gera os gráficos de validação do MarketSim para o README.
Execute: python docs/generate_charts.py
Requer: pip install matplotlib networkx numpy
"""
import numpy as np
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
from pathlib import Path
import random

random.seed(42)
np.random.seed(42)

OUT = Path(__file__).parent / "screenshots"
OUT.mkdir(exist_ok=True)

DARK_BG   = "#0a0a0a"
SURFACE   = "#111111"
ACCENT    = "#22c55e"
BORDER    = "#1f1f1f"
TEXT      = "#e5e5e5"
TEXT_MUT  = "#6b7280"

COLORS = {
    "strong_buy": "#22c55e",
    "likely_buy": "#86efac",
    "neutral":    "#eab308",
    "unlikely":   "#f97316",
    "reject":     "#ef4444",
}

plt.rcParams.update({
    "figure.facecolor":  DARK_BG,
    "axes.facecolor":    SURFACE,
    "axes.edgecolor":    BORDER,
    "axes.labelcolor":   TEXT,
    "xtick.color":       TEXT_MUT,
    "ytick.color":       TEXT_MUT,
    "text.color":        TEXT,
    "grid.color":        BORDER,
    "grid.linewidth":    0.5,
    "font.family":       "sans-serif",
    "font.size":         11,
})

# ─────────────────────────────────────────────────────────────────────────────
# 1. DEGROOT: simulação de propagação de opiniões
# ─────────────────────────────────────────────────────────────────────────────
def simulate_degroot(n_agents=120, ticks=20, seed=42):
    rng = np.random.default_rng(seed)
    G = nx.watts_strogatz_graph(n_agents, 6, 0.15, seed=seed)

    # Scores iniciais variados (produto misto)
    scores = rng.uniform(-1, 1, n_agents)
    # Alguns segmentos com tendência específica
    scores[:30] = rng.uniform(0.3, 1.0, 30)   # early adopters
    scores[30:60] = rng.uniform(-0.2, 0.4, 30)  # céticos moderados
    scores[60:90] = rng.uniform(-1.0, -0.1, 30) # resistentes
    scores[90:] = rng.uniform(-0.3, 0.5, 30)   # neutros

    degree = dict(G.degree())
    max_deg = max(degree.values())
    influence = np.array([degree[i] / max_deg for i in range(n_agents)])
    is_influencer = influence > np.percentile(influence, 95)
    confidence = np.clip(np.abs(scores) * 0.8 + 0.2, 0.2, 0.9)

    history = [scores.copy()]
    SOCIAL_W = 0.35
    adj = {i: list(G.neighbors(i)) for i in range(n_agents)}

    for _ in range(ticks):
        new_scores = scores.copy()
        for i in range(n_agents):
            neighbors = adj[i]
            if not neighbors:
                continue
            weights = np.array([0.5 + influence[j] * 1.5 for j in neighbors])
            neighbor_avg = np.dot(scores[neighbors], weights) / weights.sum()
            sw = (1 - confidence[i]) * SOCIAL_W
            if is_influencer[i]:
                sw *= 0.3
            new_scores[i] = np.clip(scores[i] * (1 - sw) + neighbor_avg * sw, -1, 1)
        scores = new_scores
        history.append(scores.copy())

    return np.array(history), G, influence, is_influencer

def score_to_intent(s):
    if s >= 0.6:  return "strong_buy"
    if s >= 0.2:  return "likely_buy"
    if s >= -0.2: return "neutral"
    if s >= -0.6: return "unlikely"
    return "reject"

# ─────────────────────────────────────────────────────────────────────────────
# GRÁFICO 1: Evolução das opiniões ao longo dos ticks
# ─────────────────────────────────────────────────────────────────────────────
print("Gerando gráfico 1: Evolução de opiniões...")
history, G, influence, is_influencer = simulate_degroot()
ticks = history.shape[0]
labels = list(COLORS.keys())
label_names = {
    "strong_buy": "Quer comprar",
    "likely_buy": "Talvez compre",
    "neutral":    "Indiferente",
    "unlikely":   "Improvável",
    "reject":     "Rejeita",
}

intent_pcts = {k: [] for k in labels}
for t in range(ticks):
    intents = [score_to_intent(s) for s in history[t]]
    total = len(intents)
    for k in labels:
        intent_pcts[k].append(intents.count(k) / total * 100)

fig, axes = plt.subplots(1, 2, figsize=(14, 5.5), facecolor=DARK_BG)
fig.suptitle("Propagação de Opiniões — Modelo DeGroot", color=TEXT, fontsize=14, fontweight="bold", y=1.01)

# Área empilhada
ax = axes[0]
xs = list(range(ticks))
bottom = np.zeros(ticks)
for k in labels:
    vals = np.array(intent_pcts[k])
    ax.fill_between(xs, bottom, bottom + vals, color=COLORS[k], alpha=0.85, label=label_names[k])
    bottom += vals
ax.set_xlim(0, ticks - 1)
ax.set_ylim(0, 100)
ax.set_xlabel("Rodada de propagação", color=TEXT_MUT)
ax.set_ylabel("% de agentes", color=TEXT_MUT)
ax.set_title("Distribuição de intenção ao longo do tempo", color=TEXT, fontsize=11)
ax.legend(loc="upper left", framealpha=0.15, fontsize=9)
ax.grid(True, axis="y", alpha=0.3)
ax.set_facecolor(SURFACE)

# Score médio + conversão
ax2 = axes[1]
avg_scores = history.mean(axis=1)
conv_rate = np.array([
    (intent_pcts["strong_buy"][t] + intent_pcts["likely_buy"][t] * 0.5)
    for t in range(ticks)
])
ax2.plot(xs, avg_scores * 100, color=ACCENT, linewidth=2.5, label="Score médio (×100)")
ax2.plot(xs, conv_rate, color="#3b82f6", linewidth=2.5, linestyle="--", label="Taxa de conversão est. (%)")
ax2.axhline(y=0, color=BORDER, linewidth=1, linestyle=":")
ax2.set_xlim(0, ticks - 1)
ax2.set_xlabel("Rodada de propagação", color=TEXT_MUT)
ax2.set_ylabel("Valor", color=TEXT_MUT)
ax2.set_title("Score médio & Taxa de conversão estimada", color=TEXT, fontsize=11)
ax2.legend(framealpha=0.15, fontsize=9)
ax2.grid(True, alpha=0.3)
ax2.set_facecolor(SURFACE)

plt.tight_layout()
plt.savefig(OUT / "01_propagacao_opiniao.png", dpi=150, bbox_inches="tight", facecolor=DARK_BG)
plt.close()
print("  ✓ 01_propagacao_opiniao.png")

# ─────────────────────────────────────────────────────────────────────────────
# GRÁFICO 2: Rede social visualizada
# ─────────────────────────────────────────────────────────────────────────────
print("Gerando gráfico 2: Visualização da rede social...")
final_scores = history[-1]
final_intents = [score_to_intent(s) for s in final_scores]
node_colors = [COLORS[intent] for intent in final_intents]
node_sizes = [80 + influence[i] * 400 + (150 if is_influencer[i] else 0) for i in range(len(influence))]

fig, axes = plt.subplots(1, 2, figsize=(14, 6), facecolor=DARK_BG)
fig.suptitle("Rede Social Watts-Strogatz (n=120, k=6, p=0.15)", color=TEXT, fontsize=14, fontweight="bold")

# Estado inicial
ax = axes[0]
ax.set_facecolor(SURFACE)
init_intents = [score_to_intent(s) for s in history[0]]
init_colors = [COLORS[intent] for intent in init_intents]
pos = nx.spring_layout(G, seed=42, k=0.3)
nx.draw_networkx_edges(G, pos, ax=ax, alpha=0.08, edge_color="#ffffff", width=0.4)
nx.draw_networkx_nodes(G, pos, ax=ax, node_color=init_colors, node_size=node_sizes, alpha=0.9)
influencer_nodes = [i for i, v in enumerate(is_influencer) if v]
nx.draw_networkx_nodes(G, pos, nodelist=influencer_nodes, ax=ax,
                       node_color="none", node_size=[node_sizes[i] + 60 for i in influencer_nodes],
                       edgecolors="#a78bfa", linewidths=2.5)
ax.set_title("Estado inicial (opiniões pré-propagação)", color=TEXT, fontsize=10)
ax.axis("off")

# Estado final
ax2 = axes[1]
ax2.set_facecolor(SURFACE)
nx.draw_networkx_edges(G, pos, ax=ax2, alpha=0.08, edge_color="#ffffff", width=0.4)
nx.draw_networkx_nodes(G, pos, ax=ax2, node_color=node_colors, node_size=node_sizes, alpha=0.9)
nx.draw_networkx_nodes(G, pos, nodelist=influencer_nodes, ax=ax2,
                       node_color="none", node_size=[node_sizes[i] + 60 for i in influencer_nodes],
                       edgecolors="#a78bfa", linewidths=2.5)
ax2.set_title("Estado final (após 20 rodadas de propagação)", color=TEXT, fontsize=10)
ax2.axis("off")

# Legenda
patches = [mpatches.Patch(color=c, label=label_names[k]) for k, c in COLORS.items()]
patches.append(mpatches.Patch(facecolor="none", edgecolor="#a78bfa", label="Influenciador", linewidth=2))
fig.legend(handles=patches, loc="lower center", ncol=6, framealpha=0.1,
           fontsize=9, bbox_to_anchor=(0.5, -0.04))

plt.tight_layout()
plt.savefig(OUT / "02_rede_social.png", dpi=150, bbox_inches="tight", facecolor=DARK_BG)
plt.close()
print("  ✓ 02_rede_social.png")

# ─────────────────────────────────────────────────────────────────────────────
# GRÁFICO 3: Distribuição de influência + histograma de scores
# ─────────────────────────────────────────────────────────────────────────────
print("Gerando gráfico 3: Análise estatística dos agentes...")
fig, axes = plt.subplots(1, 3, figsize=(15, 5), facecolor=DARK_BG)
fig.suptitle("Análise Estatística dos Agentes", color=TEXT, fontsize=14, fontweight="bold")

# Histograma de scores iniciais
ax = axes[0]
ax.set_facecolor(SURFACE)
init_scores = history[0]
bins = np.linspace(-1, 1, 25)
counts, edges = np.histogram(init_scores, bins=bins)
for i, count in enumerate(counts):
    mid = (edges[i] + edges[i+1]) / 2
    ax.bar(edges[i], count, width=edges[i+1]-edges[i], color=COLORS[score_to_intent(mid)],
           edgecolor=DARK_BG, linewidth=0.5, alpha=0.9, align="edge")
ax.axvline(x=0, color=TEXT_MUT, linewidth=1, linestyle="--")
ax.set_xlabel("Score de opinião inicial", color=TEXT_MUT)
ax.set_ylabel("Nº de agentes", color=TEXT_MUT)
ax.set_title("Distribuição de opiniões iniciais", color=TEXT, fontsize=10)
ax.grid(True, axis="y", alpha=0.3)

# Histograma de scores finais
ax2 = axes[1]
ax2.set_facecolor(SURFACE)
counts2, edges2 = np.histogram(final_scores, bins=bins)
for i, count in enumerate(counts2):
    mid = (edges2[i] + edges2[i+1]) / 2
    ax2.bar(edges2[i], count, width=edges2[i+1]-edges2[i], color=COLORS[score_to_intent(mid)],
            edgecolor=DARK_BG, linewidth=0.5, alpha=0.9, align="edge")
ax2.axvline(x=0, color=TEXT_MUT, linewidth=1, linestyle="--")
ax2.axvline(x=final_scores.mean(), color=ACCENT, linewidth=1.5, linestyle="-", label=f"Média: {final_scores.mean():.2f}")
ax2.set_xlabel("Score de opinião final", color=TEXT_MUT)
ax2.set_ylabel("Nº de agentes", color=TEXT_MUT)
ax2.set_title("Distribuição de opiniões finais", color=TEXT, fontsize=10)
ax2.legend(framealpha=0.15, fontsize=9)
ax2.grid(True, axis="y", alpha=0.3)

# Distribuição de centralidade (influência)
ax3 = axes[2]
ax3.set_facecolor(SURFACE)
degree_vals = [d for _, d in G.degree()]
ax3.hist(degree_vals, bins=range(min(degree_vals), max(degree_vals) + 2),
         color="#3b82f6", edgecolor=DARK_BG, linewidth=0.5, alpha=0.9)
ax3.axvline(x=np.mean(degree_vals), color=ACCENT, linewidth=1.5, linestyle="--",
            label=f"Média: {np.mean(degree_vals):.1f} conexões")
n_inf = is_influencer.sum()
ax3.axvline(x=np.percentile(degree_vals, 95), color="#a78bfa", linewidth=1.5,
            linestyle=":", label=f"Top 5% influenciadores ({n_inf} agentes)")
ax3.set_xlabel("Grau de conexão (nº de vizinhos)", color=TEXT_MUT)
ax3.set_ylabel("Nº de agentes", color=TEXT_MUT)
ax3.set_title("Distribuição de conectividade da rede", color=TEXT, fontsize=10)
ax3.legend(framealpha=0.15, fontsize=9)
ax3.grid(True, axis="y", alpha=0.3)

plt.tight_layout()
plt.savefig(OUT / "03_analise_agentes.png", dpi=150, bbox_inches="tight", facecolor=DARK_BG)
plt.close()
print("  ✓ 03_analise_agentes.png")

# ─────────────────────────────────────────────────────────────────────────────
# GRÁFICO 4: Comparação com/sem influenciadores
# ─────────────────────────────────────────────────────────────────────────────
print("Gerando gráfico 4: Impacto dos influenciadores...")

def simulate_no_influencers(n_agents=120, ticks=20, seed=42):
    rng = np.random.default_rng(seed)
    G = nx.watts_strogatz_graph(n_agents, 6, 0.15, seed=seed)
    scores = rng.uniform(-1, 1, n_agents)
    scores[:30] = rng.uniform(0.3, 1.0, 30)
    scores[30:60] = rng.uniform(-0.2, 0.4, 30)
    scores[60:90] = rng.uniform(-1.0, -0.1, 30)
    scores[90:] = rng.uniform(-0.3, 0.5, 30)
    degree = dict(G.degree())
    max_deg = max(degree.values())
    influence_flat = np.ones(n_agents) * 0.5  # sem influenciadores
    confidence = np.clip(np.abs(scores) * 0.8 + 0.2, 0.2, 0.9)
    history = [scores.copy()]
    adj = {i: list(G.neighbors(i)) for i in range(n_agents)}
    for _ in range(ticks):
        new_scores = scores.copy()
        for i in range(n_agents):
            neighbors = adj[i]
            if not neighbors:
                continue
            weights = np.array([0.5 + influence_flat[j] * 1.5 for j in neighbors])
            neighbor_avg = np.dot(scores[neighbors], weights) / weights.sum()
            sw = (1 - confidence[i]) * 0.35
            new_scores[i] = np.clip(scores[i] * (1 - sw) + neighbor_avg * sw, -1, 1)
        scores = new_scores
        history.append(scores.copy())
    return np.array(history)

hist_no_inf = simulate_no_influencers()

fig, axes = plt.subplots(1, 2, figsize=(13, 5), facecolor=DARK_BG)
fig.suptitle("Impacto dos Influenciadores na Propagação", color=TEXT, fontsize=14, fontweight="bold")

def conv_rate_from_hist(h):
    rates = []
    for t in range(h.shape[0]):
        intents = [score_to_intent(s) for s in h[t]]
        total = len(intents)
        sb = intents.count("strong_buy") / total * 100
        lb = intents.count("likely_buy") / total * 100
        rates.append(sb + lb * 0.5)
    return rates

conv_with = conv_rate_from_hist(history)
conv_without = conv_rate_from_hist(hist_no_inf)
avg_with = history.mean(axis=1)
avg_without = hist_no_inf.mean(axis=1)
xs = list(range(len(conv_with)))

ax = axes[0]
ax.set_facecolor(SURFACE)
ax.plot(xs, conv_with, color=ACCENT, linewidth=2.5, label="Com influenciadores")
ax.plot(xs, conv_without, color="#f97316", linewidth=2.5, linestyle="--", label="Sem influenciadores")
ax.fill_between(xs, conv_with, conv_without, alpha=0.1, color=ACCENT)
ax.set_xlabel("Rodada", color=TEXT_MUT)
ax.set_ylabel("Taxa de conversão estimada (%)", color=TEXT_MUT)
ax.set_title("Taxa de conversão: com vs. sem influenciadores", color=TEXT, fontsize=10)
ax.legend(framealpha=0.15, fontsize=10)
ax.grid(True, alpha=0.3)

ax2 = axes[1]
ax2.set_facecolor(SURFACE)
ax2.plot(xs, avg_with, color=ACCENT, linewidth=2.5, label="Com influenciadores")
ax2.plot(xs, avg_without, color="#f97316", linewidth=2.5, linestyle="--", label="Sem influenciadores")
ax2.axhline(y=0, color=TEXT_MUT, linewidth=1, linestyle=":")
ax2.set_xlabel("Rodada", color=TEXT_MUT)
ax2.set_ylabel("Score médio de opinião", color=TEXT_MUT)
ax2.set_title("Score médio: com vs. sem influenciadores", color=TEXT, fontsize=10)
ax2.legend(framealpha=0.15, fontsize=10)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig(OUT / "04_impacto_influenciadores.png", dpi=150, bbox_inches="tight", facecolor=DARK_BG)
plt.close()
print("  ✓ 04_impacto_influenciadores.png")

# ─────────────────────────────────────────────────────────────────────────────
# GRÁFICO 5: Propriedades small-world vs random
# ─────────────────────────────────────────────────────────────────────────────
print("Gerando gráfico 5: Propriedades small-world...")
n = 120
ps = [0.0, 0.01, 0.05, 0.1, 0.15, 0.3, 0.5, 1.0]
clustering = []
path_len = []
for p in ps:
    G_test = nx.watts_strogatz_graph(n, 6, p, seed=42)
    clustering.append(nx.average_clustering(G_test))
    try:
        path_len.append(nx.average_shortest_path_length(G_test))
    except Exception:
        path_len.append(float("nan"))

c0, l0 = clustering[0], path_len[0]
c_norm = [c / c0 for c in clustering]
l_norm = [l / l0 if not np.isnan(l) else np.nan for l in path_len]

fig, ax = plt.subplots(figsize=(8, 5), facecolor=DARK_BG)
ax.set_facecolor(SURFACE)
ax.plot(ps, c_norm, color=ACCENT, linewidth=2.5, marker="o", markersize=7, label="Coef. de agrupamento C(p)/C(0)")
ax.plot(ps, l_norm, color="#3b82f6", linewidth=2.5, marker="s", markersize=7, label="Distância média L(p)/L(0)")
ax.axvline(x=0.15, color="#a78bfa", linewidth=1.5, linestyle="--", label="p=0.15 (configuração MarketSim)")
ax.fill_betweenx([0, 1.1], 0.05, 0.3, alpha=0.05, color=ACCENT, label="Região small-world")
ax.set_xscale("log")
ax.set_xlim(0.005, 1.0)
ax.set_ylim(0, 1.1)
ax.set_xlabel("Probabilidade de reconexão (p)", color=TEXT_MUT)
ax.set_ylabel("Valor normalizado", color=TEXT_MUT)
ax.set_title("Fenômeno Small-World: alta clusterização + distâncias curtas\n(rede Watts-Strogatz, n=120, k=6)", color=TEXT, fontsize=11)
ax.legend(framealpha=0.15, fontsize=9)
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(OUT / "05_small_world.png", dpi=150, bbox_inches="tight", facecolor=DARK_BG)
plt.close()
print("  ✓ 05_small_world.png")

print(f"\n✅ Todos os gráficos gerados em: {OUT.resolve()}")
print("\nAdicione ao README.md:")
print("  ![Propagação](docs/screenshots/01_propagacao_opiniao.png)")
print("  ![Rede Social](docs/screenshots/02_rede_social.png)")
print("  ![Análise](docs/screenshots/03_analise_agentes.png)")
print("  ![Influenciadores](docs/screenshots/04_impacto_influenciadores.png)")
print("  ![Small-World](docs/screenshots/05_small_world.png)")
