import math
import random
import uuid
import networkx as nx
from models.agent import Agent, INTENT_COLORS
from models.graph import GraphData, GraphNode, GraphEdge
from config import GRAPH_K_NEIGHBORS, GRAPH_REWIRE_PROB, INFLUENCER_TOP_PCT


def build_graph(agents: list[Agent], seed: int = 42) -> tuple[nx.Graph, GraphData]:
    n = len(agents)
    k = min(GRAPH_K_NEIGHBORS, n - 1)

    # Build Watts-Strogatz small-world graph with explicit seed for reproducibility
    G = nx.watts_strogatz_graph(n, k, GRAPH_REWIRE_PROB, seed=seed)

    # Map node index → agent
    idx_to_agent = {i: a for i, a in enumerate(agents)}

    # Assign communities by shared traits (simple clustering)
    communities = _assign_communities(agents)
    for i, agent in enumerate(agents):
        agent.community_id = communities[i]

    # Compute degree centrality and mark influencers
    degree_centrality = nx.degree_centrality(G)
    sorted_by_centrality = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)
    influencer_count = max(1, int(n * INFLUENCER_TOP_PCT))
    influencer_indices = {idx for idx, _ in sorted_by_centrality[:influencer_count]}

    for i, agent in enumerate(agents):
        agent.influence_score = degree_centrality[i]
        agent.is_influencer = i in influencer_indices

    # Compute force-directed layout positions
    pos = _compute_layout(G, agents, communities, seed=seed)

    # Build GraphData
    nodes = []
    for i, agent in enumerate(agents):
        x, y = pos[i]
        size = 5.0 + agent.influence_score * 15.0
        if agent.is_influencer:
            size += 5.0
        nodes.append(GraphNode(
            id=agent.id,
            label=agent.name,
            x=x * 1000,
            y=y * 1000,
            size=size,
            color=INTENT_COLORS[agent.intent],
            community=agent.community_id,
            intent=agent.intent.value,
            score=agent.opinion.score,
            is_influencer=agent.is_influencer,
        ))

    edges = []
    for u, v in G.edges():
        edges.append(GraphEdge(
            id=str(uuid.uuid4()),
            source=idx_to_agent[u].id,
            target=idx_to_agent[v].id,
            weight=1.0,
        ))

    # Store the mapping on the graph for the simulation engine
    G.graph["agent_ids"] = [a.id for a in agents]

    return G, GraphData(nodes=nodes, edges=edges)


def _assign_communities(agents: list[Agent]) -> list[int]:
    num_communities = max(5, len(agents) // 25)
    community_ids = []
    for agent in agents:
        # Hash by age bracket + first interest + income class
        age_bracket = agent.profile.age // 10
        interest_key = agent.profile.interests[0] if agent.profile.interests else "geral"
        income_key = agent.profile.income_class
        key = f"{age_bracket}-{interest_key[:4]}-{income_key}"
        community_id = hash(key) % num_communities
        community_ids.append(community_id)
    return community_ids


def _compute_layout(G: nx.Graph, agents: list[Agent], communities: list[int], seed: int = 42) -> dict:
    n = len(agents)
    num_communities = max(set(communities)) + 1

    rng = random.Random(seed)

    # Initialize positions with community-based clustering
    pos = {}
    for i in range(n):
        comm = communities[i]
        angle = (2 * math.pi * comm) / num_communities
        radius = 0.3 + rng.uniform(-0.1, 0.1)
        noise_x = rng.uniform(-0.08, 0.08)
        noise_y = rng.uniform(-0.08, 0.08)
        pos[i] = (
            math.cos(angle) * radius + noise_x,
            math.sin(angle) * radius + noise_y,
        )

    # Run spring layout with community-seeded positions for stability
    try:
        pos = nx.spring_layout(G, pos=pos, iterations=50, seed=seed, k=0.3)
    except Exception:
        pass

    return pos


def graph_to_adjacency(G: nx.Graph, agents: list[Agent]) -> dict[str, list[str]]:
    agent_ids = [a.id for a in agents]
    adjacency: dict[str, list[str]] = {a.id: [] for a in agents}
    for u, v in G.edges():
        uid = agent_ids[u]
        vid = agent_ids[v]
        adjacency[uid].append(vid)
        adjacency[vid].append(uid)
    return adjacency
