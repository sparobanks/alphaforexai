"use client";

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20, color: "#111827", textDecoration: "none" }}>ForexAI Signals</a>
        <a href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Login</a>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 40 }}>Last updated: January 2026</p>

        {[
          ["Information We Collect", "We collect information you provide when registering (email address, password). We also collect usage data such as login times, pages visited, and signals viewed. We do not collect payment card details — payments are processed by Stripe."],
          ["How We Use Your Information", "We use your email to send account notifications, signal alerts (if enabled), and service updates. We use usage data to improve our platform and fix issues. We never sell your personal data to third parties."],
          ["Data Storage", "Your data is stored securely on servers within the European Union. Passwords are hashed using bcrypt and are never stored in plain text."],
          ["Cookies", "We use essential cookies for authentication (keeping you logged in). We do not use tracking or advertising cookies."],
          ["Third-Party Services", "We use Stripe for payment processing (subject to Stripe's privacy policy), OANDA for market data, and Telegram for optional signal alerts. These services have their own privacy policies."],
          ["Data Retention", "We retain your account data for as long as your account is active. You may request deletion of your account and all associated data at any time by contacting us."],
          ["Your Rights", "Under GDPR you have the right to access, correct, or delete your personal data. You also have the right to data portability and to object to processing. Contact us to exercise these rights."],
          ["Security", "We implement industry-standard security measures including HTTPS encryption, hashed passwords, and regular security reviews. However no system is 100% secure."],
          ["Contact", "For privacy-related requests: privacy@signals.abokifx.app"],
        ].map(([title, content]) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
            <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.8, margin: 0 }}>{content}</p>
          </div>
        ))}
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/terms" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Terms</a>
          <a href="/contact" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Contact</a>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Home</a>
        </div>
      </footer>
    </div>
  );
}
