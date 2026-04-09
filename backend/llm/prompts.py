def build_persona_prompt(audience, count: int, batch_index: int, total_batches: int) -> str:
    age_range = _batch_age_range(audience.age_min, audience.age_max, batch_index, total_batches)
    interests_str = ", ".join(audience.interests) if audience.interests else "variados"
    cities_str = ", ".join(audience.cities)
    genders_str = ", ".join(audience.genders)
    income_str = ", ".join(audience.income_classes)
    custom = f"\nContexto adicional: {audience.custom_description}" if audience.custom_description else ""

    return f"""Você é um gerador de personas para pesquisa de mercado brasileira.
Gere exatamente {count} personas distintas e realistas.
Retorne APENAS um array JSON válido. Sem markdown, sem explicações, sem texto extra.

Público-alvo:
- Idade: {age_range[0]}-{age_range[1]} anos (neste batch)
- Gêneros: {genders_str}
- Classes: {income_str}
- Cidades: {cities_str}
- Interesses: {interests_str}{custom}

Diversidade obrigatória neste batch (batch {batch_index+1} de {total_batches}):
- Varie digital_savviness de 0.2 a 0.95
- Inclua ao menos 1 pessoa com alta brand_loyalty (>0.8)
- Inclua ao menos 1 pessoa cética de novidades (risk_tolerance < 0.3)
- Misture ocupações reais do Brasil

Schema exato de cada objeto:
{{
  "name": "Nome Sobrenome brasileiro",
  "age": numero,
  "gender": "masculino" ou "feminino",
  "city": "cidade do Brasil",
  "income_class": "A" ou "B" ou "C" ou "D",
  "education": "ensino médio" ou "superior incompleto" ou "superior completo" ou "pós-graduação",
  "occupation": "ocupação real",
  "digital_savviness": 0.0 a 1.0,
  "risk_tolerance": 0.0 a 1.0,
  "brand_loyalty": 0.0 a 1.0,
  "interests": ["interesse1", "interesse2", "interesse3"],
  "pain_points": ["dor1", "dor2"],
  "values": ["valor1", "valor2"],
  "bio": "2 frases descrevendo a pessoa e seu contexto de vida"
}}

Retorne o array JSON agora:"""


def build_opinion_prompt(agents_data: list[dict], product) -> str:
    benefits_str = ", ".join(product.key_benefits) if product.key_benefits else "não especificados"
    diff_str = ", ".join(product.differentiators) if product.differentiators else "não especificados"
    agents_json = "\n".join([
        f'{a["idx"]}. {a["name"]}, {a["age"]}a, {a["city"]}, classe {a["income_class"]} | '
        f'valores: {", ".join(a["values"][:2])} | dores: {", ".join(a["pain_points"][:2])} | '
        f'digital: {a["digital_savviness"]:.1f}, risco: {a["risk_tolerance"]:.1f}'
        for a in agents_data
    ])

    return f"""Você avalia como cada pessoa reage a um produto/serviço.
Retorne APENAS um array JSON válido. Sem markdown, sem texto extra.

PRODUTO:
Nome: {product.name}
Categoria: {product.category}
Descrição: {product.description}
Preço: R$ {product.price_brl:.2f}/mês
Benefícios: {benefits_str}
Diferenciais: {diff_str}

PESSOAS A AVALIAR:
{agents_json}

Para cada pessoa, retorne exatamente um objeto com:
{{
  "idx": numero (o mesmo numero da lista acima),
  "score": numero de -1.0 (rejeita fortemente) a 1.0 (quer muito comprar),
  "confidence": 0.0 a 1.0 (certeza da opinião),
  "reasoning": "1 frase explicando a reação desta pessoa específica",
  "key_objection": "principal objeção ou null se score positivo",
  "price_sensitivity_score": 0.0 a 1.0
}}

Considere: renda, valores, dores, maturidade digital e tolerância a risco de cada pessoa.
Retorne o array JSON com {len(agents_data)} objetos agora:"""


def build_report_prompt(metrics, top_reasonings: list[str], top_objections: list[str],
                        product, audience) -> str:
    reasonings_str = "\n".join([f"- {r}" for r in top_reasonings[:20]])
    objections_str = "\n".join([f"- {o}" for o in top_objections[:15]])

    return f"""Você é um analista de pesquisa de mercado sênior. Sintetize os resultados abaixo.

PRODUTO: {product.name} — R${product.price_brl:.2f}/mês
PÚBLICO: {", ".join(audience.cities)}, {audience.age_min}-{audience.age_max} anos

MÉTRICAS DA SIMULAÇÃO:
- Comprou: {metrics.purchased_pct:.1f}%
- Considerando: {metrics.considering_pct:.1f}%
- Consciente: {metrics.aware_pct:.1f}%
- Desconhece: {metrics.unaware_pct:.1f}%
- Rejeitou: {metrics.rejected_pct:.1f}%
- Score médio: {metrics.avg_opinion_score:.2f} (-1 a +1)
- Taxa de conversão estimada: {metrics.estimated_conversion_rate:.1f}%

AMOSTRA DE RACIOCÍNIOS DOS CONSUMIDORES:
{reasonings_str}

PRINCIPAIS OBJEÇÕES:
{objections_str}

Retorne APENAS um JSON válido com esta estrutura:
{{
  "executive_summary": "3 parágrafos: resultado geral, perfil do comprador, principais riscos",
  "segments": [
    {{"name": "Nome do segmento", "description": "quem são, por que compram/não compram", "size_pct": numero}},
    {{"name": "...", "description": "...", "size_pct": numero}},
    {{"name": "...", "description": "...", "size_pct": numero}}
  ],
  "top_objections": [
    {{"objection": "texto", "frequency": "alta/média/baixa", "suggested_response": "como endereçar"}},
    {{"objection": "...", "frequency": "...", "suggested_response": "..."}},
    {{"objection": "...", "frequency": "...", "suggested_response": "..."}}
  ],
  "recommendations": [
    "recomendação estratégica 1",
    "recomendação estratégica 2",
    "recomendação estratégica 3"
  ],
  "pricing_insight": "análise sobre o preço: está adequado, caro ou barato para este público?"
}}"""


def build_critique_prompt(draft_report: dict, metrics, product) -> str:
    """
    Pass 2: Send the draft report back to the LLM for a self-critique.
    The model checks for internal consistency and improves where needed.
    """
    import json
    return f"""Você é um analista sênior revisando um relatório de pesquisa de mercado.
Revise o relatório abaixo e corrija inconsistências com os dados reais.

MÉTRICAS REAIS DA SIMULAÇÃO:
- Comprou: {metrics.purchased_pct:.1f}%
- Considerando: {metrics.considering_pct:.1f}%
- Consciente: {metrics.aware_pct:.1f}%
- Desconhece: {metrics.unaware_pct:.1f}%
- Rejeitou: {metrics.rejected_pct:.1f}%
- Score médio de opinião: {metrics.avg_opinion_score:.3f} (escala -1 a +1)
- Taxa de conversão estimada: {metrics.estimated_conversion_rate:.1f}%

PRODUTO: {product.name} — R${product.price_brl:.2f}/mês

RELATÓRIO DRAFT PARA REVISÃO:
{json.dumps(draft_report, ensure_ascii=False, indent=2)}

CRITÉRIOS DE REVISÃO:
1. O executive_summary é específico para ESTE produto e ESTES dados? (não genérico)
2. Se rejected_pct > 40%, o pricing_insight menciona resistência de preço?
3. As recomendações são coerentes com os percentuais de rejeição/adoção?
4. Os segmentos somam aproximadamente 100%?
5. As sugestões de resposta às objeções são práticas e específicas?

Retorne APENAS um JSON com a mesma estrutura do draft, melhorado onde necessário.
Se o draft já estiver correto em algum campo, mantenha-o igual.
Não adicione campos novos. Não remova campos existentes."""


def _batch_age_range(age_min: int, age_max: int, batch_index: int, total_batches: int):
    span = age_max - age_min
    step = span / total_batches
    start = int(age_min + batch_index * step)
    end = int(age_min + (batch_index + 1) * step)
    return start, min(end, age_max)
