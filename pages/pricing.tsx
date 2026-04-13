"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    name: "Free",
    price: "£0",
    period: "forever",
    color: "#6b7280",
    priceId: null,
    featured: false,
    features: [
      "EUR/USD signals only",
      "Delayed signals (1hr lag)",
      "Direction only — no SL/TP",
      "Weekly performance summary",
      "Basic dashboard access",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "£10",
    period: "per month",
    color: "#2563eb",
    priceId: "price_1TJ9Uz4wcBC96UexjrBNgp9W",
    featured: true,
    features: [
      "Live signals — no delay",
      "Full entry, SL & TP levels",
      "AI confidence score",
      "Full dashboard analytics",
      "30-day performance history",
      "Email alerts",
    ],
    cta: "Start Pro",
  },
  {
    name: "VIP",
    price: "£20",
    period: "per month",
    color: "#7c3aed",
    priceId: "price_1TJ9VH4wcBC96Uexn53EU1P6",
    featured: false,
    features: [
      "Everything in Pro",
      "Priority signal alerts",
      "Multi-pair signals (coming soon)",
      "Telegram alerts (coming soon)",
      "AI strategy breakdown",
      "Early access to new features",
    ],
    cta: "Go VIP",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePlan(plan: typeof PLANS[0]) {
    setError("");

    if (!plan.priceId) {
      router.push("/register");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/register");
      return;
    }

    setLoading(plan.name);
    try {
      let email = "";
      try {
        email = JSON.parse(atob(token.split(".")[1])).sub ?? "";
      } catch {}

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://signals.abokifx.app/api/v1";
      const res = await fetch(
        `${apiUrl}/payments/create-checkout?price_id=${plan.priceId}&user_email=${encodeURIComponent(email)}&success_url=${encodeURIComponent("https://signals.abokifx.app/dashboard?upgraded=1")}&cancel_url=${encodeURIComponent("https://signals.abokifx.app/pricing")}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError("Could not create checkout session. Please try again.");
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f8fafc" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20, color: "#111827", textDecoration: "none" }}>ForexAI Signals</a>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <a href="/dashboard" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Dashboard</a>
          <a href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Login</a>
        </div>
      </nav>

      <div style={{ textAlign: "center", padding: "56px 24px 40px" }}>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: "0 0 12px" }}>Simple, transparent pricing</h1>
        <p style={{ fontSize: 16, color: "#6b7280", margin: 0 }}>Start free. Upgrade when you're ready. Cancel anytime.</p>
        <div style={{ display: "inline-block", background: "#dcfce7", color: "#15803d", fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 99, marginTop: 16 }}>
          Test mode — use card 4242 4242 4242 4242
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: 500, margin: "0 auto 24px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#dc2626", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, maxWidth: 980, margin: "0 auto", padding: "0 24px 64px" }}>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: "#fff",
            border: plan.featured ? `2px solid ${plan.color}` : "1px solid #e5e7eb",
            borderRadius: 16, padding: "32px 28px",
            position: "relative",
          }}>
            {plan.featured && (
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 99, whiteSpace: "nowrap" }}>
                Most Popular
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{plan.name}</div>
              <div style={{ marginTop: 10 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: plan.color }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: "#9ca3af", marginLeft: 6 }}>/{plan.period}</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 14, color: "#374151", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlan(plan)}
              disabled={loading === plan.name}
              style={{
                width: "100%", padding: "13px",
                background: plan.featured ? plan.color : "transparent",
                color: plan.featured ? "#fff" : plan.color,
                border: `2px solid ${plan.color}`,
                borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: loading === plan.name ? "not-allowed" : "pointer",
                opacity: loading === plan.name ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading === plan.name ? "Redirecting..." : plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "0 24px 48px", fontSize: 13, color: "#9ca3af" }}>
        7-day money-back guarantee · Secure payments by Stripe · Cancel anytime
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/terms" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Privacy</a>
          <a href="/contact" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
