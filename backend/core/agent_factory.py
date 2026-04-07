import asyncio
import logging
import uuid
from models.agent import Agent, PersonaProfile, OpinionState, FunnelStage, score_to_intent, INTENT_COLORS
from models.simulation import Simulation, ProductDefinition
from llm import groq_client
from llm.prompts import build_persona_prompt, build_opinion_prompt

logger = logging.getLogger(__name__)

PERSONA_BATCH_SIZE = 20
OPINION_BATCH_SIZE = 10
MAX_CONCURRENT_PERSONA = 5
MAX_CONCURRENT_OPINION = 8


async def generate_agents(simulation: Simulation, progress_cb=None) -> list[Agent]:
    total = simulation.agent_count
    total_batches = (total + PERSONA_BATCH_SIZE - 1) // PERSONA_BATCH_SIZE
    batch_sizes = []
    remaining = total
    for i in range(total_batches):
        size = min(PERSONA_BATCH_SIZE, remaining)
        batch_sizes.append(size)
        remaining -= size

    sem = asyncio.Semaphore(MAX_CONCURRENT_PERSONA)
    tasks = [
        _generate_persona_batch(simulation, size, i, total_batches, sem)
        for i, size in enumerate(batch_sizes)
    ]

    agents: list[Agent] = []
    completed_batches = 0
    for coro in asyncio.as_completed(tasks):
        batch = await coro
        agents.extend(batch)
        completed_batches += 1
        if progress_cb:
            pct = (completed_batches / total_batches) * 50  # first 50%
            await progress_cb("generating_personas", pct)

    logger.info(f"Generated {len(agents)} agent personas")

    # Form opinions in batches
    opinion_batches = [
        agents[i:i + OPINION_BATCH_SIZE]
        for i in range(0, len(agents), OPINION_BATCH_SIZE)
    ]
    sem2 = asyncio.Semaphore(MAX_CONCURRENT_OPINION)
    opinion_tasks = [
        _form_opinion_batch(batch, simulation.product, sem2)
        for batch in opinion_batches
    ]

    completed_opinion = 0
    for coro in asyncio.as_completed(opinion_tasks):
        await coro
        completed_opinion += 1
        if progress_cb:
            pct = 50 + (completed_opinion / len(opinion_tasks)) * 50  # second 50%
            await progress_cb("forming_opinions", pct)

    logger.info(f"Formed opinions for {len(agents)} agents")
    return agents


async def _generate_persona_batch(
    simulation: Simulation, count: int, batch_index: int,
    total_batches: int, sem: asyncio.Semaphore
) -> list[Agent]:
    async with sem:
        prompt = build_persona_prompt(
            simulation.audience, count, batch_index, total_batches
        )
        try:
            raw = await groq_client.complete(prompt, max_tokens=4096)
            personas = groq_client.parse_json_array(raw)
        except Exception as e:
            logger.error(f"Persona batch {batch_index} failed: {e}")
            return [_make_fallback_agent(simulation.id) for _ in range(count)]

        agents = []
        for p in personas[:count]:
            try:
                agent = _persona_dict_to_agent(p, simulation.id)
                agents.append(agent)
            except Exception as e:
                logger.warning(f"Skipping malformed persona: {e}")

        # Fill missing with fallbacks
        while len(agents) < count:
            agents.append(_make_fallback_agent(simulation.id))

        return agents


async def _form_opinion_batch(
    agents: list[Agent], product: ProductDefinition, sem: asyncio.Semaphore
) -> None:
    async with sem:
        agents_data = [
            {
                "idx": i + 1,
                "name": a.name,
                "age": a.profile.age,
                "city": a.profile.city,
                "income_class": a.profile.income_class,
                "values": a.profile.values,
                "pain_points": a.profile.pain_points,
                "digital_savviness": a.profile.digital_savviness,
                "risk_tolerance": a.profile.risk_tolerance,
            }
            for i, a in enumerate(agents)
        ]
        prompt = build_opinion_prompt(agents_data, product)
        try:
            raw = await groq_client.complete(prompt, max_tokens=2048)
            opinions = groq_client.parse_json_array(raw)
        except Exception as e:
            logger.error(f"Opinion batch failed: {e}")
            opinions = []

        # Map by index (1-based) — much more reliable than UUID echo
        opinion_map = {o.get("idx"): o for o in opinions if isinstance(o, dict) and "idx" in o}

        for i, agent in enumerate(agents):
            op_data = opinion_map.get(i + 1)
            if op_data:
                score = float(op_data.get("score", 0.0))
                score = max(-1.0, min(1.0, score))
                agent.opinion = OpinionState(
                    score=score,
                    confidence=float(op_data.get("confidence", 0.5)),
                    reasoning=str(op_data.get("reasoning", "")),
                    key_objection=op_data.get("key_objection"),
                    price_sensitivity_score=float(op_data.get("price_sensitivity_score", 0.5)),
                    history=[score],
                )
                agent.intent = score_to_intent(score)
                agent.has_opinion = True
            else:
                # Fallback: neutral opinion
                agent.opinion = OpinionState(score=0.0, confidence=0.3, history=[0.0])
                agent.intent = FunnelStage.UNAWARE
                agent.has_opinion = True


def _persona_dict_to_agent(data: dict, simulation_id: str) -> Agent:
    profile = PersonaProfile(
        age=int(data.get("age", 30)),
        gender=str(data.get("gender", "masculino")),
        city=str(data.get("city", "São Paulo")),
        income_class=str(data.get("income_class", "B")),
        education=str(data.get("education", "superior completo")),
        occupation=str(data.get("occupation", "profissional")),
        digital_savviness=float(data.get("digital_savviness", 0.5)),
        risk_tolerance=float(data.get("risk_tolerance", 0.5)),
        brand_loyalty=float(data.get("brand_loyalty", 0.5)),
        interests=list(data.get("interests", [])),
        pain_points=list(data.get("pain_points", [])),
        values=list(data.get("values", [])),
        bio=str(data.get("bio", "")),
    )
    return Agent(
        id=str(uuid.uuid4()),
        simulation_id=simulation_id,
        name=str(data.get("name", "Persona")),
        profile=profile,
    )


def _make_fallback_agent(simulation_id: str) -> Agent:
    import random
    names = ["Ana Silva", "Carlos Souza", "Maria Oliveira", "João Santos",
             "Fernanda Costa", "Ricardo Lima", "Patricia Pereira", "Bruno Alves"]
    cities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba"]
    profile = PersonaProfile(
        age=random.randint(22, 55),
        gender=random.choice(["masculino", "feminino"]),
        city=random.choice(cities),
        income_class=random.choice(["B", "C"]),
        education="superior completo",
        occupation="profissional",
        digital_savviness=random.uniform(0.3, 0.9),
        risk_tolerance=random.uniform(0.2, 0.8),
        brand_loyalty=random.uniform(0.2, 0.8),
        interests=["tecnologia", "finanças"],
        pain_points=["falta de tempo", "custos elevados"],
        values=["praticidade", "economia"],
        bio="Profissional brasileiro buscando soluções práticas.",
    )
    return Agent(
        id=str(uuid.uuid4()),
        simulation_id=simulation_id,
        name=random.choice(names),
        profile=profile,
    )


