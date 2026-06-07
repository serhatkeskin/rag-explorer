const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export interface Document {
  id: number;
  title: string;
  content: string;
  created_at: string;
  indexed_at: string | null;
  chunk_count: number;
}

export interface QueryResult {
  query: string;
  answer: string;
}

export async function getDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE}/documents/`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function createDocument(
  title: string,
  content: string
): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to create document");
  }
  return res.json();
}

export async function runQuery(query: string): Promise<QueryResult> {
  const res = await fetch(`${API_BASE}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Query failed");
  }
  return res.json();
}
