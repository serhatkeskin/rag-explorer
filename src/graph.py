from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from llama_index.llms.google_genai import GoogleGenAI

from src.config import GOOGLE_API_KEY, LLM_MODEL
from src.indexer import setup_llama_settings, get_retriever


class RAGState(TypedDict):
    query: str
    context: str
    answer: str


def retrieve_node(state: RAGState) -> RAGState:
    retriever = get_retriever()
    nodes = retriever.retrieve(state["query"])

    context_parts = []
    for i, node in enumerate(nodes, 1):
        context_parts.append(f"[{i}] {node.text}")

    context = "\n\n".join(context_parts)
    print(f"\n--- Retrieved {len(nodes)} chunk(s) ---")
    for part in context_parts:
        print(part[:120] + ("..." if len(part) > 120 else ""))
    print("---\n")

    return {**state, "context": context}


def generate_node(state: RAGState) -> RAGState:
    llm = GoogleGenAI(model=LLM_MODEL, api_key=GOOGLE_API_KEY)

    prompt = f"""Answer the question using only the provided context.
If the context does not contain enough information, say so.

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


def run_query(query: str) -> str:
    setup_llama_settings()
    app = build_graph()
    result = app.invoke({"query": query, "context": "", "answer": ""})
    return result["answer"]
