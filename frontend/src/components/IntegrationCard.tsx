import { useState } from "react";

export type IntegrationStatus = "connected" | "disconnected" | "coming_soon" | "error";

export type Integration = {
  provider: string;
  name: string;
  description: string;
  status: IntegrationStatus;
};

type Props = {
  integration: Integration;
  onConnect: (provider: string) => void;
  busy?: boolean;
};

export default function IntegrationCard({ integration, onConnect, busy = false }: Props) {
  const [error, setError] = useState("");
  const connected = integration.status === "connected";
  const comingSoon = integration.status === "coming_soon";

  function handleClick() {
    setError("");
    try {
      onConnect(integration.provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start connection.");
    }
  }

  return (
    <article className="integration-card">
      <div className="integration-card-top">
        <div className={`integration-logo integration-logo-${integration.provider}`}>
          {integration.name.slice(0, 1)}
        </div>
        <span className={`integration-status status-${integration.status}`}>
          <span className="status-dot" />
          {connected ? "Connected" : comingSoon ? "Coming soon" : integration.status === "error" ? "Needs attention" : "Not connected"}
        </span>
      </div>
      <h3>{integration.name}</h3>
      <p>{integration.description}</p>
      {error && <p className="integration-error">{error}</p>}
      <button
        className={connected ? "integration-button integration-button-muted" : "integration-button"}
        type="button"
        onClick={handleClick}
        disabled={busy || comingSoon}
      >
        {busy ? "Please wait…" : connected ? "Manage connection" : comingSoon ? "Coming soon" : "Connect"}
      </button>
    </article>
  );
}
