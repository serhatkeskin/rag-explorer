"use client";

import { useState } from "react";
import { runQuery, type QueryResult } from "@/lib/api";

export default function QueryPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runQuery(query);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>RAG Query</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        LangGraph pipeline: retrieve (pgvector) → generate (Gemini 3.5-flash)
      </p>

      <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask something about your documents..."
          rows={3}
          style={{ width: "100%", padding: "0.5rem", fontFamily: "monospace", boxSizing: "border-box" }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{ marginTop: "0.5rem", padding: "0.5rem 1.5rem" }}
        >
          {loading ? "Querying..." : "Ask"}
        </button>
      </form>

      {error && (
        <pre style={{ color: "red", marginTop: "1rem" }}>{error}</pre>
      )}

      {result && (
        <div style={{ marginTop: "1.5rem" }}>
          <h3>Answer</h3>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem" }}>
            {result.answer}
          </pre>
        </div>
      )}
    </main>
  );
}
