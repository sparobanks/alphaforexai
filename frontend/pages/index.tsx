"use client";
import React from "react";
import { Nav, Footer, T, GoldButton, GhostButton, Card, AuthProvider, SeoHead } from "../components/_layout";

function LiveSignalPreview() {
  const [signals, setSignals]   = React.useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);

    fetch("https://alphaforexai.com/api/v1/signals/public/live")
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data.slice(0, 2) : [];
        if (items.length === 0) {
          return fetch("https://alphaforexai.com/api/v1/signals/public/recent")
            .then(r => r.json())
            .then(d => setSignals(Array.isArray(d) ? d.slice(0, 2) : []));
        }
        setSignals(items);
      })
      .catch(() => {});
  }, []);

  if (signals.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginTop: 24 }}>
      {signals.map((s, i) => (
        <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${s.direction === "BUY" ? T.green : T.red}`, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 700, color: s.direction === "BUY" ? T.green : T.red, fontSize: 13, minWidth: 36 }}>{s.direction}</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: T.white }}>{s.pair}</span>
            {s.is_live
              ? <span style={{ background: "#22c55e20", color: "#22c55e", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>● LIVE</span>
              : <span style={{ background: T.goldBg, color: T.gold, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>Recent</span>
            }
            <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>
              {s.created_at ? new Date(s.created_at).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
            {[["Entry", s.entry_price?.toFixed(s.pair?.includes("XAU") ? 2 : 5)], ["Stop Loss", null], ["Take Profit", null]].map(([lbl, val]) => (
              <div key={lbl as string} style={{ background: "#0f0f0f", borderRadius: 8, padding: "8px", textAlign: "center" as const }}>
                <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{lbl}</div>
                {val
                  ? <div style={{ fontSize: 12, fontWeight: 600, color: T.white, fontFamily: "monospace" }}>{val}</div>
                  : <div style={{ fontSize: 12, fontWeight: 600, color: T.gold, filter: "blur(5px)", userSelect: "none" as const, fontFamily: "monospace" }}>1.23456</div>
                }
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" as const }}>
            {isLoggedIn ? (
              <>
                <span style={{ fontSize: 12, color: T.gold }}>✓ You are signed in — view full details on your dashboard</span>
                <a href="/dashboard" style={{ fontSize: 12, fontWeight: 700, color: T.black, background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, padding: "5px 14px", borderRadius: 6, textDecoration: "none" }}>Go to Dashboard →</a>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: T.gold }}>🔒 Register free to see SL & TP levels</span>
                <a href="/register" style={{ fontSize: 12, fontWeight: 700, color: T.black, background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, padding: "5px 14px", borderRadius: 6, textDecoration: "none" }}>Sign Up Free</a>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentSignals() {
  const [signals, setSignals] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("https://alphaforexai.com/api/v1/signals/public/recent")
      .then(r => r.json())
      .then(data => setSignals(Array.isArray(data) ? data.filter((s: any) => s.status !== "EXPIRED") : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center" as const, padding: "32px", color: T.muted, fontSize: 13 }}>Loading...</div>;
  if (signals.length === 0) return <div style={{ textAlign: "center" as const, padding: "32px", color: T.muted, fontSize: 13 }}>No closed signals yet.</div>;

  const totalPips = signals.reduce((sum, s) => sum + (s.pnl_pips || 0), 0);
  const wins = signals.filter(s => (s.pnl_pips || 0) > 0).length;
  const winRate = Math.round((wins / signals.length) * 100);
  const dp = (pair: string) => pair?.includes("XAU") || pair?.includes("JPY") ? 2 : 5;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Win Rate", value: `${winRate}%`, color: winRate >= 50 ? T.green : T.red },
          { label: "Total Pips", value: `${totalPips > 0 ? "+" : ""}${Math.round(totalPips)}`, color: totalPips >= 0 ? T.green : T.red },
          { label: "Signals", value: `${signals.length} recent`, color: T.muted },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 10px", textAlign: "center" as const }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Signal cards - same style as dashboard */}
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
        {signals.map(s => {
          const isWin     = s.status === "TP_HIT";
          const isExpired = s.status === "EXPIRED";
          const dirColor  = s.direction === "BUY" ? T.green : T.red;
          const statusColor = isWin ? T.green : isExpired ? T.muted : T.red;
          const statusLabel = isWin ? "✓ TP Hit" : isExpired ? "⏱ Expired" : "✗ SL Hit";
          return (
            <div key={s.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", borderLeft: `3px solid ${statusColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                <span style={{ fontWeight: 700, color: dirColor, fontSize: 13, minWidth: 36 }}>{s.direction}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: T.white }}>{s.pair}</span>
                <span style={{ background: statusColor + "20", color: statusColor, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>
                  {statusLabel}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 13, color: statusColor }}>
                  {isExpired ? "—" : ((s.pnl_pips || 0) > 0 ? "+" : "") + s.pnl_pips + "p"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 }}>
                {[["Entry", s.entry_price?.toFixed(dp(s.pair)), T.white], ["SL", s.sl_price?.toFixed(dp(s.pair)), T.red], ["TP", s.tp_price?.toFixed(dp(s.pair)), T.green]].map(([lbl, val, col]) => (
                  <div key={lbl as string} style={{ background: "#0f0f0f", borderRadius: 8, padding: "8px", textAlign: "center" as const }}>
                    <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 3 }}>{lbl}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: col as string, fontFamily: "monospace" }}>{val ?? "—"}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center" as const, marginTop: 16 }}>
        <a href="/register" style={{ fontSize: 13, color: T.gold, textDecoration: "none", fontWeight: 600 }}>
          Create free account to see live signals →
        </a>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <SeoHead title="AI-Powered Forex Signals" description="Get live EUR/USD forex signals powered by XGBoost AI. Free to start. Pro and VIP plans available." path="/" />
        <Nav />

        {/* Hero */}
        <section style={{
          padding: "72px 20px 64px",
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
          <div style={{ maxWidth: 540, margin: "0 auto 32px", textAlign: "left" }}>
            <div style={{ fontSize: 11, color: "#c9a84c", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Live Signals Preview</div>
            <LiveSignalPreview />
          </div>
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

        {/* Telegram CTA */}
        <section style={{ padding: "64px 20px", background: "#0d1117", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0088cc20", border: "1px solid #0088cc40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24 }}>✈</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>Join our Telegram channel</h2>
            <p style={{ fontSize: 15, color: T.muted, margin: "0 0 28px", lineHeight: 1.7 }}>
              Get instant signal alerts sent directly to your Telegram. Free members get direction alerts. Pro/VIP get full details.
            </p>
            <a href="https://t.me/alphaforexai" target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "#0088cc", color: "#fff",
              padding: "13px 28px", borderRadius: 8, fontSize: 15, fontWeight: 600,
              textDecoration: "none",
            }}>
              Join @alphaforexai →
            </a>
          </div>
        </section>

        {/* Recent Signals */}
        <section style={{ padding: "64px 20px", borderTop: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center" as const, marginBottom: 36 }}>
              <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 }}>TRANSPARENCY</div>
              <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 10px" }}>Recent Signal Results</h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Our last 10 closed signals — real results, no cherry-picking.</p>
            </div>
            <RecentSignals />
          </div>
        </section>

        {/* Auto-trading CTA */}
        <section style={{ padding: "64px 20px", background: "#120a1e", borderTop: `1px solid #a78bfa30`, borderBottom: `1px solid #a78bfa30` }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1a0a2e", border: "1px solid #a78bfa40", borderRadius: 99, padding: "5px 14px", marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, letterSpacing: "0.05em" }}>⚡ VIP EXCLUSIVE</span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 16px", color: T.white, lineHeight: 1.2 }}>
                Let the AI trade<br /><span style={{ color: "#a78bfa" }}>for you automatically</span>
              </h2>
              <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.7, marginBottom: 24 }}>
                VIP members can connect their OANDA account and enable auto-trading. Every signal that fires gets executed automatically with proper position sizing based on your account balance and risk settings.
              </p>
              <div style={{ background: "#1a0a2e", border: "1px solid #a78bfa30", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd", marginBottom: 6 }}>🏦 More brokers coming soon</div>
                <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                  Currently supporting OANDA (practice & live). Using a different broker?{" "}
                  <a href="/register" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>Sign up</a>
                  {" "}and request your broker — we prioritise based on demand.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10, marginBottom: 28 }}>
                {[
                  "Automatic trade execution on every signal",
                  "Risk % per trade — you set it (0.1% to 5%)",
                  "Auto position sizing from your account balance",
                  "Works with OANDA practice and live accounts",
                  "Enable/disable with one toggle",
                ].map(f => (
                  <div key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 14, color: T.muted }}>{f}</span>
                  </div>
                ))}
              </div>
              <a href="/pricing" style={{ display: "inline-block", padding: "12px 28px", background: "#7c3aed", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Get VIP — £20/mo →
              </a>
            </div>
            <div style={{ background: "#0f0a1a", border: "1px solid #a78bfa30", borderRadius: 16, padding: "28px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
              <div style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 4 }}>Auto-Trade Setup</div>
              {[
                { step: "1", title: "Connect OANDA", desc: "Add your OANDA account ID and API key in your profile settings." },
                { step: "2", title: "Set your risk", desc: "Choose how much to risk per trade — from 0.1% to 5% of your balance." },
                { step: "3", title: "Enable & go", desc: "Toggle auto-trading on. Every signal fires a real trade automatically." },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ background: "#1a0a0a", border: "1px solid #f8717140", borderRadius: 8, padding: "10px 14px", marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#fca5a5", lineHeight: 1.5 }}>⚠️ Auto-trading involves real financial risk. Use practice mode first. Only trade what you can afford to lose.</div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "56px 20px", maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>From data to decision</h2>
          </div>
          <style>{`.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2px;}@media(max-width:600px){.how-grid{grid-template-columns:1fr!important;}}`}</style>
          <div className="how-grid">
            {[
              { n: "01", title: "Data collection", desc: "Live EUR/USD and other pairs candles fetched from Data source every hour — 3 years of training data." },
              { n: "02", title: "AI analysis",     desc: "Our model analyses 70+ indicators: ADX trend regime, EMA alignment, RSI, MACD, session filters." },
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
        <section style={{ padding: "56px 20px", background: T.dark, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
              <h2 style={{ fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", margin: 0 }}>Everything you need</h2>
            </div>
            <style>{`.feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; } @media(max-width:600px){.feat-grid{grid-template-columns:1fr!important;}}`}</style>
            <div className="feat-grid">
              {[
                { icon: "◈", title: "AI Confidence Score",  desc: "Every signal carries a percentage confidence from our trained model - so you know the strength of each setup." },
                { icon: "◉", title: "Full Entry, SL & TP",  desc: "No vague calls. Pro members get exact entry price, stop loss, and take profit levels with every signal." },
                { icon: "◎", title: "Session Intelligence",  desc: "Signals fire only during London and New York sessions — the highest liquidity windows for EUR/USD." },
                { icon: "◎", title: "Auto Trading",  desc: "Let our trained AI trade for you immediately signals fires." },
                { icon: "◇", title: "Performance Tracking", desc: "Full win rate, P&L in pips, and equity curve updated daily. Complete transparency on every signal." },
                { icon: "◆", title: "Telegram Alerts",      desc: "Instant Telegram alerts when signals fire. VIP members get priority notification with full details." },
                { icon: "◈", title: "Multi-pair Signals",   desc: "VIP members get signals across multiple currency pairs, not just EUR/USD." },
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

        {/* Risk Disclaimer */}
      <div style={{ background: "#0a0a0a", borderTop: `1px solid ${T.border}`, padding: "20px", textAlign: "center" as const }}>
        <div style={{ maxWidth: 900, margin: "0 auto", fontSize: 11, color: T.muted2, lineHeight: 1.7 }}>
          <strong style={{ color: T.muted }}>Risk Warning:</strong> Trading forex and CFDs involves significant risk of loss and may not be suitable for all investors. 
          73-89% of retail investor accounts lose money when trading CFDs. AlphaForexAI provides trading signals for informational and educational purposes only. 
          We are not regulated by the Financial Conduct Authority (FCA) or any other financial regulatory body. 
          Our signals do not constitute financial advice. Past performance is not indicative of future results. 
          Please ensure you fully understand the risks involved and seek independent financial advice if necessary.
        </div>
      </div>

      <Footer />
      </div>
    </AuthProvider>
  );
}
