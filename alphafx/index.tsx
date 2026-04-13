"use client";
import { Nav, Footer, T, GoldButton, GhostButton, Card, AuthProvider } from "./_layout";

export default function HomePage() {
  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />

        {/* Hero */}
        <section style={{
          padding: "100px 32px 80px",
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)`,
          textAlign: "center",
          borderBottom: `1px solid ${T.border}`,
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: T.goldBg, border: `1px solid ${T.gold}40`,
            borderRadius: 99, padding: "6px 16px", marginBottom: 32,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green }} />
            <span style={{ fontSize: 12, color: T.gold, fontWeight: 500, letterSpacing: "0.05em" }}>
              LIVE AI SIGNALS — EUR/USD H1
            </span>
          </div>

          <h1 style={{
            fontSize: 62, fontWeight: 800, lineHeight: 1.05,
            margin: "0 auto 24px", maxWidth: 800,
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.03em",
          }}>
            Trade smarter with<br />
            <span style={{ color: T.gold }}>AI-powered</span> signals
          </h1>

          <p style={{ fontSize: 18, color: T.muted, maxWidth: 540, margin: "0 auto 40px", lineHeight: 1.7 }}>
            Machine learning analysis of EUR/USD price action. Confidence scores, entry levels, and real-time alerts — updated every hour.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <GoldButton href="/register" style={{ padding: "14px 36px", fontSize: 15 }}>
              Start Free — No Card Needed
            </GoldButton>
            <GhostButton href="/pricing" style={{ padding: "14px 36px", fontSize: 15 }}>
              View Pricing
            </GhostButton>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 64, flexWrap: "wrap" }}>
            {[
              ["EUR/USD", "Primary pair"],
              ["H1 Signals", "Hourly updates"],
              ["AI Scored", "Confidence %"],
              ["Free to start", "No card required"],
            ].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.white }}>{val}</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "80px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>From data to decision</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 2 }}>
            {[
              { n: "01", title: "Data collection", desc: "Live EUR/USD candles fetched from OANDA every hour — 3 years of training data." },
              { n: "02", title: "AI analysis",     desc: "XGBoost model analyses 70+ indicators: ADX trend regime, EMA alignment, RSI, MACD, session filters." },
              { n: "03", title: "Signal generation", desc: "Only high-confidence setups pass our filters: session timing, spread, R:R ratio minimum 1.5:1." },
              { n: "04", title: "Instant alerts",  desc: "Signal published to dashboard immediately. Telegram and email alerts sent to Pro/VIP members." },
            ].map(s => (
              <div key={s.n} style={{ padding: "32px 28px", borderLeft: `1px solid ${T.border}`, position: "relative" }}>
                <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 16, letterSpacing: "0.1em" }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section style={{ padding: "80px 32px", background: T.dark, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
              <h2 style={{ fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>Everything you need</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1 }}>
              {[
                { icon: "◈", title: "AI Confidence Score",  desc: "Every signal carries a percentage confidence from our trained model — so you know the strength of each setup." },
                { icon: "◉", title: "Full Entry, SL & TP",  desc: "No vague calls. Pro members get exact entry price, stop loss, and take profit levels with every signal." },
                { icon: "◎", title: "Session Intelligence",  desc: "Signals fire only during London and New York sessions — the highest liquidity windows for EUR/USD." },
                { icon: "◇", title: "Performance Tracking", desc: "Full win rate, P&L in pips, and equity curve updated daily. Complete transparency on every signal." },
                { icon: "◆", title: "Telegram Alerts",      desc: "Instant Telegram alerts when signals fire. VIP members get priority notification with full details." },
                { icon: "◈", title: "Multi-pair Signals",   desc: "VIP members get signals across multiple currency pairs as we expand beyond EUR/USD." },
              ].map(f => (
                <div key={f.title} style={{ padding: "32px 28px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 20, color: T.gold, marginBottom: 14 }}>{f.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: T.white, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "100px 32px", textAlign: "center", background: T.black }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2 style={{ fontSize: 42, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 16px" }}>
              Start trading with an edge
            </h2>
            <p style={{ fontSize: 16, color: T.muted, margin: "0 0 36px", lineHeight: 1.7 }}>
              Join traders using AlphaForexAI. Free forever — upgrade when you're ready.
            </p>
            <GoldButton href="/register" style={{ padding: "16px 48px", fontSize: 16 }}>
              Create Free Account
            </GoldButton>
          </div>
        </section>

        <Footer />
      </div>
    </AuthProvider>
  );
}
