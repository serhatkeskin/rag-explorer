import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RAG Explorer",
  description: "LlamaIndex + Gemini + LangGraph + pgvector",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "monospace", maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
        <nav style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
          <a href="/">Query</a>
          <a href="/documents">Documents</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
