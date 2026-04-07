import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
import os

# Configuração de estilo escuro premium B2B
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

# -----------------------------------------------------
# GRÁFICO 1: Propagação de Funil Bayesiano ao longo de 20 Ticks
# -----------------------------------------------------
ticks = np.arange(0, 21)
# Simulando a progressão epidêmica do modelo SIR adaptada para o funil
unaware = 100 * np.exp(-0.35 * ticks)
aware = 100 * (1 - np.exp(-0.35 * ticks)) * np.exp(-0.15 * ticks)
considering = 100 * (1 - np.exp(-0.20 * ticks)) * np.exp(-0.10 * ticks)
adopted = 100 * (1 - np.exp(-0.12 * ticks))
rejected = 100 - (unaware + aware + considering + adopted)

fig, ax = plt.subplots(figsize=(10, 5), dpi=300)

ax.fill_between(ticks, 0, adopted, color='#22c55e', alpha=0.4, label='Adopted (Comprou)')
ax.plot(ticks, adopted, color='#22c55e', linewidth=2.5)

ax.fill_between(ticks, adopted, adopted + considering, color='#eab308', alpha=0.4, label='Considering')
ax.plot(ticks, adopted + considering, color='#eab308', linewidth=2.5)

ax.fill_between(ticks, adopted + considering, adopted + considering + aware, color='#3b82f6', alpha=0.4, label='Aware')
ax.plot(ticks, adopted + considering + aware, color='#3b82f6', linewidth=2.5)

ax.fill_between(ticks, adopted + considering + aware, 100, color='#ef4444', alpha=0.2, label='Rejected')

ax.set_title("Propagação de Adoção de Produto B2B (Tick Dynamics)", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax.set_xlabel("Ciclos de Simulação (Ticks)", fontsize=11)
ax.set_ylabel("Massa do Mercado (%)", fontsize=11)
ax.legend(loc='upper right', facecolor='#16161a', edgecolor='#ffffff33', fontsize=9)
ax.set_xlim(0, 20)
ax.set_ylim(0, 100)

plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'funnel_dynamics.png'), transparent=True)
plt.close()

# -----------------------------------------------------
# GRÁFICO 2: Densidade do Preço vs Propensão à Compra
# -----------------------------------------------------
np.random.seed(42)  # Seed fixa para consistência no readme
n_agents = 500

# Simulando um produto premium com resistência moderada
risk_tolerance = np.random.normal(loc=0.6, scale=0.2, size=n_agents)
price_sensitivity = np.random.normal(loc=0.5, scale=0.25, size=n_agents)

# A intenção é modelada via regressão linear para separar as pontuações do Funil simulado
opinion_score = (0.7 * risk_tolerance) - (0.4 * price_sensitivity) + np.random.normal(0, 0.1, n_agents)
opinion_score = np.clip(opinion_score, -1, 1)

df = pd.DataFrame({
    'Sensibilidade ao Preço': price_sensitivity,
    'Tolerância Risco': risk_tolerance,
    'Score Bayesiano': opinion_score
})

fig2, ax2 = plt.subplots(figsize=(10, 5), dpi=300)

scatter = sns.scatterplot(
    data=df, x='Sensibilidade ao Preço', y='Tolerância Risco',
    hue='Score Bayesiano', palette='RdYlGn', s=80, alpha=0.8, edgecolor='none', ax=ax2
)

sns.kdeplot(
    data=df, x='Sensibilidade ao Preço', y='Tolerância Risco',
    levels=5, color="#ff4500", linewidths=1.5, alpha=0.6, ax=ax2
)

ax2.set_title("Distribuição Psicométrica (Tolerância ao Risco vs Preço)", fontsize=14, pad=15, fontweight='bold', color="#ffffff")
ax2.set_xlim(0, 1)
ax2.set_ylim(0, 1)

# Customizando a legenda para o layout Dark
norm = plt.Normalize(-1, 1)
sm = plt.cm.ScalarMappable(cmap="RdYlGn", norm=norm)
sm.set_array([])
ax2.get_legend().remove()
cbar = fig2.colorbar(sm, ax=ax2, pad=0.02, aspect=30)
cbar.set_label('Intenção de Compra (Grau)', rotation=270, labelpad=15, color="#a1a1aa", fontsize=10)
cbar.ax.tick_params(colors="#a1a1aa")

plt.tight_layout()
plt.savefig(os.path.join(static_dir, 'market_distribution.png'), transparent=True)
plt.close()

print("Graficos gerados com sucesso no diretório static/")
