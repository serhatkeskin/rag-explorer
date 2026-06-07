"use client";

import { useState, useEffect, useCallback } from "react";
import { getAdminKey, setAdminKey, clearAdminKey } from "@/lib/auth";
import { listTokens, createToken, deactivateToken, TokenInfo } from "@/lib/api";

export default function AdminPage() {
  const [adminKey, setAdminKeyState] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [newLabel, setNewLabel] = useState("");
  const [newDays, setNewDays] = useState("30");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listTokens();
      setTokens(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "error";
      if (msg === "forbidden") setError("Wrong admin key.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = getAdminKey();
    if (saved) {
      setAdminKeyState(saved);
      setKeyInput(saved);
    }
  }, []);

  useEffect(() => {
    if (adminKey) fetchTokens();
  }, [adminKey, fetchTokens]);

  function saveKey() {
    setAdminKey(keyInput.trim());
    setAdminKeyState(keyInput.trim());
  }

  function logout() {
    clearAdminKey();
    setAdminKeyState("");
    setKeyInput("");
    setTokens([]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setError("");
    try {
      const tok = await createToken(newLabel.trim(), parseInt(newDays));
      setTokens((prev) => [tok, ...prev]);
      setNewLabel("");
      setNewDays("30");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeactivate(id: number) {
    setError("");
    try {
      await deactivateToken(id);
      setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: false } : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "error");
    }
  }

  function copyToken(tok: TokenInfo) {
    navigator.clipboard.writeText(tok.token);
    setCopied(tok.id);
    setTimeout(() => setCopied(null), 1500);
  }

  function formatExpiry(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const days = Math.ceil((d.getTime() - now.getTime()) / 86400000);
    const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    if (days < 0) return `${label} (expired)`;
    if (days === 0) return `${label} (today)`;
    return `${label} (${days}d)`;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Token Admin</h1>
        {adminKey && (
          <button className="btn-ghost" onClick={logout}>
            Sign out
          </button>
        )}
      </div>

      <div className="admin-key-row">
        <input
          type="password"
          placeholder="Admin key"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveKey()}
          className="input-field"
        />
        <button className="btn-primary" onClick={saveKey}>
          {adminKey ? "Update" : "Unlock"}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {adminKey && (
        <>
          <form className="create-form" onSubmit={handleCreate}>
            <h2>New Token</h2>
            <div className="form-row">
              <input
                type="text"
                placeholder="Label (e.g. client-name)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="input-field"
                required
              />
              <input
                type="number"
                placeholder="Days"
                value={newDays}
                onChange={(e) => setNewDays(e.target.value)}
                className="input-field input-days"
                min="1"
                max="3650"
                required
              />
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </form>

          <div className="token-list">
            <h2>
              Tokens{" "}
              <span className="count-badge">{tokens.length}</span>
              <button className="btn-ghost btn-sm" onClick={fetchTokens} disabled={loading}>
                {loading ? "…" : "Refresh"}
              </button>
            </h2>

            {tokens.length === 0 && !loading && (
              <p className="empty-msg">No tokens yet.</p>
            )}

            {tokens.map((tok) => (
              <div key={tok.id} className={`token-row ${tok.is_active ? "" : "revoked"}`}>
                <div className="token-meta">
                  <span className="token-label">{tok.label}</span>
                  <span className={`status-badge ${tok.is_active ? "active" : "inactive"}`}>
                    {tok.is_active ? "active" : "revoked"}
                  </span>
                </div>
                <div className="token-uuid">
                  <code>{tok.token}</code>
                  <button
                    className="btn-copy"
                    onClick={() => copyToken(tok)}
                    title="Copy token"
                  >
                    {copied === tok.id ? "✓" : "Copy"}
                  </button>
                </div>
                <div className="token-expiry">
                  Expires: {formatExpiry(tok.expires_at)}
                </div>
                {tok.is_active && (
                  <button
                    className="btn-danger"
                    onClick={() => handleDeactivate(tok.id)}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
