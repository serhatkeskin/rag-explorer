import type { Metadata } from "next";
import "./globals.css";
import TokenButton from "@/components/TokenButton";

export const metadata: Metadata = {
  title: "RAG Explorer",
  description: "Semantic document search — LlamaIndex · LangGraph · Gemini · pgvector",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">◈</span>
              <span className="logo-name">RAG Explorer</span>
              <div className="tech-badges">
                <span>LlamaIndex</span>
                <span>LangGraph</span>
                <span>Gemini</span>
                <span>pgvector</span>
              </div>
            </div>
            <nav className="site-nav">
              <a href="/">Ask</a>
              <a href="/documents">Documents</a>
              <a href="/chunks">Chunks</a>
              <TokenButton />
            </nav>
          </div>
        </header>
        <div className="site-main">
          {children}
        </div>
        <footer className="site-footer">
          <p>
            Built by <a href="https://github.com/serhatkeskin" target="_blank" rel="noopener noreferrer">Serhat Keskin</a>
            {" · "}
            <a href="https://github.com/serhatkeskin/rag-explorer" target="_blank" rel="noopener noreferrer">GitHub</a>
            {" · "}
            LlamaIndex · LangGraph · Gemini · pgvector · Django · Next.js
          </p>
        </footer>
      </body>
    </html>
  );
}
