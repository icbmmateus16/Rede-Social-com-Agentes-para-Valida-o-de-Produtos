import logging
from collections import Counter
from datetime import datetime
from itertools import islice
from models.agent import Agent, PurchaseIntent
from models.simulation import Simulation, SimulationMetrics, SimulationReport
from llm import groq_client
from llm.prompts import build_report_prompt

logger = logging.getLogger(__name__)


def compute_metrics(agents: list[Agent]) -> SimulationMetrics:
    if not agents:
        return SimulationMetrics()

    n = len(agents)
    counts = Counter(a.intent for a in agents)

    strong_buy = counts.get(PurchaseIntent.STRONG_BUY, 0)
    likely_buy = counts.get(PurchaseIntent.LIKELY_BUY, 0)
    neutral = counts.get(PurchaseIntent.NEUTRAL, 0)
    unlikely = counts.get(PurchaseIntent.UNLIKELY, 0)
    reject = counts.get(PurchaseIntent.REJECT, 0)

    avg_score = sum(a.opinion.score for a in agents) / n

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

    conversion_rate = (strong_buy + likely_buy * 0.5) / n * 100

    return SimulationMetrics(
        strong_buy_pct=round(strong_buy / n * 100, 1),
        likely_buy_pct=round(likely_buy / n * 100, 1),
        neutral_pct=round(neutral / n * 100, 1),
        unlikely_pct=round(unlikely / n * 100, 1),
        reject_pct=round(reject / n * 100, 1),
        avg_opinion_score=round(avg_score, 3),
        top_objections=top_objections,
        top_motivators=top_motivators,
        estimated_conversion_rate=round(conversion_rate, 1),
    )


async def generate_report(simulation: Simulation, agents: list[Agent]) -> SimulationReport:
    metrics = compute_metrics(agents)

    # Sample reasonings from all intent buckets
    top_reasonings = []
    for intent in PurchaseIntent:
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

    try:
        raw = await groq_client.complete(prompt, max_tokens=2000)
        data = groq_client.parse_json_object(raw)
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        data = {}

    return SimulationReport(
        executive_summary=data.get("executive_summary", "Relatório não disponível."),
        segments=data.get("segments", []),
        top_objections=data.get("top_objections", []),
        recommendations=data.get("recommendations", []),
        pricing_insight=data.get("pricing_insight", ""),
        generated_at=datetime.utcnow(),
    )
