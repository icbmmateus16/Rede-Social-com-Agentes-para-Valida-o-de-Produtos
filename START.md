# Como Rodar o MarketSim

## 1. Configure a API Key do Groq (gratuito)

1. Acesse https://console.groq.com e crie uma conta gratuita
2. Gere uma API Key
3. No backend, copie o arquivo de exemplo e preencha a chave:

```bash
cd backend
cp .env.example .env
# Edite o .env e coloque sua GROQ_API_KEY
```

## 2. Backend (Python)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --reload-exclude "data/*" --host 0.0.0.0 --port 8000
```

## 3. Frontend (React)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Acesse: http://localhost:5173

## Fluxo de uso

1. Clique em **+ Nova Simulação**
2. Defina o público-alvo (idade, renda, cidades, interesses)
3. Defina o produto (nome, descrição, preço, benefícios)
4. Clique em **Iniciar Simulação**
5. Observe os agentes sendo gerados e o grafo se formando
6. Veja a propagação de opiniões em tempo real (nós mudando de cor)
7. Clique em qualquer nó para ver o perfil e opinião do agente
8. Ao concluir, gere o **Relatório** com análise da IA
