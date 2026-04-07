<div align="center">

# 📊 MarketSim B2B Engine v2.0

<div align="right">
  <img src="https://img.shields.io/badge/Arquitetura-Neural_Graph-09090b?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Arquitetura" />
  <img src="https://img.shields.io/badge/Status-B2B_Beta-ff4500?style=for-the-badge&logo=rocket&logoColor=white" alt="Status" />
</div>

**O Motor de Inteligência de Enxames (Swarm Intelligence) Focado em Validação de Produto.**
<br/>
*A Predictive Sandbox for Reverse Adoption & Go-To-Market Strategies*

[![React JS](https://img.shields.io/badge/Frontend-React%20%2B%20Remotion-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Bayesian-009688?style=flat-square&logo=fastapi&logoColor=white)](#)
[![Groq LLM](https://img.shields.io/badge/LLM-Groq%20Cloud-f97316?style=flat-square)](#)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](#)
[![GitHub Stars](https://img.shields.io/badge/Stars-Premium_Tool-FFD700?style=flat-square&logo=github)](#)

[English](./README-EN.md) | [Documentação em Português](./README.md)

</div>

**MarketSim B2B Engine** é uma plataforma de simulação preditiva de próxima geração impulsionada por LLMs e Agentes Autônomos Bayesianos. Em vez de testar um GTM (Go-to-Market) arriscando capital real, o sistema processa personas, objeções reais, influência de mercado e atrito de adoção em um ambiente seguro (*Sandbox*). Crie mundos digitais paralelos para prever como seu produto escalará entre os clientes.

> Você só precisa: Inserir a descrição do seu produto, o preço (Ticket) e o público alvo.</br>
> O MarketSim constrói: Um ecossistema de centenas de personas que navegam por um **Funil de Vendas Real**, gerando de forma orgânica um painel de inteligência reverso.

### Por que o MarketSim é diferente?

- **Simulação com Fisica Real:** Renderização do grafo relacional em interface rica e reativa (desenvolvido com `Framer Motion` e `Remotion`).
- **Choques de Mercado:** Integra eventos autônomos gerados por LLM simulando *Word-of-Mouth* e influenciadores digitais impactando o funil de adoção em tempo real.
- **Teoria Bayesiana:** Atualiza as probabilidades de adoção comparando resiliência ao preço X pressão social.

---

## 📸 Capturas de Tela e Interface "Console Dashboard"

A interface foi recentemente repensada utilizando o padrão arquitetônico **Dark Console "MiroFish" Split Panel**:

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

1. **Geração de Grafo e Perfis:** O motor chama as APIs de LLM utilizando estruturação JSON agressiva instanciando 50 a 500 perfis psicológicos exclusivos.
2. **Setup do Funil de Validação:** Alocação nativa entre `Unaware` -> `Aware` -> `Considering` -> `Adopted/Rejected` (Funil B2B).
3. **Loop de Propagação (Tick Engine):** Influências ocorrem através de nós conectados avaliando a **Tolerância ao Risco** vs **Sensibilidade ao Preço**.

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
<td colspan="2" align="center"><img src="./static/chart_5_topology.png" alt="Topologia Social" width="80%"/><br><i>Renderização da Topologia Algorítmica Reversa</i></td>
</tr>
</table>
</div>

---

## 🚀 Como Iniciar Seu Sandbox Local

Recomendado rodar via código fonte local devido à alta demanda por WebSockets. A configuração do ecossistema Python (FastAPI) e Node (React+Remotion) é trivial:

### 1. Configure as Chaves (Environment)
O sistema aceita APIs compatíveis com o padrão Open-Source. Altamente recomendado rodar sob **Groq** para tempos de simulação extremamente reduzidos. No diretório `backend`:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=sua_chave_aqui
```

### 2. Rodando o Motor Bayesiano (Backend)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```
A API levantará na porta `8000`.

### 3. Subindo o Painel de Controle (Frontend)
Em uma janela paralela de terminal:
```bash
cd frontend
npm install
npm run dev
```
Abra o link gerado pelo Vite (normalmente `http://localhost:5173`) e assuma o controle.

---

## 🤝 Roadmap & Contribuição

O MarketSim nasceu da necessidade de aplicar métricas matemáticas à psicologia de startups. Modelos preditivos para Finanças e Governança corporativa estão no *Roadmap* v3.0! 

**Sinta-se à vontade para realizar PRs otimizando os cálculos do `opinion_model.py`**.

<div align="center">
  <sub>Projetado para simular e ganhar mercados antes que os concorrentes tomem conhecimento.</sub>
</div>
