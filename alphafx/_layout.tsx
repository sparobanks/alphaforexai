"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";

const API = "https://alphaforexai.com/api/v1";

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
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const bg = transparent ? "transparent" : T.dark;

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: bg,
      borderBottom: transparent ? "none" : `1px solid ${T.border}`,
      padding: "0 32px",
      display: "flex", alignItems: "center", height: 64,
      backdropFilter: "blur(12px)",
    }}>
      {/* Logo */}
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, marginRight: 40 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: T.black,
        }}>A</div>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: T.white, letterSpacing: "-0.02em" }}>
          Alpha<span style={{ color: T.gold }}>ForexAI</span>
        </span>
      </a>

      {/* Links */}
      <div style={{ display: "flex", gap: 28, flex: 1 }}>
        {[
          { href: "/", label: "Home" },
          { href: "/pricing", label: "Pricing" },
          { href: "/about", label: "About" },
          { href: "/contact", label: "Contact" },
        ].map(l => (
          <a key={l.href} href={l.href} style={{
            fontSize: 14, color: T.muted, textDecoration: "none",
            transition: "color 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = T.white)}
            onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
          >{l.label}</a>
        ))}
      </div>

      {/* Auth actions */}
      {!loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <a href="/dashboard" style={{
                fontSize: 13, color: T.muted, textDecoration: "none",
                padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border2}`,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.color = T.white; e.currentTarget.style.borderColor = T.gold; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border2; }}
              >Dashboard</a>
              <a href="/profile" style={{
                fontSize: 13, color: T.muted, textDecoration: "none",
                padding: "6px 14px", borderRadius: 6,
              }}>
                {user.full_name?.split(" ")[0] || user.email?.split("@")[0]}
              </a>
            </>
          ) : (
            <>
              <a href="/login" style={{
                fontSize: 13, color: T.muted, textDecoration: "none",
                padding: "6px 14px",
              }}>Sign in</a>
              <a href="/register" style={{
                fontSize: 13, color: T.black, textDecoration: "none",
                padding: "8px 18px", borderRadius: 6,
                background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`,
                fontWeight: 600,
              }}>Get Started</a>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, background: T.dark, padding: "48px 32px 32px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: T.black,
              }}>A</div>
              <span style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: T.white }}>
                Alpha<span style={{ color: T.gold }}>ForexAI</span>
              </span>
            </div>
            <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: "0 0 16px" }}>
              AI-powered forex signals for serious traders. EUR/USD analysis updated hourly.
            </p>
            <a href="mailto:hello@alphaforexai.com" style={{ fontSize: 13, color: T.gold, textDecoration: "none" }}>
              hello@alphaforexai.com
            </a>
          </div>

          {/* Links */}
          {[
            { title: "Platform", links: [{ href: "/dashboard", label: "Dashboard" }, { href: "/pricing", label: "Pricing" }, { href: "/register", label: "Sign Up Free" }] },
            { title: "Company",  links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: "/blog", label: "Blog" }] },
            { title: "Legal",    links: [{ href: "/terms", label: "Terms" }, { href: "/privacy", label: "Privacy" }, { href: "/disclaimer", label: "Disclaimer" }] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.muted2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>{col.title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map(l => (
                  <a key={l.href} href={l.href} style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.white)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                  >{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: T.muted2 }}>
            © {new Date().getFullYear()} AlphaForexAI. All rights reserved.
          </div>
          <div style={{ fontSize: 11, color: T.muted2, maxWidth: 500, textAlign: "right", lineHeight: 1.5 }}>
            Trading forex involves significant risk. Past performance does not guarantee future results. Not financial advice.
          </div>
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
