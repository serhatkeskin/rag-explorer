"use client";

import { useState, useEffect } from "react";
import { getChunks, type Chunk } from "@/lib/api";

export default function ChunksPage() {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "Chunks | RAG Explorer"; }, []);

  useEffect(() => {
    getChunks()
      .then((res) => { setChunks(res.chunks); setTotal(res.count); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? chunks.filter((c) =>
        c.text.toLowerCase().includes(search.toLowerCase()) ||
        (c.metadata?.title ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : chunks;

  return (
    <>
      <div className="page-header">
        <h1>Vector Chunks</h1>
        <p>Raw chunks stored in pgvector — the exact content the retriever searches at query time.</p>
      </div>

      {loading && <div className="empty">Loading chunks…</div>}
      {error && (
        error === "unauthorized" ? (
          <div className="token-prompt-box">
            <span>🔑 Token missing or invalid — enter a demo token to access the RAG pipeline.</span>
            <button
              className="token-prompt-btn"
              onClick={() => window.dispatchEvent(new CustomEvent("open-token-modal"))}
            >
              Enter Token
            </button>
          </div>
        ) : (
          <div className="error-box">⚠ {error}</div>
        )
      )}

      {!loading && !error && (
        <>
          <div className="chunks-toolbar">
            <input
              className="field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by text or document title…"
            />
            <span className="chunks-stat">
              {total} total{search ? ` · ${filtered.length} match` : ""}
            </span>
          </div>

          {filtered.length === 0 && (
            <div className="empty">
              {search ? `No chunks match "${search}".` : "No chunks yet. Index a document first."}
            </div>
          )}

          <div className="chunk-list">
            {filtered.map((chunk, i) => (
              <div key={chunk.id} className="chunk-item">
                <div className="chunk-header">
                  <span className="chunk-num">#{i + 1}</span>
                  {chunk.metadata?.title && (
                    <span className="chunk-source">📄 {chunk.metadata.title}</span>
                  )}
                  <span className="chunk-chars">{chunk.text.length} chars</span>
                </div>
                <p className="chunk-text">{chunk.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
