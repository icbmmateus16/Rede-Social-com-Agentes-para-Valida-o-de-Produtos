import logging
from collections import Counter
from datetime import datetime
from itertools import islice
from math import sqrt
import numpy as np
from models.agent import Agent, FunnelStage
from models.simulation import Simulation, SimulationMetrics, SimulationReport
from llm import groq_client
from llm.prompts import build_report_prompt, build_critique_prompt

logger = logging.getLogger(__name__)


def compute_metrics(agents: list[Agent]) -> SimulationMetrics:
    if not agents:
        return SimulationMetrics()

    n = len(agents)
    counts = Counter(a.intent for a in agents)

    purchased = counts.get(FunnelStage.PURCHASED, 0)
    considering = counts.get(FunnelStage.CONSIDERING, 0)
    aware = counts.get(FunnelStage.AWARE, 0)
    unaware = counts.get(FunnelStage.UNAWARE, 0)
    rejected = counts.get(FunnelStage.REJECTED, 0)

    scores = np.array([a.opinion.score for a in agents])
    avg_score = float(np.mean(scores))

    # Confidence interval (95%) for the opinion score distribution
    std = float(np.std(scores))
    ci_margin = 1.96 * std / sqrt(n) if n > 1 else 0.0
    ci_low = round(avg_score - ci_margin, 3)
    ci_high = round(avg_score + ci_margin, 3)

    # Top objections
    objections = [
        a.opinion.key_objection
        for a in agents
        if a.opinion.key_objection
    ]
    top_objections = [obj for obj, _ in Counter(objections).most_common(5)]

    # Top motivators (from positive agents' reasoning)
    positive_reasonings = [
        a.opinion.reasoning
        for a in agents
        if a.opinion.score > 0.2 and a.opinion.reasoning
    ]
    top_motivators = positive_reasonings[:5]

    conversion_rate = (purchased + considering * 0.5) / n * 100

    return SimulationMetrics(
        purchased_pct=round(purchased / n * 100, 1),
        considering_pct=round(considering / n * 100, 1),
        aware_pct=round(aware / n * 100, 1),
        unaware_pct=round(unaware / n * 100, 1),
        rejected_pct=round(rejected / n * 100, 1),
        avg_opinion_score=round(avg_score, 3),
        top_objections=top_objections,
        top_motivators=top_motivators,
        estimated_conversion_rate=round(conversion_rate, 1),
        opinion_score_std=round(std, 3),
        opinion_ci_low=ci_low,
        opinion_ci_high=ci_high,
    )


async def generate_report(simulation: Simulation, agents: list[Agent]) -> SimulationReport:
    metrics = compute_metrics(agents)

    # Sample reasonings from all intent buckets
    top_reasonings = []
    for intent in FunnelStage:
        bucket = (a.opinion.reasoning for a in agents if a.intent == intent and a.opinion.reasoning)
        top_reasonings.extend(islice(bucket, 5))

    # Top objections list
    objections = [
        a.opinion.key_objection
        for a in agents
        if a.opinion.key_objection
    ]
    top_objections = [obj for obj, _ in Counter(objections).most_common(15)]

    prompt = build_report_prompt(metrics, top_reasonings, top_objections,
                                  simulation.product, simulation.audience)

    generation_passes = 1
    try:
        # Pass 1: Generate draft report
        raw_draft = await groq_client.complete(prompt, max_tokens=2000)
        draft_data = groq_client.parse_json_object(raw_draft)

        # Pass 2: Self-critique — check internal consistency
        final_data = draft_data
        if draft_data:
            critique_prompt = build_critique_prompt(draft_data, metrics, simulation.product)
            try:
                raw_critique = await groq_client.complete(critique_prompt, max_tokens=2000)
                critique_data = groq_client.parse_json_object(raw_critique)
                if critique_data:
                    final_data = critique_data
                    generation_passes = 2
            except Exception as e:
                logger.warning(f"Critique pass failed (using draft): {e}")

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        final_data = {}

    return SimulationReport(
        executive_summary=final_data.get("executive_summary", "Relatório não disponível."),
        segments=final_data.get("segments", []),
        top_objections=final_data.get("top_objections", []),
        recommendations=final_data.get("recommendations", []),
        pricing_insight=final_data.get("pricing_insight", ""),
        generated_at=datetime.utcnow(),
        generation_passes=generation_passes,
    )
