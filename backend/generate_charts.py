import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.animation import FuncAnimation, PillowWriter
from matplotlib.colors import LinearSegmentedColormap
import numpy as np
import networkx as nx
import os

# ── Style ──────────────────────────────────────────────────────────────────────
BG     = "#060608"
PANEL  = "#0c0c0e"
GRID   = "#1a1a1e"
TEXT   = "#e2e8f0"
MUTED  = "#71717a"

C_GREEN    = "#22c55e"
C_YELLOW   = "#eab308"
C_BLUE     = "#3b82f6"
C_RED      = "#ef4444"
C_PURPLE   = "#8b5cf6"
C_ORANGE   = "#f97316"
C_GRAY     = "#52525b"
C_CYAN     = "#06b6d4"

plt.rcParams.update({
    "figure.facecolor":    BG,
    "axes.facecolor":      PANEL,
    "axes.edgecolor":      GRID,
    "grid.color":          GRID,
    "text.color":          TEXT,
    "axes.labelcolor":     MUTED,
    "xtick.color":         MUTED,
    "ytick.color":         MUTED,
    "axes.grid":           True,
    "grid.linestyle":      "--",
    "grid.alpha":          0.4,
    "font.family":         "DejaVu Sans",
    "legend.facecolor":    "#111114",
    "legend.edgecolor":    GRID,
    "legend.labelcolor":   TEXT,
})

static_dir = os.path.join(os.path.dirname(__file__), '..', 'static')
os.makedirs(static_dir, exist_ok=True)

np.random.seed(42)
TICKS = np.arange(0, 30)


def save(fig, name):
    fig.savefig(os.path.join(static_dir, name), dpi=150, bbox_inches='tight', facecolor=BG)
    plt.close(fig)
    print(f"  OK {name}")


# ── Chart 1: Funnel Dynamics ───────────────────────────────────────────────────
unaware    = 100 * np.exp(-0.35 * TICKS)
aware      = 100 * (1 - np.exp(-0.35 * TICKS)) * np.exp(-0.15 * TICKS)
considering= 100 * (1 - np.exp(-0.20 * TICKS)) * np.exp(-0.10 * TICKS)
adopted    = 100 * (1 - np.exp(-0.12 * TICKS))

fig, ax = plt.subplots(figsize=(11, 5))
ax.fill_between(TICKS, 0,               adopted,                       color=C_GREEN,  alpha=0.35, label='Adopted')
ax.plot        (TICKS, adopted,          color=C_GREEN,  linewidth=2.5)
ax.fill_between(TICKS, adopted,          adopted + considering,         color=C_YELLOW, alpha=0.35, label='Considering')
ax.fill_between(TICKS, adopted+considering, adopted+considering+aware,  color=C_BLUE,   alpha=0.35, label='Aware')
ax.fill_between(TICKS, adopted+considering+aware, 100,                  color=C_RED,    alpha=0.15, label='Unaware')
ax.set_title("Sales Funnel Propagation  ·  Opinion Diffusion per Tick", fontsize=13, pad=12, fontweight='bold', color=TEXT)
ax.set_xlabel("Propagation Tick")
ax.set_ylabel("Agent Population (%)")
ax.legend(loc='lower right')
ax.set_xlim(0, 29)
save(fig, 'chart_1_funnel.png')


# ── Chart 2: Psychometric Scatter ──────────────────────────────────────────────
n = 500
risk   = np.random.normal(0.6, 0.2,  n).clip(0, 1)
price  = np.random.normal(0.5, 0.25, n).clip(0, 1)
score  = np.clip(0.7 * risk - 0.4 * price + np.random.normal(0, 0.1, n), -1, 1)

cmap = LinearSegmentedColormap.from_list("opinion", [C_RED, C_YELLOW, C_GREEN])
fig, ax = plt.subplots(figsize=(11, 5))
sc = ax.scatter(price, risk, c=score, cmap=cmap, s=60, alpha=0.75, linewidths=0)
cb = fig.colorbar(sc, ax=ax, pad=0.01)
cb.set_label("Opinion Score", color=MUTED)
cb.ax.yaxis.set_tick_params(color=MUTED)
plt.setp(cb.ax.yaxis.get_ticklabels(), color=MUTED)

# KDE overlay (manual, no seaborn/pandas)
from matplotlib.patches import Ellipse
for cx, cy, w, h in [(0.35, 0.75, 0.25, 0.30), (0.65, 0.40, 0.30, 0.25)]:
    for scale in [0.5, 1.0, 1.5]:
        e = Ellipse((cx, cy), w*scale, h*scale, angle=15, linewidth=1.2,
                    edgecolor=C_ORANGE, facecolor='none', alpha=0.5/scale)
        ax.add_patch(e)

ax.set_xlabel("Price Sensitivity")
ax.set_ylabel("Risk Tolerance")
ax.set_title("Psychometric B2B Map  ·  Bayesian Agent Distribution", fontsize=13, pad=12, fontweight='bold', color=TEXT)
save(fig, 'chart_2_bayes.png')


# ── Chart 3: Market Shocks ─────────────────────────────────────────────────────
delta = np.diff(adopted, prepend=0)
shock_ticks = [5, 12, 18, 25]
for s in shock_ticks:
    delta[s] += np.random.uniform(2.5, 5.5)

fig, ax = plt.subplots(figsize=(11, 5))
ax.plot(TICKS, delta, color=C_PURPLE, linewidth=2.5, zorder=3)
ax.fill_between(TICKS, 0, delta, color=C_PURPLE, alpha=0.15)
for s in shock_ticks:
    ax.axvline(x=s, color=C_RED, linestyle='--', alpha=0.6, linewidth=1.5)
    ax.annotate('Influencer Shock', xy=(s, delta[s]),
                xytext=(s + 0.5, delta[s] + 1.5),
                arrowprops=dict(arrowstyle='->', color=C_RED, lw=1.5),
                color=C_RED, fontsize=8, fontweight='bold')
ax.set_title("Social Elasticity  ·  Adoption Response to Market Shocks", fontsize=13, pad=12, fontweight='bold', color=TEXT)
ax.set_xlabel("Propagation Tick")
ax.set_ylabel("New Adoptions (Δ per tick)")
save(fig, 'chart_3_shocks.png')


# ── Chart 4: Price Friction Curve ──────────────────────────────────────────────
prices = np.linspace(10, 500, 200)
prob   = 1 / (1 + np.exp(0.02 * (prices - 250)))

fig, ax = plt.subplots(figsize=(11, 5))
ax.plot(prices, prob * 100, color=C_ORANGE, linewidth=3)
ax.fill_between(prices, 0, prob * 100, color=C_ORANGE, alpha=0.18)
ax.axhline(50, color=MUTED, linestyle=':', linewidth=1.2)
ax.axvline(250, color=MUTED, linestyle=':', linewidth=1.2)
ax.text(260, 52, 'Inflection Point', color=MUTED, fontsize=9)
ax.set_title("Logistic Price Friction  ·  Adoption Probability vs. Ticket", fontsize=13, pad=12, fontweight='bold', color=TEXT)
ax.set_xlabel("Product Price ($)")
ax.set_ylabel("Max Projected Adoption (%)")
save(fig, 'chart_4_friction.png')


# ── Chart 5: Network Topology ──────────────────────────────────────────────────
G5 = nx.watts_strogatz_graph(120, 6, 0.15, seed=42)
pos5 = nx.spring_layout(G5, seed=42, k=0.5)

degree = np.array([d for _, d in G5.degree()])
node_colors5 = [C_CYAN if d >= 8 else C_BLUE for d in degree]
node_sizes5  = [120 if d >= 8 else 40 for d in degree]

fig, ax = plt.subplots(figsize=(11, 7), facecolor=BG)
ax.set_facecolor(PANEL)
nx.draw_networkx_edges(G5, pos5, edge_color=GRID, alpha=0.5, ax=ax, width=0.6)
nx.draw_networkx_nodes(G5, pos5, node_color=node_colors5, node_size=node_sizes5, alpha=0.9, ax=ax)
ax.set_title("Watts-Strogatz Small-World Topology  ·  Influencer Hubs Highlighted", fontsize=13, pad=12, fontweight='bold', color=TEXT)
ax.axis('off')
save(fig, 'chart_5_topology.png')


# ── Chart 6: Homophily Weight Heatmap ─────────────────────────────────────────
# Visualises _homophily_weight(a, b): base 0.5 + score * 0.5
# score = age_bonus + income_bonus + interest_bonus (max 1.0)
age_deltas   = np.arange(0, 45, 5)     # |age_a - age_b|
shared_ints  = np.arange(0, 5)         # number of shared interests

income_match_cases = {"Same Income": 0.3, "Diff Income": 0.0}
fig, axes = plt.subplots(1, 2, figsize=(13, 5), sharey=True)

for ax, (label, inc_bonus) in zip(axes, income_match_cases.items()):
    Z = np.zeros((len(shared_ints), len(age_deltas)))
    for i, si in enumerate(shared_ints):
        for j, ad in enumerate(age_deltas):
            age_bonus  = 0.3 if ad <= 10 else 0.0
            int_bonus  = min(0.4, si * 0.1)
            raw_score  = age_bonus + inc_bonus + int_bonus
            Z[i, j]    = 0.5 + raw_score * 0.5

    cmap6 = LinearSegmentedColormap.from_list("hom", [C_RED, C_YELLOW, C_GREEN])
    im = ax.imshow(Z, aspect='auto', cmap=cmap6, vmin=0.5, vmax=1.0,
                   origin='lower', extent=[-2.5, 42.5, -0.5, 4.5])
    ax.set_xticks(age_deltas)
    ax.set_yticks(shared_ints)
    ax.set_xlabel("Age Delta (years)")
    ax.set_ylabel("Shared Interests" if ax == axes[0] else "")
    ax.set_title(f"Homophily Weight  ·  {label}", fontsize=11, pad=8, color=TEXT, fontweight='bold')
    ax.tick_color = MUTED
    fig.colorbar(im, ax=ax, label="Weight [0.5 – 1.0]", pad=0.01)

fig.suptitle("Social Homophily Model  ·  _homophily_weight(a, b) → [0.5, 1.0]",
             fontsize=13, fontweight='bold', color=TEXT, y=1.02)
save(fig, 'chart_6_homophily.png')


# ── Chart 7: Confidence Decay ──────────────────────────────────────────────────
DECAY_RATE = 0.02
ticks7  = np.arange(0, 21)
starts  = [0.95, 0.75, 0.55, 0.30]
colors7 = [C_GREEN, C_CYAN, C_YELLOW, C_ORANGE]
labels7 = ["High confidence (0.95)", "Med-high (0.75)", "Med-low (0.55)", "Low (0.30)"]

fig, ax = plt.subplots(figsize=(11, 5))
for s, c, lbl in zip(starts, colors7, labels7):
    decay = np.maximum(0.1, s * (1 - DECAY_RATE * ticks7))
    ax.plot(ticks7, decay, color=c, linewidth=2.5, label=lbl)
    ax.fill_between(ticks7, 0.1, decay, color=c, alpha=0.08)

ax.axhline(0.1, color=MUTED, linestyle=':', linewidth=1.2, label='Floor (0.1)')
ax.set_title("Temporal Confidence Decay  ·  Prior Resistance Under Social Pressure",
             fontsize=13, pad=12, fontweight='bold', color=TEXT)
ax.set_xlabel("Propagation Tick")
ax.set_ylabel("Agent Confidence in Prior")
ax.set_xlim(0, 20)
ax.set_ylim(0, 1.05)
ax.legend(loc='upper right')
save(fig, 'chart_7_decay.png')


# ── Animated GIF v2: Opinion Propagation on Network ───────────────────────────
print("  Generating anim_propagation.gif (enhanced, ~45s)...")

N_NODES = 90
G_anim   = nx.watts_strogatz_graph(N_NODES, 6, 0.15, seed=42)
pos_anim = nx.spring_layout(G_anim, seed=42, k=1.4, iterations=120)

# State color palette
SC = {
    'unaware':     '#2d3748',   # dark slate
    'aware':       '#3b82f6',   # blue
    'considering': '#eab308',   # amber
    'adopted':     '#22c55e',   # green
    'rejected':    '#111827',   # near-black
}

# Node sizes based on degree (influencer hubs are larger)
deg       = dict(G_anim.degree())
top6      = set(sorted(deg, key=deg.get, reverse=True)[:6])
next6     = set(sorted(deg, key=deg.get, reverse=True)[6:12])

nodes_order = list(G_anim.nodes())
node_to_idx = {n: i for i, n in enumerate(nodes_order)}
pos_arr     = np.array([[pos_anim[n][0], pos_anim[n][1]] for n in nodes_order])
size_arr    = np.array([220 if n in top6 else (130 if n in next6 else 65) for n in nodes_order])

# Initial states: top influencers start 'considering', next tier 'aware', rest 'unaware'
init_states = {}
for n in G_anim.nodes():
    if n in top6:   init_states[n] = 'considering'
    elif n in next6: init_states[n] = 'aware'
    else:            init_states[n] = 'unaware'

def propagate_v2(states, rng):
    new = states.copy()
    for node in G_anim.nodes():
        nbrs = list(G_anim.neighbors(node))
        if not nbrs: continue
        ns = [states[n] for n in nbrs]
        cur = states[node]
        n_ad  = ns.count('adopted')
        n_co  = ns.count('considering')
        n_aw  = ns.count('aware')
        n_rj  = ns.count('rejected')
        k     = len(nbrs)

        if cur == 'unaware':
            social = (n_aw * 0.4 + n_co * 1.2 + n_ad * 2.2) / k
            if rng.random() < min(0.28 * social, 0.88):
                new[node] = 'aware'
        elif cur == 'aware':
            # 13% base spontaneous + social boost
            social = (n_co + n_ad * 1.8) / k
            if rng.random() < 0.13 + 0.32 * social:
                new[node] = 'considering'
        elif cur == 'considering':
            social_pos = (n_ad * 2.0 + n_co * 0.5) / k
            social_neg = (n_rj * 1.5) / k
            if rng.random() < 0.30 + 0.38 * social_pos:
                new[node] = 'adopted'
            elif social_neg > 0.45 and rng.random() < 0.10:
                new[node] = 'rejected'
    return new

N_FRAMES = 28
all_states = [init_states]
cur_s = init_states
for t in range(N_FRAMES - 1):
    cur_s = propagate_v2(cur_s, np.random.RandomState(7 + t))
    all_states.append(cur_s)

edges_arr = list(G_anim.edges())

# Legend (built once, reused)
leg_order   = ['adopted', 'considering', 'aware', 'unaware', 'rejected']
leg_labels  = {'adopted': 'Adopted', 'considering': 'Considering',
               'aware': 'Aware', 'unaware': 'Unaware', 'rejected': 'Rejected'}
leg_patches = [mpatches.Patch(color=SC[s], label=leg_labels[s]) for s in leg_order]

fig_anim = plt.figure(figsize=(12, 8.5), facecolor=BG)
ax_anim  = fig_anim.add_axes([0, 0.09, 1, 0.88], facecolor=BG)
ax_bar   = fig_anim.add_axes([0.06, 0.025, 0.88, 0.038], facecolor=BG)

def draw_frame(frame):
    ax_anim.cla()
    ax_anim.axis('off')
    ax_bar.cla()
    ax_bar.axis('off')

    sf   = all_states[frame]
    prev = all_states[max(0, frame - 1)]
    counts = {s: sum(1 for v in sf.values() if v == s) for s in SC}

    just_changed   = {n for n in nodes_order if sf[n] != prev[n]}
    adopted_idx    = [node_to_idx[n] for n in nodes_order if sf[n] == 'adopted']
    consid_idx     = [node_to_idx[n] for n in nodes_order if sf[n] == 'considering']
    changed_idx    = [node_to_idx[n] for n in just_changed]

    # ── Edges ─────────────────────────────────────────────────────────────────
    for u, v in edges_arr:
        su, sv = sf[u], sf[v]
        if su == 'adopted' and sv == 'adopted':
            ec, al, lw = C_GREEN,  0.30, 1.1
        elif 'adopted' in (su, sv) or ('considering' in (su, sv)):
            ec, al, lw = C_YELLOW, 0.15, 0.7
        elif 'aware' in (su, sv):
            ec, al, lw = C_BLUE,   0.10, 0.5
        else:
            ec, al, lw = '#1e2330', 0.30, 0.4
        ax_anim.plot([pos_anim[u][0], pos_anim[v][0]],
                     [pos_anim[u][1], pos_anim[v][1]],
                     color=ec, alpha=al, linewidth=lw, zorder=1, solid_capstyle='round')

    # ── Glow layers ───────────────────────────────────────────────────────────
    if adopted_idx:
        ap = pos_arr[adopted_idx]
        as_ = size_arr[adopted_idx]
        ax_anim.scatter(ap[:, 0], ap[:, 1], s=as_ * 7, c=C_GREEN,  alpha=0.04, zorder=2, linewidths=0)
        ax_anim.scatter(ap[:, 0], ap[:, 1], s=as_ * 3, c=C_GREEN,  alpha=0.10, zorder=2, linewidths=0)
    if consid_idx:
        cp = pos_arr[consid_idx]
        cs = size_arr[consid_idx]
        ax_anim.scatter(cp[:, 0], cp[:, 1], s=cs * 4, c=C_YELLOW, alpha=0.07, zorder=2, linewidths=0)

    # ── Main nodes ────────────────────────────────────────────────────────────
    node_colors = [SC[sf[n]] for n in nodes_order]
    ec_colors   = ['#ffffff' if n in top6 else '#ffffff44' for n in nodes_order]
    ax_anim.scatter(pos_arr[:, 0], pos_arr[:, 1],
                    s=size_arr, c=node_colors, alpha=0.96, zorder=3,
                    linewidths=0.7, edgecolors='#ffffff33')

    # ── Pulse ring on freshly transitioned nodes ───────────────────────────────
    if changed_idx:
        ax_anim.scatter(pos_arr[changed_idx, 0], pos_arr[changed_idx, 1],
                        s=size_arr[changed_idx] * 4, c='none',
                        edgecolors='white', linewidths=1.8, alpha=0.55, zorder=4)

    # ── Title ─────────────────────────────────────────────────────────────────
    adopted_pct = 100 * counts['adopted'] / N_NODES
    ax_anim.set_title(
        f"Tick  {frame:02d} / {N_FRAMES-1}     "
        f"Adopted  {counts['adopted']} ({adopted_pct:.0f}%)     "
        f"Considering  {counts['considering']}     "
        f"Aware  {counts['aware']}     "
        f"Rejected  {counts['rejected']}",
        fontsize=10.5, pad=8, fontweight='bold', color=TEXT
    )
    ax_anim.legend(handles=leg_patches, loc='lower right', fontsize=9,
                   facecolor='#0a0a0d', edgecolor='#1e1e24', labelcolor=TEXT,
                   framealpha=0.92, borderpad=0.9, labelspacing=0.4)

    # ── Stacked progress bar ──────────────────────────────────────────────────
    ax_bar.set_xlim(0, N_NODES)
    ax_bar.set_ylim(0, 1)
    x = 0
    for state, color in [('adopted', C_GREEN), ('considering', C_YELLOW),
                          ('aware', C_BLUE), ('unaware', '#2d3748'), ('rejected', '#111827')]:
        w = counts[state]
        if w > 0:
            ax_bar.barh(0.5, w, left=x, height=0.85, color=color, alpha=0.88, linewidth=0)
            x += w
    # Tick cursor
    ax_bar.axvline(N_NODES * frame / (N_FRAMES - 1), color='white', alpha=0.35, linewidth=1.2)

anim = FuncAnimation(fig_anim, draw_frame, frames=N_FRAMES, interval=400, blit=False)
writer = PillowWriter(fps=2.5)
anim.save(os.path.join(static_dir, 'anim_propagation.gif'), writer=writer, dpi=108)
plt.close(fig_anim)
print("  OK anim_propagation.gif")

print("\nAll charts generated in static/")
