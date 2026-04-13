"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { T, Nav, Footer, GoldButton, GhostButton, AuthProvider, useAuth } from "./_layout";

const API = "https://alphaforexai.com/api/v1";

const PLANS = [
  {
    name: "Free", price: "£0", period: "forever", priceId: null,
    color: T.muted, featured: false,
    features: [
      "EUR/USD signals (1hr delayed)",
      "Direction only — no SL/TP",
      "7-day signal history",
      "Basic dashboard access",
      "Weekly performance summary",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro", price: "£10", period: "per month", priceId: "price_1TJt9W4wcBC96UexPS4MjvS9",
    color: T.gold, featured: true,
    features: [
      "Live signals — no delay",
      "Full entry, SL & TP levels",
      "AI confidence score",
      "Full dashboard analytics",
      "30-day signal history",
      "Email alerts",
    ],
    cta: "Start Pro",
  },
  {
    name: "VIP", price: "£20", period: "per month", priceId: "price_1TJt9H4wcBC96UexFn3taUAi",
    color: "#a78bfa", featured: false,
    features: [
      "Everything in Pro",
      "Multi-pair signals",
      "Telegram alerts",
      "Priority notifications",
      "AI strategy breakdown",
      "Early access to new pairs",
    ],
    cta: "Go VIP",
  },
];

function PricingContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handlePlan(plan: typeof PLANS[0]) {
    setError("");
    if (!plan.priceId) { router.push("/register"); return; }
    if (!user) { router.push("/register"); return; }
    if (user.tier === plan.name.toLowerCase()) {
      router.push("/dashboard"); return;
    }
    setLoadingPlan(plan.name);
    try {
      const token = localStorage.getItem("token");
      const meRes = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      const me    = await meRes.json();
      const res   = await fetch(
        `${API}/payments/create-checkout?price_id=${plan.priceId}&user_email=${encodeURIComponent(me.email)}&success_url=${encodeURIComponent("https://alphaforexai.com/dashboard?upgraded=1")}&cancel_url=${encodeURIComponent("https://alphaforexai.com/pricing")}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.checkout_url) window.location.href = data.checkout_url;
      else setError("Could not create checkout session. Please try again.");
    } catch { setError("Something went wrong. Please try again."); }
    finally  { setLoadingPlan(null); }
  }

  function getCtaLabel(plan: typeof PLANS[0]) {
    if (loading) return "...";
    if (!user) return plan.cta;
    if (user.tier === plan.name.toLowerCase()) return "Current plan";
    return plan.cta;
  }

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      <div style={{ padding: "72px 32px 32px", textAlign: "center", background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>PRICING</div>
        <h1 style={{ fontSize: 44, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: T.muted, margin: "0 0 12px" }}>Start free. Upgrade when you're ready.</p>
        <p style={{ fontSize: 13, color: T.muted2 }}>7-day money-back guarantee · Secure payments by Stripe · Cancel anytime</p>
      </div>

      {error && (
        <div style={{ maxWidth: 500, margin: "16px auto", background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#f87171", textAlign: "center" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 1, maxWidth: 980, margin: "48px auto 80px", padding: "0 32px", border: `1px solid ${T.border}` }}>
        {PLANS.map((plan, i) => (
          <div key={plan.name} style={{
            padding: "40px 32px",
            background: plan.featured ? "#141414" : T.card,
            borderRight: i < PLANS.length - 1 ? `1px solid ${T.border}` : "none",
            position: "relative",
          }}>
            {plan.featured && (
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                background: T.gold, color: T.black,
                fontSize: 10, fontWeight: 700, padding: "4px 16px",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Most Popular
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 10, letterSpacing: "0.05em" }}>
                {plan.name.toUpperCase()}
              </div>
              <div>
                <span style={{ fontSize: 44, fontWeight: 800, color: T.white, letterSpacing: "-0.03em" }}>{plan.price}</span>
                <span style={{ fontSize: 14, color: T.muted, marginLeft: 6 }}>/{plan.period}</span>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: 12 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display: "flex", gap: 10, fontSize: 14, color: T.muted }}>
                  <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePlan(plan)}
              disabled={loadingPlan === plan.name || (user?.tier === plan.name.toLowerCase())}
              style={{
                width: "100%", padding: "13px",
                background: plan.featured ? `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)` : "transparent",
                color: plan.featured ? T.black : plan.color,
                border: `1px solid ${plan.featured ? T.gold : plan.color + "60"}`,
                borderRadius: 8, fontSize: 14, fontWeight: 700,
                cursor: loadingPlan === plan.name || user?.tier === plan.name.toLowerCase() ? "not-allowed" : "pointer",
                opacity: loadingPlan === plan.name ? 0.7 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {loadingPlan === plan.name ? "Redirecting..." : getCtaLabel(plan)}
            </button>
          </div>
        ))}
      </div>

      {/* Feature comparison */}
      <div style={{ maxWidth: 980, margin: "0 auto 80px", padding: "0 32px" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 32, fontFamily: "Georgia, serif" }}>Compare plans</h2>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: "16px 20px", textAlign: "left", color: T.muted, fontWeight: 500 }}>Feature</th>
                {PLANS.map(p => (
                  <th key={p.name} style={{ padding: "16px 20px", textAlign: "center", color: p.featured ? T.gold : T.white, fontWeight: 600 }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Signal delay",       "1 hour", "Live", "Live"],
                ["Entry price",        "✓",      "✓",    "✓"],
                ["Stop loss & TP",     "—",      "✓",    "✓"],
                ["AI confidence",      "—",      "✓",    "✓"],
                ["Signal history",     "7 days", "30 days", "Unlimited"],
                ["Email alerts",       "—",      "✓",    "✓"],
                ["Telegram alerts",    "—",      "—",    "✓"],
                ["Multi-pair signals", "—",      "—",    "✓"],
              ].map(([feature, ...values], i) => (
                <tr key={feature} style={{ borderBottom: i < 7 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "14px 20px", color: T.muted }}>{feature}</td>
                  {values.map((v, j) => (
                    <td key={j} style={{ padding: "14px 20px", textAlign: "center", color: v === "—" ? T.muted2 : v === "✓" ? T.green : T.white }}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function PricingPage() {
  return <AuthProvider><PricingContent /></AuthProvider>;
}
