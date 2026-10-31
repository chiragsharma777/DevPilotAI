import { useEffect, useState } from "react";
import IntegrationCard, { type Integration } from "../components/IntegrationCard";
import { apiRequest } from "../services/api";
import "./Integrations.css";

export default function Integrations() {
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest<{ integrations: Array<{
        id: string; name: string; description: string; configured: boolean; connected: boolean;
      }> }>("/api/integrations");
      const github = await apiRequest<{ connected: boolean }>("/api/github/status").catch(() => ({ connected: false }));
      setItems(data.integrations.map(item => ({
        provider: item.id,
        name: item.name,
        description: item.description,
        status: (item.id === "github" && github.connected) || item.connected
          ? "connected"
          : "disconnected",
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load integrations.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function connect(provider: string) {
    if (provider === "github" || provider === "google" || provider === "gmail") {
      setBusyProvider(provider);
      const authProvider = provider === "github" ? "github" : "google";
      window.location.href = `${(import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")}/auth/${authProvider}/login`;
      return;
    }
    setError(`${provider} connection is not available yet.`);
  }

  return (
    <main className="integrations-page">
      <div className="integrations-heading">
        <div>
          <span className="integrations-eyebrow">WORKSPACE SETTINGS</span>
          <h1>Integrations</h1>
          <p>Connect your tools to bring your development workflow into DevPilotAI.</p>
        </div>
        <button className="integrations-refresh" type="button" onClick={() => void load()} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh status"}
        </button>
      </div>

      {error && <div className="integrations-alert" role="alert">{error}</div>}

      <section className="integrations-summary">
        <div><strong>{items.filter(i => i.status === "connected").length}</strong><span>Connected</span></div>
        <div><strong>{items.length}</strong><span>Available integrations</span></div>
        <div><strong>MCP</strong><span>Tool layer planned</span></div>
      </section>

      <div className="integrations-section-title">
        <h2>All integrations</h2>
        <span>Connect only services you need</span>
      </div>

      {loading ? <div className="integrations-loading">Loading integrations…</div> : (
        <div className="integrations-grid">
          {items.map(item => (
            <IntegrationCard
              key={item.provider}
              integration={item}
              busy={busyProvider === item.provider}
              onConnect={connect}
            />
          ))}
        </div>
      )}
    </main>
  );
}
