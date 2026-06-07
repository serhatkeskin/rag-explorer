"use client";

import { useState, useEffect, useRef } from "react";
import { getDocuments, createDocument, uploadDocument, type Document } from "@/lib/api";

type Tab = "text" | "file";

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [tab, setTab] = useState<Tab>("text");

  // text form
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // file form
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getDocuments().then(setDocs).catch(console.error);
  }, []);

  function reset() {
    setError(null);
    setSuccess(null);
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setLoading(true);
    reset();
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

  async function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    reset();
    try {
      const doc = await uploadDocument(selectedFile, fileTitle || undefined);
      setDocs((prev) => [doc, ...prev]);
      setFileTitle("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(`"${doc.title}" indexed successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "0.35rem 1rem",
    cursor: "pointer",
    borderBottom: tab === t ? "2px solid black" : "2px solid transparent",
    fontFamily: "monospace",
    background: "none",
    border: "none",
    borderBottom: tab === t ? "2px solid black" : "2px solid transparent",
    fontWeight: tab === t ? "bold" : "normal",
  });

  return (
    <main>
      <h1>Documents</h1>
      <p style={{ color: "#666", fontSize: "0.85rem" }}>
        Add text or upload a file — embedded (Gemini) and stored in pgvector immediately.
      </p>

      <div style={{ display: "flex", gap: "0", marginTop: "1.5rem", borderBottom: "1px solid #ddd" }}>
        <button style={tabStyle("text")} onClick={() => setTab("text")}>Paste Text</button>
        <button style={tabStyle("file")} onClick={() => setTab("file")}>Upload File</button>
      </div>

      {tab === "text" && (
        <form onSubmit={handleTextSubmit} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
      )}

      {tab === "file" && (
        <form onSubmit={handleFileSubmit} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            value={fileTitle}
            onChange={(e) => setFileTitle(e.target.value)}
            placeholder="Title (optional — defaults to filename)"
            style={{ padding: "0.5rem", fontFamily: "monospace" }}
          />
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.md"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            style={{ fontFamily: "monospace" }}
          />
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#888" }}>Supported: .txt, .pdf, .md</p>
          <button
            type="submit"
            disabled={loading || !selectedFile}
            style={{ padding: "0.5rem 1.5rem", alignSelf: "flex-start" }}
          >
            {loading ? "Uploading & Indexing..." : "Upload & Index"}
          </button>
        </form>
      )}

      {error && <pre style={{ color: "red", marginTop: "0.5rem" }}>{error}</pre>}
      {success && <pre style={{ color: "green", marginTop: "0.5rem" }}>{success}</pre>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "2rem" }}>
        <h2>Indexed Documents ({docs.length})</h2>
        <a href="/chunks" style={{ fontSize: "0.85rem" }}>View all chunks →</a>
      </div>

      {docs.length === 0 && <p style={{ color: "#999" }}>No documents yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {docs.map((doc) => (
          <li key={doc.id} style={{ borderBottom: "1px solid #eee", padding: "0.75rem 0" }}>
            <strong>{doc.title}</strong>
            <span style={{ color: "#999", marginLeft: "1rem", fontSize: "0.8rem" }}>
              {doc.indexed_at
                ? `indexed ${new Date(doc.indexed_at).toLocaleString()}`
                : "not indexed"}
            </span>
            <p style={{ margin: "0.25rem 0 0", color: "#555", fontSize: "0.85rem" }}>
              {doc.content.slice(0, 140)}{doc.content.length > 140 ? "..." : ""}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
