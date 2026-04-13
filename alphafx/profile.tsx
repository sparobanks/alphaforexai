"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T, GoldButton, AuthProvider } from "./_layout";

const API = "https://alphaforexai.com/api/v1";
function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const COUNTRIES = ["Nigeria","United Kingdom","United States","Ghana","Kenya","South Africa","Canada","Australia","Germany","France","UAE","India","Pakistan","Other"];
const TIER_COLOR: Record<string,string> = { free: T.muted, pro: T.gold, vip: "#a78bfa" };

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
          {["account", "subscription", "security"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 18px", fontWeight: tab === t ? 600 : 400, fontSize: 13,
              background: "none", border: "none", cursor: "pointer", textTransform: "capitalize",
              color: tab === t ? T.white : T.muted,
              borderBottom: tab === t ? `2px solid ${T.gold}` : "2px solid transparent",
            }}>{t}</button>
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
