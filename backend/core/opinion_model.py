import random
from models.agent import Agent, FunnelStage, score_to_intent, INTENT_COLORS
from config import SOCIAL_PRESSURE_WEIGHT, CONFIDENCE_DECAY_RATE


def _homophily_weight(agent_a: Agent, agent_b: Agent) -> float:
    """
    Returns a similarity weight in [0.5, 1.0].
    Higher value = stronger mutual influence between agents.
    """
    score = 0.0
    # Same age bracket (±10 years) — shared life context
    if abs(agent_a.profile.age - agent_b.profile.age) <= 10:
        score += 0.3
    # Same income class — similar purchasing power
    if agent_a.profile.income_class == agent_b.profile.income_class:
        score += 0.3
    # Shared interests — common topics of conversation
    shared = set(agent_a.profile.interests) & set(agent_b.profile.interests)
    score += min(0.4, len(shared) * 0.1)
    return 0.5 + score * 0.5  # clamp to [0.5, 1.0]


def run_tick(
    agents: list[Agent],
    adjacency: dict[str, list[str]],
    tick: int,
    seed: int = 42,
) -> list[dict]:
    """
    Funnel Propagation Model (Awareness → Consideration → Purchase).
    Incorporates:
    - Bayesian social updates weighted by homophily
    - Temporal confidence decay (agents become more susceptible over time)
    - Price resistance
    - Market shock mechanics (deterministic per tick via seeded RNG)
    """
    agent_map = {a.id: a for a in agents}
    new_scores: dict[str, float] = {}
    events: list[dict] = []

    # Deterministic RNG seeded per-tick — same seed+tick always produces same result
    rng = random.Random(seed + tick)

    # Market Shock: 15% chance per tick for a viral momentum event
    market_shock = 0.0
    if tick > 2 and rng.random() < 0.15:
        market_shock = rng.uniform(-0.15, 0.25)

    for agent in agents:
        if not agent.has_opinion:
            continue

        neighbors = adjacency.get(agent.id, [])
        informed_neighbors = [
            agent_map[nid] for nid in neighbors
            if nid in agent_map and agent_map[nid].has_opinion
        ]

        if not informed_neighbors:
            new_scores[agent.id] = agent.opinion.score
            continue

        # Weighted neighbor influence — scaled by influence score AND homophily
        total_weight = 0.0
        weighted_sum = 0.0
        for neighbor in informed_neighbors:
            influence = 0.5 + neighbor.influence_score * 2.0
            similarity = _homophily_weight(agent, neighbor)
            w = influence * similarity
            weighted_sum += neighbor.opinion.score * w
            total_weight += w

        neighbor_avg = weighted_sum / total_weight if total_weight > 0 else 0.0

        # Temporal confidence decay — agents become more open to social influence over time
        decayed_confidence = agent.opinion.confidence * (1.0 - CONFIDENCE_DECAY_RATE * tick)
        decayed_confidence = max(0.1, decayed_confidence)

        # Bayesian-style update using decayed confidence as prior weight
        prior_weight = decayed_confidence
        social_weight = (1.0 - prior_weight) * SOCIAL_PRESSURE_WEIGHT

        if agent.is_influencer:
            social_weight *= 0.2  # Influencers resist peer pressure heavily

        # Price and Risk friction (if social pressure pushes toward purchase)
        price_friction = 0.0
        if neighbor_avg > 0.2:
            price_friction = (agent.opinion.price_sensitivity_score * 0.15) + (agent.profile.risk_tolerance * 0.05)

        base_update = agent.opinion.score * (1.0 - social_weight) + neighbor_avg * social_weight

        # Apply shock selectively: digitally-savvy agents feel viral momentum more
        shock_effect = market_shock if agent.profile.digital_savviness > 0.5 else market_shock * 0.3

        new_score = base_update - price_friction + shock_effect
        new_score = max(-1.0, min(1.0, new_score))
        new_scores[agent.id] = new_score

    # Apply updates and generate events
    for agent in agents:
        if agent.id not in new_scores:
            continue
        old_score = agent.opinion.score
        new_score = new_scores[agent.id]
        old_intent = agent.intent

        agent.opinion.score = new_score
        agent.opinion.history.append(new_score)
        agent.intent = score_to_intent(new_score)

        if agent.intent != old_intent:
            agent.tick_of_change = tick
            neighbors = adjacency.get(agent.id, [])
            informed = [
                nid for nid in neighbors
                if nid in agent_map and agent_map[nid].has_opinion
            ]
            influencers = [
                nid for nid in informed
                if agent_map.get(nid) and agent_map[nid].is_influencer
            ]
            influenced_by = influencers[:2] if influencers else informed[:2]
            agent.influenced_by = influenced_by

            events.append({
                "agent_id": agent.id,
                "agent_name": agent.name,
                "from_intent": old_intent.value,
                "to_intent": agent.intent.value,
                "from_score": round(old_score, 3),
                "to_score": round(new_score, 3),
                "influenced_by": influenced_by,
                "tick": tick,
            })

    return events


def build_node_updates(agents: list[Agent]) -> list[dict]:
    return [
        {
            "id": a.id,
            "color": INTENT_COLORS[a.intent],
            "score": round(a.opinion.score, 3),
            "intent": a.intent.value,
            "size": round(5.0 + a.influence_score * 15.0 + (5.0 if a.is_influencer else 0.0), 2),
            "is_influencer": a.is_influencer,
            "community": a.community_id,
        }
        for a in agents
    ]
