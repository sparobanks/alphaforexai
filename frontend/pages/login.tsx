"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, GoldButton, Input, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Invalid credentials"); return; }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("tier",  data.tier);
      router.push("/dashboard");
    } catch { setError("Connection failed. Try again."); }
    finally   { setLoading(false); }
  }

  return (
    <AuthProvider>
      <div style={{
        minHeight: "100vh", background: T.black, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)`,
      }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "0 24px" }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: T.black,
              }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: T.white }}>
                Alpha<span style={{ color: T.gold }}>ForexAI</span>
              </span>
            </a>
            <div style={{ fontSize: 14, color: T.muted, marginTop: 12 }}>Sign in to your account</div>
          </div>

          {/* Form */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 28px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="you@example.com" required />
              <Input label="Password" type="password" value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" required />

              <div style={{ textAlign: "right", marginTop: -12 }}>
                <a href="/forgot-password" style={{ fontSize: 12, color: T.gold, textDecoration: "none" }}>Forgot password?</a>
              </div>

              {error && (
                <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>
                  {error}
                </div>
              )}

              <GoldButton type="submit" disabled={loading} style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 8 }}>
                {loading ? "Signing in..." : "Sign In"}
              </GoldButton>
            </form>

            <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: T.muted }}>
              Don't have an account?{" "}
              <a href="/register" style={{ color: T.gold, textDecoration: "none", fontWeight: 600 }}>Create one free</a>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
