"use client";
import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T, GoldButton, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const COUNTRIES = ["Nigeria","United Kingdom","United States","Ghana","Kenya","South Africa","Canada","Australia","Germany","France","UAE","India","Pakistan","Other"];
const TIER_COLOR: Record<string,string> = { free: T.muted, pro: T.gold, vip: "#a78bfa" };

function AutoTradePanel({ user, showMsg }: any) {
  const [settings, setSettings] = React.useState<any>({
    auto_trade_enabled: false, auto_trade_risk_pct: 1.0,
    oanda_account_id: "", oanda_api_key: "", oanda_is_live: false, has_api_key: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  React.useEffect(() => {
    fetch(`${API}/auth/auto-trade/settings`, { headers: authHeaders() })
      .then(r => r.json()).then(data => setSettings(data)).catch(() => {});
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${API}/auth/auto-trade/settings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.ok) showMsg("Auto-trade settings saved", true);
      else showMsg(data.detail || "Save failed", false);
    } finally { setLoading(false); }
  }

  async function testConnection() {
    setTesting(true);
    try {
      const res  = await fetch(`${API}/auth/auto-trade/test`, { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.ok) showMsg(`✓ Connected! Balance: ${data.currency} ${parseFloat(data.balance).toFixed(2)} (${data.mode} mode)`, true);
      else showMsg(`Connection failed: ${data.error}`, false);
    } finally { setTesting(false); }
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" as const };
  const labelStyle: any = { fontSize: 11, fontWeight: 500, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      {/* Warning */}
      <div style={{ background: "#1a0a0a", border: "1px solid #f8717140", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontWeight: 600, color: "#fca5a5", fontSize: 13, marginBottom: 4 }}>⚠️ Risk Warning</div>
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, margin: 0 }}>
          Auto-trading will execute real trades on your OANDA account. You can lose money. Use practice mode first to test. We are not responsible for trading losses. Only enable this if you understand the risks.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>OANDA Credentials</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <label style={labelStyle}>Account ID</label>
              <input value={settings.oanda_account_id || ""} onChange={e => setSettings((s: any) => ({...s, oanda_account_id: e.target.value}))} placeholder="e.g. 001-001-1234567-001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>API Key {settings.has_api_key && <span style={{ color: T.green, textTransform: "none" as const }}>✓ Saved</span>}</label>
              <input type="password" value={settings.oanda_api_key || ""} onChange={e => setSettings((s: any) => ({...s, oanda_api_key: e.target.value}))} placeholder={settings.has_api_key ? "Leave blank to keep existing" : "Paste your OANDA API key"} style={inputStyle} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="checkbox" id="live_mode" checked={settings.oanda_is_live || false} onChange={e => setSettings((s: any) => ({...s, oanda_is_live: e.target.checked}))} />
              <label htmlFor="live_mode" style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>
                Use <strong style={{ color: "#f87171" }}>Live</strong> account (uncheck for Practice)
              </label>
            </div>
            <button type="button" onClick={testConnection} disabled={testing || !settings.oanda_account_id}
              style={{ padding: "9px 18px", background: "#111", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.white, cursor: "pointer", alignSelf: "flex-start" as const }}>
              {testing ? "Testing..." : "Test Connection"}
            </button>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Trade Settings</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <label style={labelStyle}>Risk per trade: {settings.auto_trade_risk_pct}%</label>
              <input type="range" min="0.1" max="5" step="0.1" value={settings.auto_trade_risk_pct || 1}
                onChange={e => setSettings((s: any) => ({...s, auto_trade_risk_pct: parseFloat(e.target.value)}))}
                style={{ width: "100%", accentColor: T.gold }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted2 }}>
                <span>0.1% (Conservative)</span><span>5% (Aggressive)</span>
              </div>
            </div>
            <div style={{ background: "#0f0f0f", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              At {settings.auto_trade_risk_pct}% risk, on a $10,000 account, each trade risks <strong style={{ color: T.white }}>${(10000 * (settings.auto_trade_risk_pct || 1) / 100).toFixed(0)}</strong>
            </div>
          </div>
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 4 }}>Enable Auto-Trading</div>
              <div style={{ fontSize: 12, color: T.muted }}>When enabled, trades will be placed automatically on every signal</div>
            </div>
            <div onClick={() => setSettings((s: any) => ({...s, auto_trade_enabled: !s.auto_trade_enabled}))}
              style={{ width: 48, height: 26, borderRadius: 13, background: settings.auto_trade_enabled ? T.green : "#333", cursor: "pointer", position: "relative" as const, transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute" as const, top: 3, left: settings.auto_trade_enabled ? 25 : 3, transition: "left 0.2s" }} />
            </div>
          </div>
        </div>

        {/* Deriv section */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Deriv Account</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            <div>
              <label style={labelStyle}>Deriv App ID</label>
              <input value={settings.deriv_app_id || ""} onChange={e => setSettings((s: any) => ({...s, deriv_app_id: e.target.value}))} placeholder="e.g. 1089" style={inputStyle} />
              <div style={{ fontSize: 11, color: T.muted2, marginTop: 3 }}>Get your App ID from <a href="https://app.deriv.com/account/api-token" target="_blank" style={{ color: T.gold }}>app.deriv.com/account/api-token</a></div>
            </div>
            <div>
              <label style={labelStyle}>Deriv API Token</label>
              <input type="password" value={settings.deriv_api_token || ""} onChange={e => setSettings((s: any) => ({...s, deriv_api_token: e.target.value}))} placeholder="Paste your Deriv API token" style={inputStyle} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" id="deriv_enabled" checked={settings.deriv_enabled || false}
                  onChange={e => setSettings((s: any) => ({...s, deriv_enabled: e.target.checked}))} />
                <label htmlFor="deriv_enabled" style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>Enable Deriv Auto-Trading</label>
              </div>
              <button type="button" onClick={async () => {
                setTesting(true);
                try {
                  const res = await fetch(`${API}/auth/auto-trade/test-deriv`, { method: "POST", headers: authHeaders() });
                  const data = await res.json();
                  if (data.ok) showMsg(`✓ Deriv connected! Balance: ${data.currency} ${parseFloat(data.balance).toFixed(2)}`, true);
                  else showMsg(`Deriv failed: ${data.error}`, false);
                } finally { setTesting(false); }
              }} disabled={testing} style={{ padding: "7px 14px", background: "#111", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.white, cursor: "pointer" }}>
                {testing ? "Testing..." : "Test Deriv"}
              </button>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading}
          style={{ padding: "12px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: T.black, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {loading ? "Saving..." : "Save Auto-Trade Settings"}
        </button>
      </form>

      {/* Broker request */}
      <BrokerRequest showMsg={showMsg} />
    </div>
  );
}

function BrokerRequest({ showMsg }: any) {
  const [broker, setBroker] = React.useState("");
  const [notes, setNotes]   = React.useState("");
  const [sent, setSent]     = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const BROKERS = ["IG Markets", "Pepperstone", "IC Markets", "XM", "eToro", "Forex.com", "FXCM", "Interactive Brokers", "Saxo Bank", "Deriv", "Other"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API}/auth/broker-request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ broker, notes }),
      });
      setSent(true);
      showMsg("✓ Broker request submitted — thank you!", true);
    } catch {
      showMsg("Failed to submit request", false);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" as const };

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
      <div style={{ fontWeight: 600, color: T.white, fontSize: 14, marginBottom: 6 }}>Request a Broker</div>
      <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>
        Currently we support OANDA. Tell us which broker you use and we'll prioritise adding it.
      </p>
      {sent ? (
        <div style={{ background: "#0a1a0a", border: "1px solid #166534", borderRadius: 8, padding: "14px", textAlign: "center" as const }}>
          <div style={{ color: T.green, fontWeight: 600, marginBottom: 4 }}>✓ Request submitted!</div>
          <div style={{ fontSize: 13, color: T.muted }}>We'll notify you when {broker} is supported.</div>
          <button onClick={() => { setSent(false); setBroker(""); setNotes(""); }} style={{ marginTop: 10, fontSize: 12, color: T.gold, background: "none", border: "none", cursor: "pointer" }}>Submit another</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Broker name *</label>
            <select value={broker} onChange={e => setBroker(e.target.value)} required style={inputStyle}>
              <option value="">Select a broker...</option>
              {BROKERS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 500, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Additional notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="e.g. I use MT4 with Pepperstone, prefer ECN account..."
              style={{ ...inputStyle, resize: "vertical" as const }} />
          </div>
          <button type="submit" disabled={loading || !broker}
            style={{ padding: "10px", background: "#1a1a1a", color: T.white, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: !broker ? 0.5 : 1 }}>
            {loading ? "Submitting..." : "Submit Broker Request"}
          </button>
        </form>
      )}
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const [user, setUser]     = useState<any>(null);
  const [tab, setTab]       = useState("account");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  const [profile, setProfile] = useState({ full_name: "", phone: "", country: "", city: "", date_of_birth: "" });
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.detail) { router.push("/login"); return; }
        setUser(data);
        setProfile({
          full_name:     data.full_name     || "",
          phone:         data.phone         || "",
          country:       data.country       || "",
          city:          data.city          || "",
          date_of_birth: data.date_of_birth ? data.date_of_birth.split("T")[0] : "",
        });
      })
      .catch(() => router.push("/login"));
  }, []);

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify(profile),
      });
      if (res.ok) { showMsg("Profile updated", true); setUser((u: any) => ({ ...u, ...profile })); }
      else { const d = await res.json(); showMsg(d.detail ?? "Update failed", false); }
    } catch { showMsg("Request failed", false); }
    finally { setLoading(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwords.newPw !== passwords.confirm) { showMsg("Passwords do not match", false); return; }
    if (passwords.newPw.length < 8) { showMsg("Minimum 8 characters", false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.newPw }),
      });
      if (res.ok) { showMsg("Password updated", true); setPasswords({ current: "", newPw: "", confirm: "" }); }
      else { const d = await res.json(); showMsg(d.detail ?? "Failed", false); }
    } catch { showMsg("Request failed", false); }
    finally { setLoading(false); }
  }

  async function handleUpgrade(priceId: string) {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/payments/create-checkout?price_id=${priceId}&user_email=${encodeURIComponent(user.email)}&success_url=${encodeURIComponent("https://alphaforexai.com/dashboard?upgraded=1")}&cancel_url=${encodeURIComponent("https://alphaforexai.com/profile")}`,
        { method: "POST", headers: authHeaders() });
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch { showMsg("Checkout failed", false); }
    finally { setLoading(false); }
  }

  if (!user) return <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: T.muted }}>Loading...</div></div>;

  const tierColor = TIER_COLOR[user.tier] || T.muted;
  const tierLabel = user.tier?.toUpperCase();

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.white, outline: "none", width: "100%", boxSizing: "border-box", transition: "border-color 0.2s" };
  const labelStyle: any = { fontSize: 11, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 6 };

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 32px", display: "flex", alignItems: "center", height: 60 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginRight: 24 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.black }}>A</div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
        </a>
        <a href="/dashboard" style={{ fontSize: 13, color: T.muted, textDecoration: "none", marginRight: "auto" }}>← Dashboard</a>
        <button onClick={() => { localStorage.removeItem("token"); router.push("/"); }} style={{ fontSize: 12, color: T.muted2, background: "none", border: "none", cursor: "pointer" }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>
        {/* Profile header */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: tierColor + "20", border: `1px solid ${tierColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: tierColor }}>
            {(user.full_name || user.email)?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.white }}>{user.full_name || user.email}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{user.email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <span style={{ background: tierColor + "20", color: tierColor, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {tierLabel}
              </span>
              {user.tier_expires && (
                <span style={{ fontSize: 11, color: T.muted }}>expires {new Date(user.tier_expires).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {user.tier === "free" && (
            <a href="/pricing" style={{ background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              Upgrade
            </a>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div style={{ background: msg.ok ? "#0a1a0a" : "#1a0a0a", border: `1px solid ${msg.ok ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 16px", fontSize: 13, color: msg.ok ? T.green : "#f87171", marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
          {(["account", "subscription", (user.tier === "vip" || user.email?.includes("admin")) ? "autotrading" : null, "security"].filter(Boolean) as string[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 18px", fontWeight: tab === t ? 600 : 400, fontSize: 13,
              background: "none", border: "none", cursor: "pointer", textTransform: "capitalize",
              color: tab === t ? T.white : T.muted,
              borderBottom: tab === t ? `2px solid ${T.gold}` : "2px solid transparent",
            }}>{t === "autotrading" ? "Auto-Trade" : t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}
        </div>

        {/* Account tab */}
        {tab === "account" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.white, marginBottom: 20 }}>Profile details</div>
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Full name</label>
                  <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date of birth</label>
                  <input type="date" value={profile.date_of_birth} onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))} style={{ ...inputStyle, colorScheme: "dark" }} />
                </div>
                <div>
                  <label style={labelStyle}>Country</label>
                  <select value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} style={inputStyle}>
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Email</label>
                  <input value={user.email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }} />
                </div>
              </div>
              <GoldButton type="submit" disabled={loading} style={{ alignSelf: "flex-start", padding: "11px 24px", fontSize: 14, borderRadius: 8 }}>
                {loading ? "Saving..." : "Save Changes"}
              </GoldButton>
            </form>
          </div>
        )}

        {/* Subscription tab */}
        {tab === "subscription" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.white, marginBottom: 20 }}>Your subscription</div>
            {user.tier === "free" ? (
              <div>
                <div style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>You're on the Free plan. Upgrade to unlock live signals, full SL/TP details, and email alerts.</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {[
                    { name: "Pro", price: "£10/mo", color: T.gold, priceId: "price_1TJt9W4wcBC96UexPS4MjvS9", features: ["Live signals", "Full SL & TP", "AI confidence", "Email alerts"] },
                    { name: "VIP", price: "£20/mo", color: "#a78bfa", priceId: "price_1TJt9H4wcBC96UexFn3taUAi", features: ["Everything in Pro", "Telegram alerts", "Multi-pair", "Early access"] },
                  ].map(plan => (
                    <div key={plan.name} style={{ border: `1px solid ${plan.color}40`, borderRadius: 10, padding: "20px" }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: plan.color }}>{plan.name}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: "8px 0 14px" }}>{plan.price}</div>
                      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                        {plan.features.map(f => <li key={f} style={{ fontSize: 13, color: T.muted }}>✓ {f}</li>)}
                      </ul>
                      <button onClick={() => handleUpgrade(plan.priceId)} disabled={loading} style={{ width: "100%", padding: "10px", background: plan.color, color: T.black, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        Upgrade to {plan.name}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                  <span style={{ color: T.muted }}>Current plan</span>
                  <span style={{ fontWeight: 600, color: tierColor }}>{tierLabel}</span>
                </div>
                {user.tier_expires && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
                    <span style={{ color: T.muted }}>Renews</span>
                    <span style={{ color: T.white }}>{new Date(user.tier_expires).toLocaleDateString()}</span>
                  </div>
                )}
                {user.tier === "pro" && (
                  <div style={{ marginTop: 20 }}>
                    <button onClick={() => handleUpgrade("price_1TJt9H4wcBC96UexFn3taUAi")} style={{ padding: "10px 20px", background: "#a78bfa", color: T.black, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Upgrade to VIP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Auto-trading tab - VIP only */}
        {tab === "autotrading" && (
          <div>
            {user.tier !== "vip" ? (
              <div style={{ background: "#120a1e", border: "1px solid #a78bfa40", borderRadius: 12, padding: "32px", textAlign: "center" as const }}>
                <div style={{ fontSize: 32, color: "#a78bfa", marginBottom: 12 }}>◈</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 8 }}>VIP Feature</div>
                <p style={{ fontSize: 14, color: T.muted, marginBottom: 20 }}>Auto-trading is available for VIP members only. Upgrade to automatically execute signals on your OANDA account.</p>
                <a href="/pricing" style={{ display: "inline-block", padding: "11px 28px", background: "#7c3aed", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Upgrade to VIP</a>
              </div>
            ) : (
              <AutoTradePanel user={user} showMsg={showMsg} />
            )}
          </div>
        )}

        {/* Security tab */}
        {tab === "security" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "28px" }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.white, marginBottom: 20 }}>Change password</div>
            <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                ["Current password", "current", "current"],
                ["New password",     "newPw",   "new-password"],
                ["Confirm new",      "confirm", "new-password"],
              ].map(([lbl, key, autoComplete]) => (
                <div key={key}>
                  <label style={labelStyle}>{lbl}</label>
                  <input
                    type="password"
                    autoComplete={autoComplete}
                    value={(passwords as any)[key]}
                    onChange={e => setPasswords(p => ({ ...p, [key]: e.target.value }))}
                    required style={inputStyle}
                  />
                </div>
              ))}
              <GoldButton type="submit" disabled={loading} style={{ alignSelf: "flex-start", padding: "11px 24px", fontSize: 14, borderRadius: 8 }}>
                {loading ? "Updating..." : "Update Password"}
              </GoldButton>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <AuthProvider><ProfileContent /></AuthProvider>;
}
