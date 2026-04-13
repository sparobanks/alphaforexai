"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://signals.abokifx.app/api/v1";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>(null);
  const [signals, setSignals] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeTier, setUpgradeTier] = useState("pro");
  const [upgradeDays, setUpgradeDays] = useState(30);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);

  // Simple admin password gate
  const ADMIN_PASSWORD = "forexai-admin-2026";

  useEffect(() => {
    if (!authed) return;
    fetchData();
  }, [authed]);

  async function fetchData() {
    try {
      const [s, sig, mod] = await Promise.all([
        fetch(`${API}/signals/stats/summary?days=30`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/signals/history?days=7&limit=20`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/models/`, { headers: authHeaders() }).then(r => r.json()),
      ]);
      setStats(s);
      setSignals(Array.isArray(sig) ? sig : []);
      setModels(Array.isArray(mod) ? mod : []);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setUpgradeMsg("");
    try {
      const res = await fetch(
        `${API}/auth/admin/upgrade?email=${encodeURIComponent(upgradeEmail)}&tier=${upgradeTier}&days=${upgradeDays}`,
        { method: "POST", headers: authHeaders() }
      );
      const data = await res.json();
      if (data.ok) {
        setUpgradeMsg(`✓ ${upgradeEmail} upgraded to ${upgradeTier} for ${upgradeDays} days`);
        setUpgradeEmail("");
      } else {
        setUpgradeMsg(`Error: ${data.detail ?? "Unknown error"}`);
      }
    } catch {
      setUpgradeMsg("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetrain() {
    if (!confirm("Retrain the model? This runs in the background and takes ~10 minutes.")) return;
    try {
      await fetch(`${API}/models/retrain`, { method: "POST", headers: authHeaders() });
      alert("Retrain started. Check back in 10 minutes.");
    } catch {
      alert("Failed to start retrain.");
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "40px 48px", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Admin Access</div>
          <div style={{ fontSize: 14, color: "#9ca3af", marginBottom: 24 }}>Enter the admin password to continue</div>
          <input
            type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
            placeholder="Admin password"
            onKeyDown={e => e.key === "Enter" && (adminKey === ADMIN_PASSWORD ? setAuthed(true) : alert("Wrong password"))}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, marginBottom: 12, boxSizing: "border-box" as const }}
          />
          <button
            onClick={() => adminKey === ADMIN_PASSWORD ? setAuthed(true) : alert("Wrong password")}
            style={{ width: "100%", padding: "11px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Enter Admin
          </button>
          <div style={{ marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
            Default password: forexai-admin-2026<br/>Change this in admin.tsx before going live
          </div>
        </div>
      </div>
    );
  }

  const STATUS_COLOR: Record<string, string> = {
    TP_HIT: "#16a34a", SL_HIT: "#dc2626", OPEN: "#2563eb", EXPIRED: "#6b7280"
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "#111827", color: "#fff", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>ForexAI — Admin</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>← Dashboard</a>
          <button onClick={fetchData} style={{ fontSize: 12, padding: "6px 14px", background: "#1f2937", color: "#fff", border: "1px solid #374151", borderRadius: 6, cursor: "pointer" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", padding: "0 32px", display: "flex", gap: 4 }}>
        {["overview", "signals", "models", "users"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 18px", fontWeight: 600, fontSize: 14, background: "none", border: "none", cursor: "pointer",
            color: tab === t ? "#111827" : "#9ca3af",
            borderBottom: tab === t ? "2px solid #111827" : "2px solid transparent",
            textTransform: "capitalize",
          }}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                ["Total signals (30d)", stats?.total ?? "—"],
                ["Win rate", stats?.win_rate ? `${(stats.win_rate * 100).toFixed(1)}%` : "—"],
                ["P&L (pips)", stats?.pnl_pips ?? "—"],
                ["Open signals", stats?.open_count ?? "—"],
              ].map(([label, val]) => (
                <div key={label as string} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Quick actions */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Quick actions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button onClick={handleRetrain} style={{ padding: "10px 16px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                    Retrain AI model
                  </button>
                  <button onClick={() => setTab("users")} style={{ padding: "10px 16px", background: "transparent", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                    Upgrade a user
                  </button>
                  <button onClick={() => setTab("models")} style={{ padding: "10px 16px", background: "transparent", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                    View model versions
                  </button>
                </div>
              </div>

              {/* System status */}
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>System status</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["API", "Running"],
                    ["Database", "Connected"],
                    ["Model", models.length > 0 ? "Loaded" : "Not loaded"],
                    ["Stripe", "Test mode"],
                    ["Telegram", "Not configured"],
                  ].map(([service, status]) => (
                    <div key={service} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>{service}</span>
                      <span style={{ fontWeight: 500, color: status === "Running" || status === "Connected" || status === "Loaded" || status === "Test mode" ? "#16a34a" : "#dc2626" }}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signals */}
        {tab === "signals" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", fontWeight: 600 }}>Recent signals (last 7 days)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Date", "Pair", "Direction", "Entry", "SL", "TP", "Confidence", "P&L", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>No signals yet — model needs real OANDA data</td></tr>
                ) : signals.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 16px", color: "#6b7280" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>{s.pair}</td>
                    <td style={{ padding: "10px 16px", color: s.direction === "BUY" ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{s.direction}</td>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace" }}>{s.entry_price?.toFixed(5)}</td>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#dc2626" }}>{s.sl_price?.toFixed(5)}</td>
                    <td style={{ padding: "10px 16px", fontFamily: "monospace", color: "#16a34a" }}>{s.tp_price?.toFixed(5)}</td>
                    <td style={{ padding: "10px 16px" }}>{(s.confidence * 100).toFixed(0)}%</td>
                    <td style={{ padding: "10px 16px", fontWeight: 700, color: s.pnl_pips > 0 ? "#16a34a" : s.pnl_pips < 0 ? "#dc2626" : "#6b7280" }}>
                      {s.pnl_pips ?? "open"}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ background: STATUS_COLOR[s.status] + "20", color: STATUS_COLOR[s.status], fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Models */}
        {tab === "models" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Trained model versions</div>
              <button onClick={handleRetrain} style={{ padding: "8px 18px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Retrain now
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["ID", "Pair", "Trained", "Win rate", "Expectancy", "Profit factor", "Drawdown", "Active"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {models.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>No models registered yet</td></tr>
                  ) : models.map((m, i) => (
                    <tr key={m.id} style={{ borderTop: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 16px" }}>{m.id}</td>
                      <td style={{ padding: "10px 16px", fontWeight: 600 }}>{m.pair}</td>
                      <td style={{ padding: "10px 16px", color: "#6b7280" }}>{new Date(m.trained_at).toLocaleDateString()}</td>
                      <td style={{ padding: "10px 16px" }}>{m.win_rate ? `${(m.win_rate * 100).toFixed(1)}%` : "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{m.expectancy?.toFixed(1) ?? "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{m.profit_factor?.toFixed(2) ?? "—"}</td>
                      <td style={{ padding: "10px 16px" }}>{m.max_drawdown?.toFixed(0) ?? "—"}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ background: m.is_active ? "#dcfce7" : "#f3f4f6", color: m.is_active ? "#16a34a" : "#6b7280", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 24 }}>Manually upgrade a user</div>
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "28px" }}>
              <form onSubmit={handleUpgrade} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>User email</label>
                  <input type="email" value={upgradeEmail} onChange={e => setUpgradeEmail(e.target.value)} required
                    placeholder="user@example.com"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Tier</label>
                  <select value={upgradeTier} onChange={e => setUpgradeTier(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Days</label>
                  <input type="number" value={upgradeDays} onChange={e => setUpgradeDays(Number(e.target.value))} min={1} max={365}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }} />
                </div>
                {upgradeMsg && (
                  <div style={{ background: upgradeMsg.startsWith("✓") ? "#dcfce7" : "#fef2f2", border: `1px solid ${upgradeMsg.startsWith("✓") ? "#86efac" : "#fecaca"}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: upgradeMsg.startsWith("✓") ? "#166534" : "#dc2626" }}>
                    {upgradeMsg}
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ padding: "11px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Upgrading..." : "Upgrade User"}
                </button>
              </form>
            </div>

            <div style={{ marginTop: 24, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, padding: "16px 20px", fontSize: 13, color: "#92400e" }}>
              <strong>Note:</strong> This is for manual upgrades only (e.g. gifting access, fixing issues). Normal upgrades happen automatically via Stripe webhook.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
