from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from llama_index.llms.google_genai import GoogleGenAI

from src.config import GOOGLE_API_KEY, LLM_MODEL
from src.indexer import setup_llama_settings, get_retriever


class RAGState(TypedDict):
    query: str
    context: str
    answer: str
    sources: list


def retrieve_node(state: RAGState) -> RAGState:
    retriever = get_retriever()
    nodes = retriever.retrieve(state["query"])

    sources = []
    context_parts = []
    for i, node in enumerate(nodes, 1):
        title = node.metadata.get("title", "") if node.metadata else ""
        header = f"[{i}] (Source: {title})" if title else f"[{i}]"
        context_parts.append(f"{header}\n{node.text}")
        sources.append({
            "text": node.text,
            "score": round(float(node.score), 4) if node.score is not None else None,
            "metadata": node.metadata or {},
        })

    context = "\n\n".join(context_parts)
    print(f"\n--- Retrieved {len(nodes)} chunk(s) ---")
    for s in sources:
        print(f"  [{s['score']}] {s['text'][:100]}...")
    print("---\n")

    return {**state, "context": context, "sources": sources}


def generate_node(state: RAGState) -> RAGState:
    llm = GoogleGenAI(model=LLM_MODEL, api_key=GOOGLE_API_KEY)

    prompt = f"""You are a helpful assistant. Answer the question using ONLY the provided context.
If the context does not contain enough information, say so clearly.
Be concise and direct. Use plain text, not markdown.

Context:
{state['context']}

Question: {state['query']}

Answer:"""

    response = llm.complete(prompt)
    return {**state, "answer": str(response)}


def build_graph() -> StateGraph:
    graph = StateGraph(RAGState)
    graph.add_node("retrieve", retrieve_node)
    graph.add_node("generate", generate_node)
    graph.add_edge(START, "retrieve")
    graph.add_edge("retrieve", "generate")
    graph.add_edge("generate", END)
    return graph.compile()


def run_query(query: str) -> dict:
    setup_llama_settings()
    app = build_graph()
    result = app.invoke({"query": query, "context": "", "answer": "", "sources": []})
    return {"answer": result["answer"], "sources": result["sources"]}
