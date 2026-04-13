"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { T, GoldButton, AuthProvider } from "./_layout";

const API = "https://alphaforexai.com/api/v1";

// ── Forgot Password ───────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch { setError("Something went wrong. Please try again."); }
    finally  { setLoading(false); }
  }

  return (
    <AuthProvider>
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.black }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
            </a>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 28px" }}>
            {sent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.goldBg, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, color: T.gold }}>✓</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: T.white, marginBottom: 10 }}>Check your inbox</div>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: 24 }}>
                  If an account exists for <strong style={{ color: T.white }}>{email}</strong>, we've sent a reset link. Check your inbox and spam folder.
                </p>
                <a href="/login" style={{ fontSize: 14, color: T.gold, textDecoration: "none", fontWeight: 600 }}>← Back to login</a>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 8 }}>Reset your password</div>
                  <div style={{ fontSize: 14, color: T.muted }}>Enter your email and we'll send a reset link.</div>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      style={{ background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" as const }} />
                  </div>
                  {error && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>}
                  <GoldButton type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 8 }}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </GoldButton>
                </form>
                <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: T.muted }}>
                  <a href="/login" style={{ color: T.gold, textDecoration: "none" }}>← Back to login</a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

// ── Reset Password ─────────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [done,     setDone]       = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Minimum 8 characters"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Reset failed"); return; }
      setDone(true);
    } catch { setError("Something went wrong."); }
    finally  { setLoading(false); }
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "11px 14px", fontSize: 14, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <AuthProvider>
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif", padding: "32px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.black }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
            </a>
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 28px" }}>
            {!token ? (
              <div style={{ textAlign: "center", color: T.muted }}>
                Invalid reset link. <a href="/forgot-password" style={{ color: T.gold }}>Request a new one.</a>
              </div>
            ) : done ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: T.goldBg, border: `1px solid ${T.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 22, color: T.gold }}>✓</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: T.white, marginBottom: 10 }}>Password updated!</div>
                <p style={{ fontSize: 14, color: T.muted, marginBottom: 24 }}>Your password has been reset successfully.</p>
                <GoldButton href="/login" style={{ padding: "12px 32px" }}>Sign In</GoldButton>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 8 }}>Set new password</div>
                  <div style={{ fontSize: 14, color: T.muted }}>Choose a strong password for your account.</div>
                </div>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>New password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="At least 8 characters" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Confirm password</label>
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" style={inputStyle} />
                  </div>
                  {error && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>}
                  <GoldButton type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 8 }}>
                    {loading ? "Updating..." : "Update Password"}
                  </GoldButton>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

export default function ForgotPasswordPageDefault() {
  return <ForgotPasswordPage />;
}
