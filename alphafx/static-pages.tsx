"use client";
import { useState } from "react";
import { Nav, Footer, T, GoldButton, Card, AuthProvider } from "./_layout";

// ── Contact ───────────────────────────────────────────────────────────────────
export function ContactPage() {
  const [form, setForm]   = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  function set(k: string) { return (e: any) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true); setLoading(false);
  }

  const inputStyle: any = {
    background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "11px 14px", fontSize: 14, color: T.white, outline: "none",
    width: "100%", boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  const labelStyle: any = { fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 };

  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ marginBottom: 56 }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>CONTACT</div>
            <h1 style={{ fontSize: 44, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 16px", letterSpacing: "-0.02em" }}>Get in touch</h1>
            <p style={{ fontSize: 16, color: T.muted, maxWidth: 500 }}>Have a question or need support? We respond within 24 hours.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 48 }}>
            {/* Info */}
            <div>
              {[
                { label: "Email", value: "hello@alphaforexai.com", href: "mailto:hello@alphaforexai.com" },
                { label: "Support", value: "support@alphaforexai.com", href: "mailto:support@alphaforexai.com" },
                { label: "Response time", value: "Within 24 hours", href: null },
              ].map(item => (
                <div key={item.label} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.muted2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{item.label}</div>
                  {item.href
                    ? <a href={item.href} style={{ fontSize: 14, color: T.gold, textDecoration: "none" }}>{item.value}</a>
                    : <div style={{ fontSize: 14, color: T.muted }}>{item.value}</div>
                  }
                </div>
              ))}

              <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 13, color: T.gold, fontWeight: 600, marginBottom: 6 }}>Risk disclaimer</div>
                <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, margin: 0 }}>
                  Forex trading involves significant risk. Our signals are for informational purposes only. Always trade responsibly.
                </p>
              </div>
            </div>

            {/* Form */}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "36px 32px" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ fontSize: 36, marginBottom: 16, color: T.gold }}>✓</div>
                  <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 10 }}>Message sent!</div>
                  <p style={{ fontSize: 14, color: T.muted }}>We'll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div><label style={labelStyle}>Name</label><input type="text" value={form.name} onChange={set("name")} required placeholder="Your name" style={inputStyle} /></div>
                    <div><label style={labelStyle}>Email</label><input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" style={inputStyle} /></div>
                  </div>
                  <div><label style={labelStyle}>Subject</label><input type="text" value={form.subject} onChange={set("subject")} required placeholder="How can we help?" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Message</label><textarea value={form.message} onChange={set("message")} required rows={5} placeholder="Your message..." style={{ ...inputStyle, resize: "vertical" }} /></div>
                  <GoldButton type="submit" disabled={loading} style={{ padding: "13px", fontSize: 15, borderRadius: 8 }}>
                    {loading ? "Sending..." : "Send Message"}
                  </GoldButton>
                </form>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────
export function AboutPage() {
  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>ABOUT</div>
            <h1 style={{ fontSize: 44, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 24px", letterSpacing: "-0.02em" }}>About AlphaForexAI</h1>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8, marginBottom: 20 }}>
              AlphaForexAI is an AI-powered forex signal platform built to give retail traders access to systematic, data-driven analysis previously reserved for institutional desks.
            </p>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8, marginBottom: 20 }}>
              Our XGBoost model is trained on over 3 years of EUR/USD hourly data. It predicts a specific outcome — whether price will hit a defined take profit before a stop loss within the next 24 hours — using 70+ technical features including ADX trend regime detection, EMA alignment, RSI, MACD, Bollinger Bands, and session intelligence.
            </p>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8 }}>
              Every signal passes through multiple filters: active trading session, trend alignment, minimum R:R ratio, and confidence threshold. Only the highest-quality setups reach your dashboard.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 48, marginBottom: 48 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", marginBottom: 24 }}>How the AI works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                ["Data", "Live EUR/USD H1 candles from OANDA. 3+ years training history."],
                ["Features", "70+ indicators: ADX, EMA alignment, RSI, MACD, BB, volume, session flags, price position."],
                ["Model", "XGBoost classifier. Walk-forward validated. Trained only on London/NY session bars."],
                ["Filtering", "ADX > 20 (trending), EMA aligned, active session, spread check, R:R ≥ 1.5:1."],
                ["Output", "Confidence score + entry, SL, TP. Published to dashboard and sent as alerts."],
              ].map(([step, desc]) => (
                <div key={step} style={{ display: "flex", gap: 20, padding: "20px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: 700, color: T.gold, minWidth: 80, fontSize: 13, paddingTop: 2 }}>{step}</div>
                  <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "24px 28px" }}>
            <div style={{ fontWeight: 700, color: T.gold, marginBottom: 10 }}>Risk disclaimer</div>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>
              Forex and CFD trading involves significant risk of loss. Past performance of our signals does not guarantee future results. This platform provides informational content only and does not constitute personal financial advice. Only trade with money you can afford to lose. Contact us at <a href="mailto:hello@alphaforexai.com" style={{ color: T.gold }}>hello@alphaforexai.com</a>.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

// ── Terms ─────────────────────────────────────────────────────────────────────
export function TermsPage() {
  const sections = [
    ["1. Acceptance of Terms", "By accessing or using AlphaForexAI, you agree to these Terms. If you do not agree, do not use this service."],
    ["2. Nature of Service", "AlphaForexAI provides automated technical analysis and informational content. We do not provide personalised financial advice. Signals are generated by algorithms for informational purposes only."],
    ["3. Risk Disclaimer", "Forex and CFD trading carries high risk and may not be suitable for all investors. You may lose some or all of your invested capital. Past signal performance does not guarantee future results. Never trade with money you cannot afford to lose."],
    ["4. No Financial Advice", "Nothing on this platform constitutes financial, investment, legal, or tax advice. Seek independent professional advice before making trading decisions."],
    ["5. Subscriptions", "Paid subscriptions are billed monthly. You may cancel anytime. Refunds offered within 7 days of initial purchase. Pricing may change with 30 days notice."],
    ["6. Account Responsibility", "You are responsible for maintaining confidentiality of your credentials and all activity under your account."],
    ["7. Limitation of Liability", "AlphaForexAI shall not be liable for any trading losses or other damages arising from use of our service."],
    ["8. Intellectual Property", "All content and algorithms are the intellectual property of AlphaForexAI and may not be reproduced without written permission."],
    ["9. Termination", "We may suspend or terminate accounts at our discretion for violations of these terms."],
    ["10. Governing Law", "These terms are governed by the laws of England and Wales."],
    ["11. Contact", "Questions? Email legal@alphaforexai.com or hello@alphaforexai.com"],
  ];

  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>LEGAL</div>
          <h1 style={{ fontSize: 40, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 8px" }}>Terms & Conditions</h1>
          <p style={{ fontSize: 13, color: T.muted2, marginBottom: 48 }}>Last updated: January 2026</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {sections.map(([title, content]) => (
              <div key={title}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 10 }}>{title}</h2>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

// ── Privacy ───────────────────────────────────────────────────────────────────
export function PrivacyPage() {
  const sections = [
    ["Information We Collect", "We collect your email, name, phone, country, city, and date of birth when you register. We collect usage data (login times, pages visited, signals viewed). Payment details are handled by Stripe — we never store card numbers."],
    ["How We Use Your Information", "To send signal alerts, account notifications, and service updates. To improve our platform. To verify your identity and manage your subscription. We never sell your data."],
    ["Data Storage", "Your data is stored on secure servers in the European Union. Passwords are hashed with bcrypt and never stored in plain text."],
    ["Cookies", "We use essential cookies for authentication only. No tracking or advertising cookies."],
    ["Third-Party Services", "Stripe (payments), OANDA (market data), Telegram (optional alerts). Each has their own privacy policy."],
    ["Data Retention", "Account data retained while your account is active. Request deletion at any time by emailing privacy@alphaforexai.com."],
    ["Your Rights", "Under GDPR you have the right to access, correct, delete, or export your data. Contact privacy@alphaforexai.com."],
    ["Contact", "Privacy questions: privacy@alphaforexai.com | General: hello@alphaforexai.com"],
  ];

  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px" }}>
          <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>LEGAL</div>
          <h1 style={{ fontSize: 40, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 8px" }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: T.muted2, marginBottom: 48 }}>Last updated: January 2026</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {sections.map(([title, content]) => (
              <div key={title}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: T.white, marginBottom: 10 }}>{title}</h2>
                <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>{content}</p>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default ContactPage;
