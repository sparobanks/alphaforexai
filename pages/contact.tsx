"use client";
import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production connect this to an email service like Resend or Formspree
    setSent(true);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#111827" }}>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 20, color: "#111827", textDecoration: "none" }}>ForexAI Signals</a>
        <a href="/login" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none" }}>Login</a>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>Contact Us</h1>
        <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 40 }}>Have a question or need support? We'll get back to you within 24 hours.</p>

        {sent ? (
          <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 12, padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Message sent!</div>
            <div style={{ fontSize: 14, color: "#166534" }}>We'll get back to you within 24 hours.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Name</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 6 }}>Message</label>
              <textarea
                required rows={5} value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box" as const, resize: "vertical" }}
              />
            </div>
            <button type="submit" style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Send Message
            </button>
          </form>
        )}

        <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #e5e7eb" }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Other ways to reach us</div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Email: support@signals.abokifx.app</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Response time: within 24 hours</div>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/terms" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Terms</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Privacy</a>
          <a href="/" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Home</a>
        </div>
      </footer>
    </div>
  );
}
