import type { Metadata } from "next";
import "./globals.css";

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
            </nav>
          </div>
        </header>
        <div className="site-main">
          {children}
        </div>
      </body>
    </html>
  );
}
