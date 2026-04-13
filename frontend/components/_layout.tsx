"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";

const API = "https://alphaforexai.com/api/v1";

// ── SEO Head ─────────────────────────────────────────────────────────────────
export function SeoHead({ title, description, path = "" }: { title?: string; description?: string; path?: string }) {
  const t = title ? `${title} | AlphaForexAI` : "AlphaForexAI — AI-Powered Forex Signals";
  const d = description || "Machine learning forex signals for EUR/USD, GBP/USD and more. AI confidence scores, live entry/SL/TP levels, and real-time Telegram alerts.";
  const url = `https://alphaforexai.com${path}`;
  return (
    <Head>
      <title>{t}</title>
      <meta name="description" content={d} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content={t} />
      <meta property="og:description" content={d} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AlphaForexAI" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t} />
      <meta name="twitter:description" content={d} />
      <link rel="canonical" href={url} />
    </Head>
  );
}

// ── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext<any>(null);

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.email) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("tier");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Design tokens ─────────────────────────────────────────────────────────────
export const T = {
  black:   "#0a0a0a",
  dark:    "#111111",
  card:    "#161616",
  border:  "#222222",
  border2: "#2a2a2a",
  gold:    "#c9a84c",
  gold2:   "#e8c97e",
  goldBg:  "rgba(201,168,76,0.08)",
  white:   "#f5f4f0",
  muted:   "#888880",
  muted2:  "#555550",
  green:   "#22c55e",
  red:     "#ef4444",
  blue:    "#3b82f6",
};

// ── Nav ───────────────────────────────────────────────────────────────────────
export function Nav({ transparent = false }: { transparent?: boolean }) {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 769);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showMobile = !mounted || isMobile;

  const links = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 1000 }}>
      {/* Main nav bar */}
      <div style={{
        background: T.dark, borderBottom: `1px solid ${T.border}`,
        padding: "0 20px", display: "flex", alignItems: "center", height: 56,
      }}>
        {/* Logo */}
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginRight: 28, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: T.black }}>A</div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
        </a>

        {/* Desktop links */}
        {!showMobile && (
          <div style={{ display: "flex", gap: 24, flex: 1 }}>
            {links.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{l.label}</a>
            ))}
          </div>
        )}

        {/* Desktop auth */}
        {!showMobile && !loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user ? (
              <>
                <a href="/dashboard" style={{ fontSize: 13, color: T.muted, textDecoration: "none", padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border2}` }}>Dashboard</a>
                <a href="/profile" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{user.full_name?.split(" ")[0] || user.email?.split("@")[0]}</a>
              </>
            ) : (
              <>
                <a href="/login" style={{ fontSize: 13, color: T.muted, textDecoration: "none", padding: "6px 12px" }}>Sign in</a>
                <a href="/register" style={{ fontSize: 13, color: T.black, textDecoration: "none", padding: "8px 16px", borderRadius: 6, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, fontWeight: 600 }}>Get Started</a>
              </>
            )}
          </div>
        )}

        {/* Mobile: spacer + burger */}
        {showMobile && <div style={{ flex: 1 }} />}
        {showMobile && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", display: "flex", flexDirection: "column", gap: 5, flexShrink: 0 }}
          >
            <span style={{ width: 24, height: 2, background: T.white, display: "block", transition: "transform 0.25s, opacity 0.25s", transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ width: 24, height: 2, background: T.white, display: "block", transition: "opacity 0.25s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ width: 24, height: 2, background: T.white, display: "block", transition: "transform 0.25s", transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        )}
      </div>

      {/* Mobile flyout menu */}
      {showMobile && menuOpen && (
        <div style={{
          position: "fixed", top: 56, left: 0, right: 0, bottom: 0,
          background: T.dark, zIndex: 999,
          display: "flex", flexDirection: "column",
          borderTop: `1px solid ${T.border}`,
          overflowY: "auto",
        }}>
          <div style={{ padding: "8px 0" }}>
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
                style={{ display: "block", padding: "16px 24px", fontSize: 17, color: T.muted, textDecoration: "none", borderBottom: `1px solid ${T.border}` }}>
                {l.label}
              </a>
            ))}
            <div style={{ height: 8 }} />
            {!loading && (user ? (
              <>
                <a href="/dashboard" onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "16px 24px", fontSize: 17, color: T.gold, textDecoration: "none", fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>
                  Dashboard
                </a>
                <a href="/profile" onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "16px 24px", fontSize: 17, color: T.muted, textDecoration: "none", borderBottom: `1px solid ${T.border}` }}>
                  My Profile
                </a>
                <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "16px 24px", fontSize: 17, color: "#f87171", background: "none", border: "none", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <a href="/login" onClick={() => setMenuOpen(false)}
                  style={{ display: "block", padding: "16px 24px", fontSize: 17, color: T.muted, textDecoration: "none", borderBottom: `1px solid ${T.border}` }}>
                  Sign in
                </a>
                <div style={{ padding: "16px 24px" }}>
                  <a href="/register" onClick={() => setMenuOpen(false)}
                    style={{ display: "block", padding: "14px", background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, textDecoration: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center" }}>
                    Get Started Free
                  </a>
                </div>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export function RiskDisclaimer() {
  return (
    <div style={{ background: "#080808", borderTop: "1px solid #1a1a1a", padding: "16px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", fontSize: 11, color: "#444", lineHeight: 1.7, textAlign: "center" as const }}>
        <strong style={{ color: "#555" }}>Risk Warning:</strong> Trading forex involves significant risk of loss. 
        AlphaForexAI signals are for informational purposes only and do not constitute financial advice. 
        We are not FCA regulated. Past performance is not indicative of future results. 
        73-89% of retail investor accounts lose money trading CFDs. Trade responsibly.
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, background: T.dark, padding: "40px 20px 28px" }}>
      <style>{`
        .ft-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 36px; }
        .ft-brand { display: block; }
        @media (max-width: 700px) {
          .ft-grid  { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .ft-brand { display: none !important; }
        }
        @media (max-width: 360px) {
          .ft-grid  { grid-template-columns: 1fr !important; }
        }
        .ft-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 600px) { .ft-bottom { flex-direction: column; align-items: flex-start; } }
      `}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="ft-grid">
          <div className="ft-brand">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.black }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: "0 0 12px" }}>AI-powered forex signals for serious traders. EUR/USD analysis updated hourly.</p>
            <a href="mailto:hello@alphaforexai.com" style={{ fontSize: 13, color: T.gold, textDecoration: "none" }}>hello@alphaforexai.com</a>
          </div>

          {[
            { title: "Platform", links: [{ href: "/dashboard", label: "Dashboard" }, { href: "/pricing", label: "Pricing" }, { href: "/register", label: "Sign Up Free" }] },
            { title: "Company",  links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }] },
            { title: "Legal",    links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.muted2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <a key={l.href} href={l.href} style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ft-bottom" style={{ borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 12, color: T.muted2 }}>© {new Date().getFullYear()} AlphaForexAI. All rights reserved.</div>
            <div style={{ fontSize: 11, color: T.muted2 }}>
              Developed by{" "}
              <a href="https://linkedin.com/in/sparobanks" target="_blank" rel="noopener noreferrer" style={{ color: T.gold, textDecoration: "none" }}>
                Jasper Chinedu Nwangere
              </a>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.muted2, maxWidth: 400, lineHeight: 1.5, textAlign: "right" as const }}>Trading forex involves significant risk. Not financial advice.</div>
        </div>
      </div>
    </footer>
  );
}


// ── Shared button ─────────────────────────────────────────────────────────────
export function GoldButton({ children, onClick, href, style = {}, disabled = false, type = "button" }: any) {
  const base: any = {
    background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`,
    color: T.black, border: "none", borderRadius: 8,
    padding: "12px 28px", fontSize: 14, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    textDecoration: "none", display: "inline-block",
    transition: "opacity 0.2s",
    ...style,
  };
  if (href) return <a href={href} style={base}>{children}</a>;
  return <button type={type} onClick={onClick} disabled={disabled} style={base}>{children}</button>;
}

export function GhostButton({ children, onClick, href, style = {} }: any) {
  const base: any = {
    background: "transparent", color: T.white,
    border: `1px solid ${T.border2}`, borderRadius: 8,
    padding: "12px 28px", fontSize: 14, fontWeight: 500,
    cursor: "pointer", textDecoration: "none", display: "inline-block",
    transition: "border-color 0.2s",
    ...style,
  };
  if (href) return <a href={href} style={base}>{children}</a>;
  return <button onClick={onClick} style={base}>{children}</button>;
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, gold = false }: any) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${gold ? T.gold + "40" : T.border}`,
      borderRadius: 12, padding: "24px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({ label, type = "text", value, onChange, placeholder, required = false, style = {} }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        style={{
          background: "#0f0f0f", border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "11px 14px",
          fontSize: 14, color: T.white, outline: "none",
          transition: "border-color 0.2s",
          ...style,
        }}
        onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
        onBlur={e  => (e.currentTarget.style.borderColor = T.border)}
      />
    </div>
  );
}
