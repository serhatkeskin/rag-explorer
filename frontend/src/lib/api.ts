import { getToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001/api";

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Document {
  id: number;
  title: string;
  content: string;
  created_at: string;
  indexed_at: string | null;
  chunk_count: number;
}

export interface Chunk {
  id: string;
  text: string;
  metadata: Record<string, string> | null;
}

export interface ChunksResponse {
  count: number;
  chunks: Chunk[];
}

export interface Source {
  text: string;
  score: number | null;
  metadata: Record<string, string>;
}

export interface QueryResult {
  query: string;
  answer: string;
  sources: Source[];
}

export async function getDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE}/documents/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function createDocument(title: string, content: string): Promise<Document> {
  const res = await fetch(`${API_BASE}/documents/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Failed to create document");
  }
  return res.json();
}

export async function uploadDocument(file: File, title?: string): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  const res = await fetch(`${API_BASE}/documents/upload/`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Upload failed");
  }
  return res.json();
}

export async function getChunks(): Promise<ChunksResponse> {
  const res = await fetch(`${API_BASE}/chunks/`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch chunks");
  return res.json();
}

export async function runQuery(query: string): Promise<QueryResult> {
  const res = await fetch(`${API_BASE}/query/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Query failed");
  }
  return res.json();
}
