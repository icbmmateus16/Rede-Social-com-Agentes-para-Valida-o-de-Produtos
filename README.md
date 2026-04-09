<div align="center">

# 📊 MarketSim B2B Engine v3.0

<div align="right">
  <img src="https://img.shields.io/badge/Arquitetura-Neural_Graph-09090b?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Arquitetura" />
  <img src="https://img.shields.io/badge/Status-v3.0_Stable-22c55e?style=for-the-badge&logo=rocket&logoColor=white" alt="Status" />
</div>

**O Motor de Inteligência de Enxames (Swarm Intelligence) Focado em Validação de Produto.**
<br/>
*A Predictive Sandbox for Reverse Adoption & Go-To-Market Strategies*

[![React JS](https://img.shields.io/badge/Frontend-React%20%2B%20Remotion-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Bayesian-009688?style=flat-square&logo=fastapi&logoColor=white)](#)
[![Groq LLM](https://img.shields.io/badge/LLM-Groq%20Cloud-f97316?style=flat-square)](#)
[![Homophily](https://img.shields.io/badge/Model-Homophily%20%2B%20Temporal%20Decay-8b5cf6?style=flat-square)](#)
[![2-Pass Report](https://img.shields.io/badge/AI%20Report-2--Pass%20Self--Critique-22c55e?style=flat-square)](#)
[![WS Reconnect](https://img.shields.io/badge/WebSocket-Auto--Reconnect-f59e0b?style=flat-square)](#)
[![Atomic Storage](https://img.shields.io/badge/Storage-Atomic%20Writes-0ea5e9?style=flat-square)](#)

[English](./README-EN.md) | [Documentação em Português](./README.md)

</div>

**MarketSim B2B Engine** é uma plataforma de simulação preditiva de próxima geração impulsionada por LLMs e Agentes Autônomos Bayesianos. Em vez de testar um GTM (Go-to-Market) arriscando capital real, o sistema processa personas, objeções reais, influência de mercado e atrito de adoção em um ambiente seguro (*Sandbox*). Crie mundos digitais paralelos para prever como seu produto escalará entre os clientes.

> Você só precisa: Inserir a descrição do seu produto, o preço (Ticket) e o público alvo.</br>
> O MarketSim constrói: Um ecossistema de centenas de personas que navegam por um **Funil de Vendas Real**, gerando de forma orgânica um painel de inteligência reverso.

### Por que o MarketSim é diferente?

- **Simulação com Física Real:** Renderização do grafo relacional em interface rica e reativa (desenvolvido com `Framer Motion` e `Remotion`).
- **Choques de Mercado:** Integra eventos autônomos gerados por LLM simulando *Word-of-Mouth* e influenciadores digitais impactando o funil de adoção em tempo real.
- **Teoria Bayesiana com Homofilia:** Agentes similares (idade, renda, interesses) se influenciam mais — modelagem social mais realista que redes homogêneas.
- **Decaimento Temporal de Confiança:** A resistência ao prior diminui a cada tick, simulando a erosão natural de convicções sob pressão social contínua.
- **Relatório com Auto-Critique:** A IA gera um draft e, em seguida, revisa a própria análise — verificando consistência interna com os dados reais antes de apresentar o resultado final.

---

## 📸 Capturas de Tela e Interface "Console Dashboard"

A interface foi repensada utilizando o padrão arquitetônico **Dark Console "MiroFish" Split Panel**:

<div align="center">
<table>
<tr>
<td><img src="./static/interfaces/print_4.png" alt="Console Engine Execution" width="100%"/></td>
<td><img src="./static/interfaces/print_5.png" alt="Remotion Network Physics" width="100%"/></td>
</tr>
<tr>
<td><img src="./static/interfaces/print_6.png" alt="Parameters Matrix" width="100%"/></td>
<td><img src="./static/interfaces/print_3.png" alt="Live Feed B2B Pipeline" width="100%"/></td>
</tr>
</table>
</div>

---

## ⚙️ Arquitetura Core do Motor

1. **Geração de Grafo e Perfis:** O motor chama as APIs de LLM com `@async_retry` (backoff exponencial + jitter), instanciando 50 a 500 perfis psicológicos exclusivos com geração paralela assíncrona.
2. **Setup do Funil de Validação:** Alocação nativa entre `Unaware` → `Aware` → `Considering` → `Adopted/Rejected` (Funil B2B).
3. **Loop de Propagação (Tick Engine):** Influências ocorrem através de nós conectados ponderados por **homofilia** (similaridade demográfica + interesses) e **Tolerância ao Risco** vs **Sensibilidade ao Preço**. A confiança de cada agente decai 2% por tick, tornando o sistema progressivamente mais suscetível à pressão social.
4. **Relatório em 2 Passes:** Pass 1 gera o draft. Pass 2 envia o draft de volta ao LLM com as métricas reais para auto-critique e correção de inconsistências.

---

## 🔬 Motor v3.0 — Melhorias Arquiteturais

| Feature | Detalhe Técnico |
|---------|----------------|
| **Homofilia Social** | `_homophily_weight(a,b) → [0.5, 1.0]` — mesma faixa etária (+0.3), mesma renda (+0.3), interesses compartilhados (até +0.4) |
| **Decaimento Temporal** | `confidence *= (1 - DECAY_RATE * tick)` — prior resiste menos à pressão social conforme a simulação avança |
| **Confidence Interval** | IC 95% via numpy: `opinion_ci_low`, `opinion_ci_high` exibido na barra de métricas |
| **Relatório 2-Pass** | Draft → auto-critique → resultado final consistente com os dados |
| **Retry Inteligente** | `@async_retry` com backoff exponencial + jitter — resiliente a rate limits do Groq |
| **Logging Estruturado** | `RotatingFileHandler` 10MB + JSONL audit trail por simulação em `data/logs/` |
| **API Envelope** | Todas as rotas retornam `{"success": bool, "data": T, "error": str}` — zero ambiguidade |
| **Atomic Storage** | Writes via `.tmp → rename` — sem JSONs corrompidos em crashes |
| **Quarantine** | Arquivos corrompidos movidos para `data/corrupt/` no startup automaticamente |
| **Random Seed** | `random_seed` exposto — mesmos parâmetros + mesmo seed = resultado idêntico |
| **WS Auto-Reconnect** | Reconexão automática com backoff exponencial (1s→30s, 6 tentativas) |
| **Error Boundary** | React `ErrorBoundary` em todas as páginas — crashes isolados sem perder o estado |

---

## 📈 Analytics Preditivos do Motor Core

O ambiente executa matemática epidêmica complexa focada na validação reversa de produto. Abaixo demonstramos a capacidade analítica da nossa Sandbox Bayesiana.

<div align="center">
<table>
<tr>
<td><img src="./static/chart_1_funnel.png" alt="Funil Dynamics" width="100%"/><br><i>Propagação Orgânica do Funil de Vendas</i></td>
<td><img src="./static/chart_2_bayes.png" alt="Bayes Map" width="100%"/><br><i>Distribuição Psicométrica (Grafo Bayesiano)</i></td>
</tr>
<tr>
<td><img src="./static/chart_3_shocks.png" alt="Market Shocks" width="100%"/><br><i>Elasticidade Social sob Market Shocks</i></td>
<td><img src="./static/chart_4_friction.png" alt="Price Friction" width="100%"/><br><i>Atrito Logístico de Precificação</i></td>
</tr>
<tr>
<td colspan="2" align="center"><img src="./static/chart_5_topology.png" alt="Topologia Social" width="80%"/><br><i>Renderização da Topologia Algorítmica Reversa (Watts-Strogatz)</i></td>
</tr>
</table>
</div>

---

## 🚀 Como Iniciar Seu Sandbox Local

Recomendado rodar via código fonte local devido à alta demanda por WebSockets. A configuração do ecossistema Python (FastAPI) e Node (React+Remotion) é trivial:

### 1. Configure as Chaves (Environment)
No diretório `backend`, crie um arquivo `.env`:
```env
GROQ_API_KEY=sua_chave_aqui
GROQ_MODEL=llama-3.3-70b-versatile
```
Obtenha uma chave gratuita em [console.groq.com](https://console.groq.com).

### 2. Rodando o Motor Bayesiano (Backend)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --reload-exclude "data/*" --host 0.0.0.0 --port 8000
```
A API levantará na porta `8000`. Logs em `backend/data/logs/marketsim.log`.

### 3. Subindo o Painel de Controle (Frontend)
Em uma janela paralela de terminal:
```bash
cd frontend
npm install
npm run dev
```
Abra `http://localhost:5173` e assuma o controle.

---

## 🤝 Roadmap & Contribuição

O MarketSim v3.0 consolidou a base científica com modelos de homofilia, decaimento temporal e relatório com auto-critique. O **Roadmap v4.0** inclui:

- Simulação multi-produto (A/B testing de GTM)
- Exportação de relatório em PDF
- Modo comparativo entre simulações com mesmo seed

**Sinta-se à vontade para realizar PRs otimizando os cálculos do `opinion_model.py`** — especialmente a função `_homophily_weight` e os parâmetros de decaimento.

<div align="center">
  <sub>Projetado para simular e ganhar mercados antes que os concorrentes tomem conhecimento.</sub>
</div>
