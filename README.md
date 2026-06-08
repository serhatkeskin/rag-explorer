# RAG — LlamaIndex + Gemini + LangGraph + pgvector

Dockerized RAG pipeline. Documents are embedded with Gemini and stored in pgvector. Queries run through a LangGraph pipeline: retrieve → generate.

🔗 **Live demo:** [rag.projects.serhatkeskin.com](https://rag.projects.serhatkeskin.com/)

## Demo

A real user flow — start unauthenticated, enter an access token, add your **own**
document, index it, then ask a question answered *only* from that document.

<video src="rag-explorer-portfolio/rag-explorer-demo.mp4" controls muted loop width="100%"></video>

> ▶️ If the player doesn't load inline, [watch the MP4](rag-explorer-portfolio/rag-explorer-demo.mp4) · [view the GIF](rag-explorer-portfolio/rag-explorer-demo.gif)

📄 Full case study (architecture, features, screenshots): **[rag-explorer-overview.pdf](rag-explorer-portfolio/rag-explorer-overview.pdf)**

## Stack

| Component | Technology |
|---|---|
| LLM | Gemini 3.5-flash (`gemini-3.5-flash`) |
| Embeddings | Gemini Embedding 2 (`gemini-embedding-2`, 3072 dim) |
| Vector Store | PostgreSQL + pgvector |
| Retrieval | LlamaIndex `VectorStoreIndex` |
| Orchestration | LangGraph `StateGraph` |

## Setup

**1. Copy and fill env:**
```bash
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY
```

**2. Start services:**
```bash
docker compose up -d postgres
```

**3. Add your documents to `data/` then index:**
```bash
docker compose run --rm rag-app python scripts/ingest.py
```

**4. Query:**
```bash
docker compose run --rm rag-app python -m src.main "Your question here"
# Or interactive mode:
docker compose run --rm rag-app python -m src.main
```

## .env Variables

```
GOOGLE_API_KEY=your_key_here

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=ragdb
POSTGRES_USER=raguser
POSTGRES_PASSWORD=ragpass
```

## How It Works

```
data/*.txt
    │
    ▼ scripts/ingest.py
[LlamaIndex] chunk → embed (Gemini) → store (pgvector)

User query
    │
    ▼ src/main.py
[LangGraph]
  retrieve node  →  LlamaIndex retriever (top-3 chunks from pgvector)
  generate node  →  Gemini 3.5-flash (context + query → answer)
    │
    ▼
Answer
```

## Adding More Knowledge

Drop any `.txt` file into `data/` and re-run ingest:
```bash
docker compose run --rm rag-app python scripts/ingest.py
```

## Project Structure

```
rag/
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── requirements.txt
├── data/              # knowledge base documents
├── src/
│   ├── config.py      # env + model config
│   ├── indexer.py     # LlamaIndex + pgvector setup
│   ├── graph.py       # LangGraph pipeline
│   └── main.py        # CLI entry point
└── scripts/
    └── ingest.py      # index data/ into pgvector
```
