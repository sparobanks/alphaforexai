"use client";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#111827" }}>ForexAI Signals</div>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/about" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Pricing</a>
          <a href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Login</a>
          <button onClick={() => router.push("/login")} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 64px", background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)" }}>
        <div style={{ display: "inline-block", background: "#dbeafe", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "4px 14px", borderRadius: 99, marginBottom: 24, letterSpacing: "0.05em" }}>
          AI-POWERED FOREX SIGNALS
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, margin: "0 0 24px", maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          Stop guessing.<br />Start trading with AI.
        </h1>
        <p style={{ fontSize: 18, color: "#6b7280", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
          ForexAI Signals uses machine learning to analyse EUR/USD price action and deliver high-confidence trade setups directly to your dashboard.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => router.push("/login")} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
            Start Free — No Card Needed
          </button>
          <button onClick={() => router.push("/pricing")} style={{ background: "transparent", color: "#111827", border: "2px solid #e5e7eb", borderRadius: 8, padding: "14px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>
            View Pricing
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "#e5e7eb", borderTop: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
        {[
          ["EUR/USD", "Primary pair"],
          ["H1 Timeframe", "Hourly signals"],
          ["AI Confidence", "Score per signal"],
          ["Free to Start", "No card required"],
        ].map(([val, label]) => (
          <div key={label} style={{ background: "#fff", padding: "32px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>{val}</div>
            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: "80px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 16 }}>Everything you need to trade smarter</h2>
        <p style={{ fontSize: 16, color: "#6b7280", textAlign: "center", marginBottom: 56 }}>Not just signals — a complete trading system</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
          {[
            { title: "AI Confidence Score", desc: "Every signal comes with a confidence percentage from our XGBoost model trained on 3 years of price data.", icon: "🤖" },
            { title: "Full Entry, SL & TP", desc: "No vague calls. Every signal includes exact entry price, stop loss, and take profit levels.", icon: "🎯" },
            { title: "Session Filters", desc: "Signals only fire during London and New York sessions — the highest liquidity windows.", icon: "⏰" },
            { title: "Performance Tracking", desc: "Full win rate, P&L in pips, and equity curve updated daily. Full transparency.", icon: "📊" },
            { title: "Telegram Alerts", desc: "Get notified the moment a signal fires. Never miss a setup.", icon: "📱" },
            { title: "Risk Management", desc: "Every signal includes a recommended risk percentage and reward-to-risk ratio.", icon: "🔒" },
          ].map(f => (
            <div key={f.title} style={{ padding: "28px", border: "1px solid #e5e7eb", borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "#111827", color: "#fff", textAlign: "center", padding: "64px 24px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 16px" }}>Ready to get started?</h2>
        <p style={{ fontSize: 16, color: "#9ca3af", marginBottom: 32 }}>Create a free account and see live signals today.</p>
        <button onClick={() => router.push("/login")} style={{ background: "#fff", color: "#111827", border: "none", borderRadius: 8, padding: "14px 36px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Create Free Account
        </button>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontWeight: 700, color: "#111827" }}>ForexAI Signals</div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href="/about" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>About</a>
          <a href="/pricing" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Pricing</a>
          <a href="/terms" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Privacy</a>
          <a href="/contact" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Contact</a>
        </div>
        <div style={{ fontSize: 13, color: "#9ca3af" }}>© 2026 ForexAI Signals. All rights reserved.</div>
      </footer>
    </div>
  );
}
