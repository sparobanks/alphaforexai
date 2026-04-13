"use client";

export default function AboutPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20, color: "#111827", textDecoration: "none" }}>ForexAI Signals</a>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/pricing" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Pricing</a>
          <a href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Login</a>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>About ForexAI Signals</h1>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, marginBottom: 24 }}>
          ForexAI Signals is an AI-powered forex signal platform built to give retail traders access to the kind of systematic, data-driven analysis previously only available to institutional traders.
        </p>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, marginBottom: 24 }}>
          Our system uses an XGBoost machine learning model trained on over 3 years of EUR/USD hourly price data. Rather than predicting vague direction, the model predicts a specific outcome: whether price will hit a +20 pip take profit before a -10 pip stop loss within the next 12 hours.
        </p>
        <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.8, marginBottom: 48 }}>
          Every signal is filtered through session rules (London and New York only), spread checks, trend alignment, and a minimum reward-to-risk ratio of 1.5:1 before it ever reaches your dashboard.
        </p>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>How the AI works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
          {[
            ["1. Data collection", "We pull live EUR/USD H1 candles from OANDA every hour."],
            ["2. Feature engineering", "25 technical indicators are computed: RSI, MACD, ATR, Bollinger Bands, session flags, and more."],
            ["3. Model prediction", "Our XGBoost model outputs a confidence score (0–100%) for a profitable setup."],
            ["4. Signal filtering", "Only signals above the confidence threshold, during active sessions, with good R:R pass through."],
            ["5. Published to dashboard", "Qualifying signals are saved, displayed, and alerted via Telegram."],
          ].map(([title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 16, padding: "16px", border: "1px solid #e5e7eb", borderRadius: 10 }}>
              <div style={{ fontWeight: 700, minWidth: 180, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>{desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "20px 24px" }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Risk disclaimer</div>
          <p style={{ fontSize: 14, color: "#92400e", lineHeight: 1.7, margin: 0 }}>
            Forex and CFD trading involves significant risk of loss. Past performance of our signals is not a guarantee of future results. This platform provides informational content only and does not constitute personal financial advice. Always trade with money you can afford to lose and consider seeking independent financial advice.
          </p>
        </div>
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
