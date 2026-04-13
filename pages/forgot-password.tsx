"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "https://signals.abokifx.app/api/v1";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "sent">("request");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success (don't reveal if email exists)
      setStep("sent");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: "40px 48px", width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 22, color: "#111827", textDecoration: "none" }}>ForexAI Signals</a>
        </div>

        {step === "sent" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Check your email</div>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 24 }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <button onClick={() => router.push("/login")} style={{ width: "100%", padding: "11px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Back to login
            </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Forgot your password?</div>
              <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>Enter your email and we'll send you a reset link.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1px solid #d1d5db", outline: "none", boxSizing: "border-box" as const }} />
              </div>

              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#dc2626" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
              Remember your password?{" "}
              <a href="/login" style={{ color: "#111827", fontWeight: 600, textDecoration: "none" }}>Sign in</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
