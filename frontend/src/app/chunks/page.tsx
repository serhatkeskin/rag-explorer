"use client";

import { useState, useEffect } from "react";
import { getChunks, type Chunk } from "@/lib/api";

export default function ChunksPage() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getChunks()
      .then((res) => {
        setChunks(res.chunks);
        setTotal(res.count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? chunks.filter((c) => c.text.toLowerCase().includes(search.toLowerCase()))
    : chunks;

  return (
    <main>
      <h1>Indexed Chunks</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Raw chunks stored in pgvector — what the retriever actually searches.
      </p>

      {loading && <p>Loading...</p>}
      {error && <pre style={{ color: "red" }}>{error}</pre>}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1rem 0" }}>
            <span style={{ fontSize: "0.85rem", color: "#555" }}>
              {total} chunk{total !== 1 ? "s" : ""} total
              {search && ` · ${filtered.length} matching`}
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter chunks..."
              style={{ padding: "0.35rem 0.6rem", fontFamily: "monospace", flex: 1 }}
            />
          </div>

          {filtered.length === 0 && (
            <p style={{ color: "#999" }}>No chunks match.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map((chunk, i) => (
              <div
                key={chunk.id}
                style={{
                  background: "#f9f9f9",
                  border: "1px solid #e8e8e8",
                  borderRadius: 4,
                  padding: "0.75rem",
                }}
              >
                <div style={{ display: "flex", gap: "1rem", marginBottom: "0.4rem", fontSize: "0.75rem", color: "#888" }}>
                  <span>#{i + 1}</span>
                  {chunk.metadata?.title && <span><strong>source:</strong> {chunk.metadata.title}</span>}
                  <span style={{ marginLeft: "auto" }}>{chunk.text.length} chars</span>
                </div>
                <pre style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                }}>
                  {chunk.text}
                </pre>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
