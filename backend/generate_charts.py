import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import os
import networkx as nx

plt.style.use('dark_background')
sns.set_theme(style="darkgrid", rc={
    "axes.facecolor": "#0c0c0e",
    "figure.facecolor": "#060608",
    "grid.color": "#222222",
    "text.color": "#e2e8f0",
    "axes.labelcolor": "#a1a1aa",
    "xtick.color": "#a1a1aa",
    "ytick.color": "#a1a1aa",
    "font.family": "sans-serif"
})

static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
os.makedirs(static_dir, exist_ok=True)

np.random.seed(42)

# --- Gráfico 1: Funil (Já existia) ---
ticks = np.arange(0, 30)
unaware = 100 * np.exp(-0.35 * ticks)
aware = 100 * (1 - np.exp(-0.35 * ticks)) * np.exp(-0.15 * ticks)
considering = 100 * (1 - np.exp(-0.20 * ticks)) * np.exp(-0.10 * ticks)
adopted = 100 * (1 - np.exp(-0.12 * ticks))

fig, ax = plt.subplots(figsize=(10, 5), dpi=300)
ax.fill_between(ticks, 0, adopted, color='#22c55e', alpha=0.4, label='Adopted')
ax.plot(ticks, adopted, color='#22c55e', linewidth=2.5)
ax.fill_between(ticks, adopted, adopted + considering, color='#eab308', alpha=0.4, label='Considering')
ax.fill_between(ticks, adopted + considering, adopted + considering + aware, color='#3b82f6', alpha=0.4, label='Aware')
ax.fill_between(ticks, adopted + considering + aware, 100, color='#ef4444', alpha=0.2, label='Rejected')
ax.set_title("1. Propagação B2B (Massa do Funil por Tick)", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax.legend(facecolor='#16161a', loc='lower right')
plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'chart_1_funnel.png'), transparent=False)
plt.close()

# --- Gráfico 2: Bayesian Psychometrics (Já existia) ---
n_agents = 500
risk_tolerance = np.random.normal(loc=0.6, scale=0.2, size=n_agents)
price_sens = np.random.normal(loc=0.5, scale=0.25, size=n_agents)
score = np.clip((0.7 * risk_tolerance) - (0.4 * price_sens) + np.random.normal(0, 0.1, n_agents), -1, 1)

df = pd.DataFrame({'Preço': price_sens, 'Risco': risk_tolerance, 'Score': score})
fig2, ax2 = plt.subplots(figsize=(10, 5), dpi=300)
sns.scatterplot(data=df, x='Preço', y='Risco', hue='Score', palette='RdYlGn', s=80, alpha=0.8, ax=ax2, legend=False)
sns.kdeplot(data=df, x='Preço', y='Risco', levels=5, color="#ff4500", linewidths=1.5, alpha=0.6, ax=ax2)
ax2.set_title("2. Mapa Psicométrico B2B (Sensibilidade Preço vs Tolerância Risco)", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'chart_2_bayes.png'), transparent=False)
plt.close()

# --- Gráfico 3: Choques de Mercado (Picos de Adoção) ---
market_reaction = np.diff(adopted, prepend=0)
shock_ticks = [5, 12, 18, 25]
for s in shock_ticks:
    market_reaction[s] += np.random.uniform(2, 5)  # Simulate viral influence event
    
fig3, ax3 = plt.subplots(figsize=(10, 5), dpi=300)
ax3.plot(ticks, market_reaction, color='#8b5cf6', linewidth=2.5, marker='o')
for s in shock_ticks:
    ax3.axvline(x=s, color='#ff4500', linestyle='--', alpha=0.7)
    ax3.annotate('Market Shock (Influencer)', xy=(s, market_reaction[s]), xytext=(s-2, market_reaction[s]+2),
                 arrowprops=dict(facecolor='#ff4500', shrink=0.05), color='#ff4500', fontsize=9)
ax3.set_title("3. Elasticidade Social: Resposta a 'Market Shocks'", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax3.set_xlabel("Ticks")
ax3.set_ylabel("Nova Adoção (Δ)")
plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'chart_3_shocks.png'), transparent=False)
plt.close()

# --- Gráfico 4: Curva de Atrito de Preço ---
prices = np.linspace(10, 500, 50)
adoption_prob = 1 / (1 + np.exp(0.02 * (prices - 250))) # Logistic friction
fig4, ax4 = plt.subplots(figsize=(10, 5), dpi=300)
ax4.plot(prices, adoption_prob * 100, color='#f97316', linewidth=3)
ax4.fill_between(prices, 0, adoption_prob * 100, color='#f97316', alpha=0.2)
ax4.axhline(y=50, color='#64748b', linestyle=':')
ax4.axvline(x=250, color='#64748b', linestyle=':')
ax4.text(260, 55, 'Ponto Crítico de Fricção', color='#94a3b8')
ax4.set_title("4. Atrito de Precificação: Elasticidade da Probabilidade de Adoção", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax4.set_xlabel("Preço do Produto ($)")
ax4.set_ylabel("Máx. Adoção Projetada (%)")
plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'chart_4_friction.png'), transparent=False)
plt.close()

# --- Gráfico 5: Topologia de Rede ---
G = nx.barabasi_albert_graph(150, 2)
fig5, ax5 = plt.subplots(figsize=(10, 5), dpi=300)
pos = nx.spring_layout(G, seed=42)
nx.draw_networkx_nodes(G, pos, node_size=30, node_color='#0ea5e9', alpha=0.8, ax=ax5)
nx.draw_networkx_edges(G, pos, edge_color='#ffffff', alpha=0.1, ax=ax5)
ax5.set_title("5. Renderezição da Topologia Social do Grafo", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax5.axis('off')
plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'chart_5_topology.png'), transparent=False)
plt.close()

print("5 novos graficos complexos gerados em static/")
