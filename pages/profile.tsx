"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://signals.abokifx.app/api/v1";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/auth/me`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.detail) { router.push("/login"); return; }
        setUser(data);
      })
      .catch(() => router.push("/login"));
  }, []);

  function showMsg(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) { showMsg("New passwords do not match", false); return; }
    if (newPw.length < 8) { showMsg("Password must be at least 8 characters", false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        showMsg("Password updated successfully", true);
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        showMsg(data.detail ?? "Failed to update password", false);
      }
    } catch {
      showMsg("Request failed", false);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeClick(priceId: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/payments/create-checkout?price_id=${priceId}&user_email=${encodeURIComponent(user.email)}&success_url=${encodeURIComponent("https://signals.abokifx.app/profile?upgraded=1")}&cancel_url=${encodeURIComponent("https://signals.abokifx.app/profile")}`,
        { method: "POST", headers: authHeaders() }
      );
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
      else showMsg("Could not create checkout session", false);
    } catch {
      showMsg("Request failed", false);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tier");
    router.push("/login");
  }

  if (!user) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ color: "#6b7280" }}>Loading...</div>
    </div>
  );

  const tierColor = user.tier === "vip" ? "#7c3aed" : user.tier === "pro" ? "#2563eb" : "#6b7280";
  const tierLabel = user.tier === "vip" ? "VIP" : user.tier === "pro" ? "Pro" : "Free";

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Nav */}
      <nav style={{ background: "#111827", color: "#fff", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none" }}>ForexAI Signals</a>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>← Dashboard</a>
          <button onClick={handleLogout} style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px" }}>

        {/* Profile header */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "28px 32px", marginBottom: 24, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: tierColor + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: tierColor }}>
            {user.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{user.email}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              <span style={{ background: tierColor + "20", color: tierColor, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 99 }}>
                {tierLabel}
              </span>
              {user.tier_expires && (
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  expires {new Date(user.tier_expires).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {user.tier === "free" && (
            <button onClick={() => router.push("/pricing")} style={{ padding: "8px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Upgrade
            </button>
          )}
        </div>

        {/* Message */}
        {msg && (
          <div style={{ background: msg.ok ? "#dcfce7" : "#fef2f2", border: `1px solid ${msg.ok ? "#86efac" : "#fecaca"}`, borderRadius: 8, padding: "10px 16px", fontSize: 14, color: msg.ok ? "#166534" : "#dc2626", marginBottom: 16 }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
          {["account", "subscription", "security"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "10px 18px", fontWeight: 600, fontSize: 14, background: "none", border: "none", cursor: "pointer", color: tab === t ? "#111827" : "#9ca3af", borderBottom: tab === t ? "2px solid #111827" : "2px solid transparent", textTransform: "capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Account tab */}
        {tab === "account" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 28px" }}>
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Account details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 6 }}>Email address</label>
                <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb", color: "#374151" }}>{user.email}</div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 6 }}>Plan</label>
                <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb", color: "#374151", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{tierLabel}</span>
                  {user.tier === "free" && <a href="/pricing" style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Upgrade →</a>}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", display: "block", marginBottom: 6 }}>Member since</label>
                <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, background: "#f9fafb", color: "#374151" }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
              <button onClick={handleLogout} style={{ padding: "9px 18px", background: "transparent", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Subscription tab */}
        {tab === "subscription" && (
          <div>
            {user.tier === "free" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { name: "Pro", price: "£10/mo", color: "#2563eb", priceId: "price_1TJ9Uz4wcBC96UexjrBNgp9W", features: ["Live signals", "Full SL & TP", "AI confidence", "Email alerts"] },
                  { name: "VIP", price: "£20/mo", color: "#7c3aed", priceId: "price_1TJ9VH4wcBC96Uexn53EU1P6", features: ["Everything in Pro", "Priority alerts", "Multi-pair (soon)", "Early access"] },
                ].map(plan => (
                  <div key={plan.name} style={{ background: "#fff", border: `2px solid ${plan.color}`, borderRadius: 12, padding: "24px" }}>
                    <div style={{ fontWeight: 700, fontSize: 18, color: plan.color }}>{plan.name}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, margin: "8px 0 16px" }}>{plan.price}</div>
                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {plan.features.map(f => <li key={f} style={{ fontSize: 13, color: "#374151" }}>✓ {f}</li>)}
                    </ul>
                    <button onClick={() => handleUpgradeClick(plan.priceId)} disabled={loading} style={{ width: "100%", padding: "10px", background: plan.color, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      Upgrade to {plan.name}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 28px" }}>
                <div style={{ fontWeight: 600, marginBottom: 16 }}>Your subscription</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span style={{ color: "#6b7280" }}>Current plan</span>
                    <span style={{ fontWeight: 600, color: tierColor }}>{tierLabel}</span>
                  </div>
                  {user.tier_expires && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                      <span style={{ color: "#6b7280" }}>Renews</span>
                      <span style={{ fontWeight: 500 }}>{new Date(user.tier_expires).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                  {user.tier === "pro" && (
                    <button onClick={() => handleUpgradeClick("price_1TJ9VH4wcBC96Uexn53EU1P6")} style={{ padding: "9px 18px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      Upgrade to VIP
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security tab */}
        {tab === "security" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px 28px" }}>
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Change password</div>
            <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>New password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Confirm new password</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }} />
              </div>
              <button type="submit" disabled={loading} style={{ padding: "11px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
