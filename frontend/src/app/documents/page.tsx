"use client";

import { useState, useEffect } from "react";
import { getDocuments, createDocument, type Document } from "@/lib/api";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getDocuments().then(setDocs).catch(console.error);
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const doc = await createDocument(title, content);
      setDocs((prev) => [doc, ...prev]);
      setTitle("");
      setContent("");
      setSuccess(`"${doc.title}" indexed successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Documents</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Add text — it gets embedded (Gemini) and stored in pgvector immediately.
      </p>

      <form onSubmit={handleAdd} style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{ padding: "0.5rem", fontFamily: "monospace" }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste document content here..."
          rows={6}
          style={{ padding: "0.5rem", fontFamily: "monospace" }}
        />
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          style={{ padding: "0.5rem 1.5rem", alignSelf: "flex-start" }}
        >
          {loading ? "Indexing..." : "Add & Index"}
        </button>
      </form>

      {error && <pre style={{ color: "red" }}>{error}</pre>}
      {success && <pre style={{ color: "green" }}>{success}</pre>}

      <h2 style={{ marginTop: "2rem" }}>Indexed Documents ({docs.length})</h2>
      {docs.length === 0 && <p style={{ color: "#999" }}>No documents yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {docs.map((doc) => (
          <li
            key={doc.id}
            style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}
          >
            <strong>{doc.title}</strong>
            <span style={{ color: "#999", marginLeft: "1rem", fontSize: "0.8rem" }}>
              {doc.indexed_at
                ? `indexed ${new Date(doc.indexed_at).toLocaleString()}`
                : "not indexed"}
            </span>
            <p style={{ margin: "0.25rem 0 0", color: "#555", fontSize: "0.85rem" }}>
              {doc.content.slice(0, 120)}
              {doc.content.length > 120 ? "..." : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
