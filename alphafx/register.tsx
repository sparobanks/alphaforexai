"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, GoldButton, Input, AuthProvider } from "./_layout";

const API = "https://alphaforexai.com/api/v1";

const COUNTRIES = [
  "Nigeria","United Kingdom","United States","Ghana","Kenya","South Africa",
  "Canada","Australia","Germany","France","UAE","India","Pakistan","Bangladesh",
  "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "", password: "", confirm: "",
    full_name: "", phone: "", country: "", city: "", date_of_birth: "",
  });

  function set(k: string) { return (e: any) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email, password: form.password,
          full_name: form.full_name, phone: form.phone,
          country: form.country, city: form.city,
          date_of_birth: form.date_of_birth || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Registration failed"); return; }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("tier",  data.tier);
      router.push("/dashboard");
    } catch { setError("Connection failed. Try again."); }
    finally   { setLoading(false); }
  }

  const inputStyle = {
    background: "#0f0f0f", border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "11px 14px",
    fontSize: 14, color: T.white, outline: "none", width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <AuthProvider>
      <div style={{
        minHeight: "100vh", background: T.black, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "system-ui, sans-serif", padding: "32px 24px",
        backgroundImage: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)`,
      }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <a href="/" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: T.black }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
            </a>
            <div style={{ fontSize: 14, color: T.muted, marginTop: 10 }}>Create your free account</div>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center" }}>
            {[1, 2].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", fontSize: 12, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step >= n ? T.gold : T.border,
                  color: step >= n ? T.black : T.muted,
                  transition: "all 0.3s",
                }}>{n}</div>
                {n < 2 && <div style={{ width: 40, height: 1, background: step > n ? T.gold : T.border }} />}
              </div>
            ))}
          </div>

          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 28px" }}>
            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); if (!form.email || !form.password || !form.confirm) return; if (form.password !== form.confirm) { setError("Passwords do not match"); return; } if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; } setError(""); setStep(2); } : handleSubmit}>

              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.white, marginBottom: 4 }}>Account details</div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Email</label>
                    <input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Password</label>
                    <input type="password" value={form.password} onChange={set("password")} required placeholder="At least 8 characters" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Confirm password</label>
                    <input type="password" value={form.confirm} onChange={set("confirm")} required placeholder="Repeat your password" style={inputStyle} />
                  </div>
                  {error && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>}
                  <GoldButton type="submit" style={{ width: "100%", padding: "13px", fontSize: 15, borderRadius: 8 }}>Continue</GoldButton>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.white, marginBottom: 4 }}>Your profile</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Full name *</label>
                      <input type="text" value={form.full_name} onChange={set("full_name")} required placeholder="John Doe" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Phone</label>
                      <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+44 7000 000000" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Date of birth</label>
                      <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} style={{ ...inputStyle, colorScheme: "dark" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Country</label>
                      <select value={form.country} onChange={set("country")} style={{ ...inputStyle }}>
                        <option value="">Select country</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>City</label>
                      <input type="text" value={form.city} onChange={set("city")} placeholder="Lagos" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginTop: 4 }}>
                    By creating an account you agree to our{" "}
                    <a href="/terms" style={{ color: T.gold }}>Terms</a> and{" "}
                    <a href="/privacy" style={{ color: T.gold }}>Privacy Policy</a>.
                  </div>

                  {error && <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171" }}>{error}</div>}

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: "12px", background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
                      Back
                    </button>
                    <GoldButton type="submit" disabled={loading} style={{ flex: 2, padding: "12px", fontSize: 15, borderRadius: 8 }}>
                      {loading ? "Creating account..." : "Create Account"}
                    </GoldButton>
                  </div>
                </div>
              )}
            </form>

            <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: T.muted }}>
              Already have an account?{" "}
              <a href="/login" style={{ color: T.gold, textDecoration: "none", fontWeight: 600 }}>Sign in</a>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
