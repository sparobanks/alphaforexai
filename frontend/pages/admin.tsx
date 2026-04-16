"use client";
import { useState, useEffect } from "react";
import { T, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const ADMIN_PASSWORD = "forexai-admin-2026";

function BrokerRequests({ settings }: { settings: any }) {
  const requests = Object.entries(settings)
    .filter(([k]) => k.startsWith("broker_request_"))
    .map(([k, v]) => { try { return JSON.parse(v as string); } catch { return null; } })
    .filter(Boolean)
    .sort((a: any, b: any) => b.timestamp - a.timestamp);

  if (requests.length === 0) return null;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", marginTop: 20 }}>
      <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
        Broker Requests ({requests.length})
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {requests.map((r: any, i: number) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#0f0f0f", borderRadius: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 600, color: T.white, fontSize: 13 }}>{r.broker}</span>
            <span style={{ fontSize: 12, color: T.gold }}>{r.email}</span>
            <span style={{ fontSize: 11, color: T.muted2, background: "#1a1a1a", padding: "1px 8px", borderRadius: 99 }}>{r.tier}</span>
            {r.notes && <span style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>{r.notes}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminContent() {
  const [authed, setAuthed]   = useState(false);
  const [key, setKey]         = useState("");
  const [tab, setTab]         = useState("overview");
  const [stats, setStats]     = useState<any>(null);
  const [users, setUsers]     = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [search, setSearch]   = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");

  // Edit user state
  const [editUser, setEditUser] = useState<any>(null);

  // Upgrade state
  const [upgradeEmail, setUpgradeEmail] = useState("");
  const [upgradeTier,  setUpgradeTier]  = useState("pro");
  const [upgradeDays,  setUpgradeDays]  = useState(30);

  useEffect(() => { if (authed) fetchAll(); }, [authed]);

  async function verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const res = await fetch(`${API}/auth/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data.ok === true;
    } catch { return false; }
  }

  async function fetchAll() {
    try {
      const [s, u, sig, sett] = await Promise.all([
        fetch(`${API}/auth/admin/stats`,          { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/auth/admin/users?limit=100`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/signals/history?days=7&limit=30`, { headers: authHeaders() }).then(r => r.json()),
        fetch(`${API}/auth/admin/settings`,        { headers: authHeaders() }).then(r => r.json()),
      ]);
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setSignals(Array.isArray(sig) ? sig : []);
      setSettings(sett || {});
    } catch (e) { console.error(e); }
  }

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/admin/upgrade?email=${encodeURIComponent(upgradeEmail)}&tier=${upgradeTier}&days=${upgradeDays}`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      setMsg(data.ok ? `✓ ${upgradeEmail} upgraded to ${upgradeTier}` : `Error: ${data.detail}`);
      fetchAll();
    } finally { setLoading(false); }
  }

  async function handleDeleteUser(userId: number, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    await fetch(`${API}/auth/admin/users/${userId}`, { method: "DELETE", headers: authHeaders() });
    setMsg(`✓ Deleted ${email}`);
    fetchAll();
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${API}/auth/admin/users/${editUser.id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ tier: editUser.tier, is_active: editUser.is_active, email: editUser.email, full_name: editUser.full_name }),
      });
      setMsg("✓ User updated");
      setEditUser(null);
      fetchAll();
    } finally { setLoading(false); }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${API}/auth/admin/settings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      setMsg("✓ Settings saved");
    } finally { setLoading(false); }
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchTier   = !tierFilter || u.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T.white, outline: "none" };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: T.black, margin: "0 auto 16px" }}>A</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 6 }}>Admin Access</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Enter the admin password to continue</div>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin password"
            onKeyDown={e => e.key === "Enter" && (verifyAdminPassword(key).then(ok => ok ? setAuthed(true) : setMsg("Wrong password")))}
            style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const, marginBottom: 12, padding: "11px 14px", fontSize: 14 }} />
          <button onClick={() => verifyAdminPassword(key).then(ok => ok ? setAuthed(true) : setMsg("Wrong password"))}
            style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Enter Admin
          </button>
        </div>
      </div>
    );
  }

  const TIER_COLOR: Record<string,string> = { free: T.muted, pro: T.gold, vip: "#a78bfa" };

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", height: 56 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.white, marginRight: "auto" }}>
          Alpha<span style={{ color: T.gold }}>ForexAI</span> <span style={{ color: T.muted, fontWeight: 400, fontSize: 13 }}>Admin</span>
        </div>
        <a href="/dashboard" style={{ fontSize: 13, color: T.muted, textDecoration: "none", marginRight: 16 }}>← Dashboard</a>
        <button onClick={fetchAll} style={{ fontSize: 12, padding: "6px 14px", background: "#1a1a1a", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, cursor: "pointer" }}>
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.dark, padding: "0 28px", display: "flex", gap: 4 }}>
        {["overview", "users", "signals", "settings"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "12px 18px", fontWeight: tab === t ? 600 : 400, fontSize: 13,
            background: "none", border: "none", cursor: "pointer", textTransform: "capitalize",
            color: tab === t ? T.white : T.muted,
            borderBottom: tab === t ? `2px solid ${T.gold}` : "2px solid transparent",
          }}>{t}</button>
        ))}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✓") ? "#0a1a0a" : "#1a0a0a", padding: "10px 28px", fontSize: 13, color: msg.startsWith("✓") ? T.green : "#f87171", borderBottom: `1px solid ${T.border}` }}>
          {msg} <button onClick={() => setMsg("")} style={{ marginLeft: 12, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>dismiss</button>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}><div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[
                ["Total users",    stats.total_users,    T.gold],
                ["Free",           stats.free_users,     T.muted],
                ["Pro",            stats.pro_users,      T.gold],
                ["VIP",            stats.vip_users,      "#a78bfa"],
                ["New today",      stats.new_today,      T.green],
                ["New this week",  stats.new_this_week,  T.green],
                ["Est. MRR",       `£${stats.mrr_estimate}`, T.gold],
              ].map(([label, value, accent]) => (
                <div key={label as string} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px 20px", borderTop: `2px solid ${accent as string}` }}>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: T.white }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Quick upgrade */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px" }}>
                <div style={{ fontWeight: 600, color: T.white, marginBottom: 16, fontSize: 14 }}>Upgrade user manually</div>
                <form onSubmit={handleUpgrade} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input type="email" value={upgradeEmail} onChange={e => setUpgradeEmail(e.target.value)} required placeholder="user@example.com" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const }} />
                  <div style={{ display: "flex", gap: 10 }}>
                    <select value={upgradeTier} onChange={e => setUpgradeTier(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="vip">VIP</option>
                    </select>
                    <input type="number" value={upgradeDays} onChange={e => setUpgradeDays(Number(e.target.value))} min={1} max={365} style={{ ...inputStyle, width: 80 }} />
                    <span style={{ fontSize: 12, color: T.muted, alignSelf: "center" }}>days</span>
                  </div>
                  <button type="submit" disabled={loading} style={{ padding: "10px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {loading ? "Upgrading..." : "Upgrade User"}
                  </button>
                </form>
              </div>

              {/* System status */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px" }}>
                <div style={{ fontWeight: 600, color: T.white, marginBottom: 16, fontSize: 14 }}>System status</div>
                {[
                  ["API",      "Running",          T.green],
                  ["Database", "Connected",        T.green],
                  ["Stripe",   "Live mode",        T.green],
                  ["Telegram", "Connected",        T.green],
                  ["Email",    "alerts@alphaforexai.com", T.green],
                  ["Signals",  `${signals.length} recent`, T.gold],
                ].map(([svc, status, color]) => (
                  <div key={svc} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>{svc}</span>
                    <span style={{ color, fontWeight: 500 }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px", marginTop: 20 }}>
            <div style={{ fontWeight: 600, color: T.white, fontSize: 14, marginBottom: 8 }}>Admin Auto-Trading</div>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>
              Configure your personal OANDA auto-trading from your profile page. Admin accounts can use auto-trading via the profile settings.
            </p>
            <a href="/profile" style={{ display: "inline-block", padding: "9px 18px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Go to Profile → Auto-Trade
            </a>
          </div>
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div>
            {/* Edit modal */}
            {editUser && (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px", width: "100%", maxWidth: 440 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: T.white, marginBottom: 20 }}>Edit User</div>
                  <form onSubmit={handleUpdateUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                      <input value={editUser.email} onChange={e => setEditUser((u: any) => ({ ...u, email: e.target.value }))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full name</label>
                      <input value={editUser.full_name || ""} onChange={e => setEditUser((u: any) => ({ ...u, full_name: e.target.value }))} style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tier</label>
                      <select value={editUser.tier} onChange={e => setEditUser((u: any) => ({ ...u, tier: e.target.value }))} style={{ ...inputStyle, width: "100%" }}>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="vip">VIP</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" id="active" checked={editUser.is_active} onChange={e => setEditUser((u: any) => ({ ...u, is_active: e.target.checked }))} />
                      <label htmlFor="active" style={{ fontSize: 13, color: T.muted }}>Account active</label>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                      <button type="button" onClick={() => setEditUser(null)} style={{ flex: 1, padding: "10px", background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                      <button type="submit" disabled={loading} style={{ flex: 2, padding: "10px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
                    </div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>Reset user password</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input id="reset-pw-input" type="password" placeholder="New password (min 8 chars)" style={{ ...inputStyle, flex: 1 }} />
                        <button type="button" onClick={async () => {
                          const pw = (document.getElementById("reset-pw-input") as HTMLInputElement)?.value;
                          if (!pw || pw.length < 8) { setMsg("Password must be at least 8 characters"); return; }
                          setLoading(true);
                          try {
                            const res = await fetch(`${API}/auth/admin/users/${editUser.id}/reset-password`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ new_password: pw }) });
                            const d = await res.json();
                            setMsg(d.ok ? `✓ Password reset for ${editUser.email}` : `Error: ${d.detail}`);
                            setEditUser(null);
                          } finally { setLoading(false); }
                        }} style={{ padding: "9px 14px", background: "#1a1a1a", color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                          Reset Password
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or name..." style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
              <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} style={inputStyle}>
                <option value="">All tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="vip">VIP</option>
              </select>
              <div style={{ fontSize: 13, color: T.muted, alignSelf: "center" }}>{filteredUsers.length} users</div>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#111" }}>
                    {["User", "Name", "Country", "Phone", "Tier", "Joined", "Active", "Actions"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 500, color: T.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: "28px", textAlign: "center", color: T.muted }}>No users found</td></tr>
                  ) : filteredUsers.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 500, color: T.white, fontSize: 13 }}>{u.email}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>ID: {u.id}</div>
                      </td>
                      <td style={{ padding: "11px 14px", color: T.muted }}>{u.full_name || "—"}</td>
                      <td style={{ padding: "11px 14px", color: T.muted }}>{u.country || "—"}</td>
                      <td style={{ padding: "11px 14px", color: T.muted }}>{u.phone || "—"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: (TIER_COLOR[u.tier] || T.muted) + "20", color: TIER_COLOR[u.tier] || T.muted, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>
                          {u.tier}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", color: T.muted, fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ color: u.is_active ? T.green : T.red, fontSize: 12 }}>{u.is_active ? "Yes" : "No"}</span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setEditUser({ ...u })} style={{ padding: "4px 10px", background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}40`, borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => handleDeleteUser(u.id, u.email)} style={{ padding: "4px 10px", background: "#1a0a0a", color: "#f87171", border: "1px solid #3a1a1a", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signals */}
        {tab === "signals" && (
          <div>
            <div style={{ fontWeight: 600, color: T.white, marginBottom: 16, fontSize: 15 }}>Recent signals (last 7 days)</div>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#111" }}>
                    {["Date", "Pair", "Direction", "Entry", "SL", "TP", "Confidence", "P&L", "Status"].map(h => (
                      <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 500, color: T.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: "28px", textAlign: "center", color: T.muted }}>No signals in the last 7 days</td></tr>
                  ) : signals.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td style={{ padding: "10px 14px", color: T.muted, fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{s.pair}</td>
                      <td style={{ padding: "10px 14px", color: s.direction === "BUY" ? T.green : T.red, fontWeight: 700 }}>{s.direction}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>{s.entry_price?.toFixed(5)}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: T.red }}>{s.sl_price?.toFixed(5) ?? "—"}</td>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: T.green }}>{s.tp_price?.toFixed(5) ?? "—"}</td>
                      <td style={{ padding: "10px 14px", color: T.muted }}>{s.confidence ? `${(s.confidence * 100).toFixed(0)}%` : "—"}</td>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: (s.pnl_pips ?? 0) > 0 ? T.green : (s.pnl_pips ?? 0) < 0 ? T.red : T.muted }}>
                        {s.pnl_pips ?? "open"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ background: { TP_HIT: T.green, SL_HIT: T.red, OPEN: T.blue, EXPIRED: T.muted }[s.status] + "20", color: { TP_HIT: T.green, SL_HIT: T.red, OPEN: T.blue, EXPIRED: T.muted }[s.status], fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontWeight: 600, color: T.white, marginBottom: 20, fontSize: 15 }}>Site settings & analytics</div>
            <form onSubmit={saveSettings} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px" }}>
                <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Analytics & tracking codes</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Google Analytics / GTM (paste full script tag)</label>
                    <textarea
                      value={settings.header_scripts || ""}
                      onChange={e => setSettings((s: any) => ({ ...s, header_scripts: e.target.value }))}
                      rows={4} placeholder={'<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>'}
                      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    />
                    <div style={{ fontSize: 11, color: T.muted2, marginTop: 4 }}>Injected into &lt;head&gt; on all pages</div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Footer scripts (Facebook Pixel, Hotjar, etc.)</label>
                    <textarea
                      value={settings.footer_scripts || ""}
                      onChange={e => setSettings((s: any) => ({ ...s, footer_scripts: e.target.value }))}
                      rows={4} placeholder="<!-- Paste footer scripts here -->"
                      style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                    />
                    <div style={{ fontSize: 11, color: T.muted2, marginTop: 4 }}>Injected before &lt;/body&gt; on all pages</div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await fetch(`${API}/auth/admin/settings`, {
                          method: "POST", headers: authHeaders(),
                          body: JSON.stringify({ header_scripts: settings.header_scripts || "", footer_scripts: settings.footer_scripts || "" }),
                        });
                        await fetch(`${API}/auth/admin/write-document`, {
                          method: "POST", headers: authHeaders(),
                          body: JSON.stringify({ header_scripts: settings.header_scripts || "", footer_scripts: settings.footer_scripts || "" }),
                        });
                        setMsg("✓ Scripts saved! Frontend rebuilding (~30 seconds)...");
                      } catch { setMsg("Failed to apply scripts"); }
                      finally { setLoading(false); }
                    }}
                    disabled={loading}
                    style={{ padding: "10px 20px", background: "#1a1a1a", color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" as const }}
                  >
                    {loading ? "Applying..." : "⚡ Apply Scripts & Rebuild"}
                  </button>
                </div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px" }}>
                <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Site announcement banner</div>
                <textarea
                  value={settings.announcement || ""}
                  onChange={e => setSettings((s: any) => ({ ...s, announcement: e.target.value }))}
                  rows={2} placeholder="e.g. 🔥 New VIP pairs launching next week — upgrade now"
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const, resize: "vertical" }}
                />
                <div style={{ fontSize: 11, color: T.muted2, marginTop: 4 }}>Leave blank to hide the banner</div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px" }}>
                <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Maintenance mode</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="checkbox" id="maintenance" checked={settings.maintenance_mode === "true"} onChange={e => setSettings((s: any) => ({ ...s, maintenance_mode: e.target.checked ? "true" : "false" }))} />
                  <label htmlFor="maintenance" style={{ fontSize: 13, color: T.muted }}>Enable maintenance mode (shows maintenance page to non-admin users)</label>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ alignSelf: "flex-start", padding: "12px 28px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {loading ? "Saving..." : "Save Settings"}
              </button>

            <BrokerRequests settings={settings} />

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px", marginTop: 20 }}>
              <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>ads.txt</div>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
                Add your ad network verification lines. Accessible at{" "}
                <a href="/ads.txt" target="_blank" style={{ color: T.gold, textDecoration: "none" }}>alphaforexai.com/ads.txt</a>
              </p>
              <textarea
                value={settings.ads_txt_content || ""}
                onChange={e => setSettings((s: any) => ({ ...s, ads_txt_content: e.target.value }))}
                rows={6}
                placeholder={"google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\nmedia.net, XXXXXXX, DIRECT"}
                style={{ background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" as const, fontFamily: "monospace", resize: "vertical" as const }}
              />
            </div>
            </form>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px", marginTop: 20 }}>
              <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Admin panel password</div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const pw = (e.currentTarget as any).adminpw.value;
                const confirm = (e.currentTarget as any).adminpw2.value;
                if (pw !== confirm) { setMsg("Passwords do not match"); return; }
                setLoading(true);
                try {
                  const res = await fetch(`${API}/auth/admin/change-admin-password`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ new_password: pw }) });
                  const d = await res.json();
                  setMsg(d.ok ? "✓ Admin password updated — update it in admin.tsx too" : `Error: ${d.detail}`);
                } finally { setLoading(false); }
              }} style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                <input name="adminpw" type="password" placeholder="New admin password" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const }} />
                <input name="adminpw2" type="password" placeholder="Confirm new password" style={{ ...inputStyle, width: "100%", boxSizing: "border-box" as const }} />
                <button type="submit" disabled={loading} style={{ alignSelf: "flex-start", padding: "10px 20px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Update Admin Password
                </button>
              </form>
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px", marginTop: 20 }}>
              <div style={{ fontWeight: 600, color: T.gold, fontSize: 13, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Model retraining</div>
              <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>Retrain XGBoost models for all active pairs (EUR/USD, USD/JPY, GBP/USD, USD/CHF, AUD/USD, USD/CAD) with the latest data. Runs in the background — takes ~15 minutes. Check API logs for progress.</p>
              <button onClick={async () => {
                if (!confirm("Retrain all 6 pair models? Takes ~15 minutes in background.")) return;
                try {
                  await fetch(`${API}/models/retrain`, { method: "POST", headers: authHeaders() });
                  setMsg("✓ Retrain started — check API logs for progress");
                } catch { setMsg("Failed to start retrain"); }
              }} style={{ padding: "10px 20px", background: "#1a1a1a", color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Start Retrain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <AuthProvider><AdminContent /></AuthProvider>;
}
