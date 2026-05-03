"use client";
import { useState } from "react";
import { Nav, Footer, T, GoldButton, Card, AuthProvider } from "../components/_layout";

// ── Contact ───────────────────────────────────────────────────────────────────
export function ContactPage() {
  const [form, setForm]   = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  function set(k: string) { return (e: any) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("https://alphaforexai.com/api/v1/auth/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
      } else {
        alert("Failed to send message. Please email us directly at hello@alphaforexai.com");
      }
    } catch {
      alert("Connection error. Please email us directly at hello@alphaforexai.com");
    } finally {
      setLoading(false);
    }
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
            {/* Info */}
            <div>
              {[
                { label: "Email", value: "hello@alphaforexai.com", href: "mailto:hello@alphaforexai.com" },
                
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
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16 }}>
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
              Our model is trained on over 3 years of EUR/USD and other pairs hourly data. It predicts a specific outcome, whether price will hit a defined take profit before a stop loss within the next 24 hours, using 70+ technical features including ADX trend regime detection, EMA alignment, RSI, MACD, Bollinger Bands, and session intelligence.
            </p>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8 }}>
              Every signal passes through multiple filters: active trading session, trend alignment, minimum R:R ratio, and confidence threshold. Only the highest-quality setups reach your dashboard.
            </p>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 48, marginBottom: 48 }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: "Georgia, serif", marginBottom: 24 }}>How the AI works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {[
                ["Data", "Live EUR/USD H1 candles from our data source. 3+ years training history."],
                ["Features", "70+ indicators: ADX, EMA alignment, RSI, MACD, BB, volume, session flags, price position."],
                ["Model", "Our classifier. Walk-forward validated. Trained only on London/NY session bars."],
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
    ["5. Subscriptions", "Paid subscriptions are billed monthly. You may cancel anytime. Pricing may change with 30 days notice."],
    ["6. Account Responsibility", "You are responsible for maintaining confidentiality of your credentials and all activity under your account."],
    ["7. Limitation of Liability", "AlphaForexAI shall not be liable for any trading losses or other damages arising from use of our service."],
    ["8. Intellectual Property", "All content and algorithms are the intellectual property of AlphaForexAI and may not be reproduced without written permission."],
    ["9. Termination", "We may suspend or terminate accounts at our discretion for violations of these terms."],
    ["10. Governing Law", "These terms are governed by the laws of England and Wales."],
    ["11. Contact", "Questions? Email hello@alphaforexai.com"],
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
    ["Last Updated", "April 2026"],
    ["Company Information", "AlphaForexAI is an AI-powered forex signal information service operated as an independent technology business. Our registered contact email is hello@alphaforexai.com. We provide trading signal information only and do not manage client funds or execute trades on behalf of clients."],
    ["Regulatory Status", "AlphaForexAI is NOT authorised or regulated by the Financial Conduct Authority (FCA) or any other financial regulatory body. We operate as a signal information service only. We do not provide regulated financial advice, portfolio management, or investment services as defined under the Financial Services and Markets Act 2000 (FSMA). Our signals are provided for informational and educational purposes only. Users are responsible for their own trading decisions. If you require regulated financial advice, please consult an FCA-authorised advisor."],
    ["Fee Disclosure", "We are fully transparent about all fees associated with our service. Free Plan: £0.00 per month — no credit card required, no hidden charges. Pro Plan: £10.00 per month (GBP), billed monthly via Stripe. VIP Plan: £20.00 per month (GBP), billed monthly via Stripe. There are no setup fees, no cancellation fees, and no hidden charges. Subscriptions can be cancelled at any time. No refunds are issued for partial months. All prices are displayed inclusive of any applicable taxes on our pricing page at alphaforexai.com/pricing."],
    ["Service Description", "AlphaForexAI provides AI-generated forex trading signals for major currency pairs including EUR/USD, GBP/USD, USD/JPY, and XAU/USD. Our signals include entry price, stop loss, and take profit levels. AlphaForexAI does not hold, manage, or have access to user funds at any time."],
    ["Auto-Trading Feature (VIP Only)", "VIP subscribers may optionally enable an auto-trading feature that connects directly to their personal OANDA brokerage account. This feature: (1) Is entirely optional and disabled by default. (2) Requires the subscriber to provide their own OANDA account credentials. (3) Executes trades on the subscriber's own OANDA account only — AlphaForexAI never has custody of, or direct access to, user funds. (4) Allows the subscriber to set their own risk percentage per trade (0.1% to 5%). (5) Can be disabled by the subscriber at any time. AlphaForexAI acts solely as a technology intermediary connecting AI-generated signals to the subscriber's own broker account. The subscriber retains full control and responsibility for their trading account at all times. AlphaForexAI is not a portfolio manager, investment manager, or discretionary trader. OANDA API credentials provided by the subscriber are encrypted in our database and are never shared with third parties. Subscribers using the auto-trading feature do so entirely at their own risk and should ensure they understand the risks of automated trading before enabling this feature."],
    ["Regulatory Note on Auto-Trading", "The auto-trading feature is a technology tool that automates the execution of signals generated by our AI model on the subscriber's own broker account. AlphaForexAI does not exercise discretionary control over client funds, does not hold client money, and does not provide investment management services as defined under FCA regulations. Subscribers are solely responsible for their trading decisions, account management, and any financial outcomes resulting from use of the auto-trading feature."],
    ["Risk Warning", "Forex trading involves substantial risk of loss. Past performance of our signals is not indicative of future results. 73-89% of retail investor accounts lose money when trading CFDs and forex. AlphaForexAI signals are for informational purposes only. You should not trade with money you cannot afford to lose. Always seek independent financial advice before making trading decisions."],
    ["Data We Collect", "We collect: email address, full name, phone number (optional), country, and subscription status. Payment data is processed exclusively by Stripe — we never store card details. We use cookies for authentication and session management only."],
    ["How We Use Your Data", "To provide and manage your subscription. To send signal alerts via email and Telegram (with your consent). To send weekly performance digests. To process payments via Stripe. To comply with legal obligations. We do not sell your personal data to third parties."],
    ["Third-Party Services", "Stripe (payment processing — stripe.com/privacy). OANDA (market data and optional auto-trading — oanda.com/privacy). Telegram (optional signal alerts — telegram.org/privacy). Google AdSense (advertising — policies.google.com/privacy). Each third party has their own privacy policy."],
    ["Taboola Advertising", "We may use Taboola's content discovery network to promote our services. Taboola may use cookies and tracking technologies to serve relevant advertisements. You can opt out of Taboola personalised advertising at optout.taboola.com. For more information see Taboola's privacy policy at taboola.com/privacy-policy."],
    ["Data Retention", "We retain your account data for as long as your account is active. You may request deletion of your data at any time by emailing hello@alphaforexai.com. We will process deletion requests within 30 days."],
    ["Your Rights", "Under UK GDPR you have the right to: access your personal data, correct inaccurate data, request erasure, object to processing, and data portability. To exercise these rights contact hello@alphaforexai.com."],
    ["Cookies", "We use essential cookies for authentication. We use third-party cookies from Google AdSense and Taboola for advertising. You can disable non-essential cookies in your browser settings."],
    ["Contact", "Privacy questions: hello@alphaforexai.com | Regulatory queries: hello@alphaforexai.com | Address: United Kingdom"],
  ];

  return (
    <AuthProvider>
      <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <Nav />
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "60px 20px" }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 8px" }}>Privacy Policy</h1>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 40 }}>AlphaForexAI — alphaforexai.com</p>
          <div style={{ background: "#1a0a0a", border: "1px solid #f8717140", borderRadius: 10, padding: "16px 20px", marginBottom: 32 }}>
            <div style={{ fontWeight: 600, color: "#fca5a5", fontSize: 14, marginBottom: 6 }}>⚠️ Important — Not FCA Regulated</div>
            <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
              AlphaForexAI is NOT authorised or regulated by the Financial Conduct Authority (FCA). We provide forex signal information only. This is not financial advice. Trading forex involves significant risk of loss.
            </p>
          </div>
          {sections.map(([title, text]) => (
            <div key={title} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: `1px solid ${T.border}` }}>
              <h2 style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{title}</h2>
              <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </AuthProvider>
  );
}


export default ContactPage;
