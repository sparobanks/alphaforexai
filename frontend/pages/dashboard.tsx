"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { T, AuthProvider, SeoHead } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const TIER_COLOR: Record<string, string> = { free: T.muted, pro: T.gold, vip: "#a78bfa" };
const STATUS_COLOR: Record<string, string> = { TP_HIT: T.green, SL_HIT: T.red, OPEN: T.blue, EXPIRED: T.muted };
const STATUS_LABEL: Record<string, string> = { TP_HIT: "TP Hit", SL_HIT: "SL Hit", OPEN: "Open", EXPIRED: "Expired" };

function StatCard({ label, value, sub, accent }: any) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", borderTop: `2px solid ${accent || T.border}` }}>
      <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.white }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted2, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TierInfoBanner({ tier }: { tier: string }) {
  if (tier !== "free") return null;
  return (
    <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8 }}>
      <span style={{ fontSize: 13, color: T.muted }}>
        <span style={{ fontWeight: 600, color: T.gold }}>Free plan</span> — Signals delayed 1hr · Direction only · 7-day history
      </span>
      <a href="/pricing" style={{ background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, color: T.black, padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" as const }}>
        Upgrade →
      </a>
    </div>
  );
}

function SignalRow({ signal, expanded, onToggle }: any) {
  const isDelayed = signal.is_delayed;
  const dirColor = isDelayed ? T.muted : signal.direction === "BUY" ? T.green : T.red;
  return (
    <div onClick={onToggle} style={{ background: T.card, border: `1px solid ${expanded ? T.gold + "40" : T.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", borderLeft: `3px solid ${isDelayed ? T.muted2 : dirColor}`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
        <span style={{ fontWeight: 700, color: dirColor, fontSize: 13, minWidth: 28 }}>{isDelayed ? "??" : signal.direction}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color: T.white }}>{signal.pair}</span>
        <span style={{ fontSize: 11, color: T.muted }}>{signal.timeframe || "H1"}</span>
        {isDelayed
          ? <span style={{ background: "#2a1500", color: "#f59e0b", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>Delayed · Upgrade</span>
          : <span style={{ background: STATUS_COLOR[signal.status] + "20", color: STATUS_COLOR[signal.status], fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>{STATUS_LABEL[signal.status]}</span>
        }
        <span style={{ marginLeft: "auto", fontSize: 11, color: T.muted }}>{new Date(signal.created_at).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        {signal.pnl_pips !== null && signal.pnl_pips !== undefined && (
          <span style={{ fontWeight: 700, fontSize: 12, color: signal.pnl_pips > 0 ? T.green : signal.pnl_pips < 0 ? T.red : T.muted }}>
            {signal.pnl_pips > 0 ? "+" : ""}{signal.pnl_pips}p
          </span>
        )}
        {signal.confidence && <span style={{ fontSize: 11, color: T.muted }}>{Math.round(signal.confidence * 100)}%</span>}
      </div>
      {expanded && !isDelayed && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 10 }}>
            {[["Entry", signal.entry_price?.toFixed(5) ?? "—"], ["Stop Loss", signal.sl_price?.toFixed(5) ?? "Upgrade"], ["Take Profit", signal.tp_price?.toFixed(5) ?? "Upgrade"]].map(([lbl, val]) => (
              <div key={lbl} style={{ textAlign: "center" as const, background: "#0f0f0f", borderRadius: 8, padding: "10px 8px" }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{lbl}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: val === "Upgrade" ? T.gold : T.white, fontFamily: "monospace" }}>{val}</div>
              </div>
            ))}
          </div>
          {signal.reason && <div style={{ fontSize: 12, color: T.muted, background: "#0f0f0f", borderRadius: 8, padding: "9px 12px", lineHeight: 1.6 }}>{signal.reason}</div>}
          {signal.requires_upgrade && <div style={{ marginTop: 8, textAlign: "center" as const }}><a href="/pricing" style={{ fontSize: 12, color: T.gold, textDecoration: "none", fontWeight: 600 }}>Upgrade to Pro for full details →</a></div>}
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState("signals");
  const [signals, setSignals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [perf, setPerf] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    Promise.all([
      fetch(`${API}/auth/me`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/signals/latest`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/signals/history?days=30`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/signals/stats/summary`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/signals/performance?days=90`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([me, latest, history, summary, performance]) => {
      if (me.detail) { router.push("/login"); return; }
      setUser(me);
      const all = [...(Array.isArray(latest) ? latest : []), ...(Array.isArray(history) ? history : [])];
      setSignals(all.filter((s, i, arr) => arr.findIndex(x => x.id === s.id) === i));
      setStats(summary);
      if (Array.isArray(performance)) {
        let cum = 0;
        setPerf(performance.map((p: any) => { cum += p.pnl_pips || 0; return { date: new Date(p.date).toLocaleDateString("en-GB", { month: "short", day: "numeric" }), pnl: p.pnl_pips || 0, cum: Math.round(cum) }; }));
      }
    }).catch(() => router.push("/login")).finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.muted, fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const openSignals = signals.filter(s => s.status === "OPEN");
  const closedSignals = signals.filter(s => s.status !== "OPEN");
  const tierColor = TIER_COLOR[user.tier] || T.muted;

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <SeoHead title="Dashboard" path="/dashboard" />
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", height: 54, gap: 12 }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: `linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: T.black }}>A</div>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700, color: T.white }}>Alpha<span style={{ color: T.gold }}>ForexAI</span></span>
        </a>
        <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" as const }}>
          {["signals", "equity", "history"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 12px", fontWeight: tab === t ? 600 : 400, fontSize: 12, background: "none", border: "none", cursor: "pointer", textTransform: "capitalize" as const, color: tab === t ? T.white : T.muted, borderBottom: tab === t ? `2px solid ${T.gold}` : "2px solid transparent", whiteSpace: "nowrap" as const }}>{t}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ background: tierColor + "20", color: tierColor, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" as const }}>{user.tier}</span>
          <a href="/profile" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>
            {(user.full_name?.split(" ")[0] || user.email?.split("@")[0] || "").substring(0, 10)}
          </a>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/"); }} style={{ fontSize: 11, color: T.muted2, background: "none", border: "none", cursor: "pointer" }}>Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
          <StatCard label="Win Rate 30d" value={stats?.win_rate ? `${(stats.win_rate * 100).toFixed(0)}%` : "—"} sub={`${stats?.total || 0} signals`} accent={T.green} />
          <StatCard label="P&L 30d" value={`${(stats?.pnl_pips || 0) > 0 ? "+" : ""}${stats?.pnl_pips || 0}p`} accent={(stats?.pnl_pips || 0) >= 0 ? T.green : T.red} />
          <StatCard label="Open" value={openSignals.length} sub="active now" accent={T.blue} />
          <StatCard label="R:R" value="1.5:1" sub="TP15 / SL10" accent={T.gold} />
        </div>

        <TierInfoBanner tier={user.tier} />

        {tab === "signals" && (
          <div>
            <div style={{ background: "#0d1117", border: "1px solid #0088cc30", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontSize: 13, color: T.muted }}>
                <span style={{ color: "#0088cc" }}>✈ Telegram</span> — Get instant signal alerts on your phone
              </span>
              <a href="https://t.me/alphaforexai" target="_blank" rel="noopener noreferrer" style={{ background: "#0088cc", color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" as const }}>
                Join @alphaforexai
              </a>
            </div>
            {openSignals.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.green }} />Active signals
                </div>
                {openSignals.map(s => <SignalRow key={s.id} signal={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)}
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 10 }}>Recent signals</div>
              {closedSignals.length === 0
                ? <div style={{ textAlign: "center" as const, padding: "48px 16px", color: T.muted, fontSize: 14 }}>No signals yet — model checks every hour during London/NY sessions.</div>
                : closedSignals.slice(0, 12).map(s => <SignalRow key={s.id} signal={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)
              }
            </div>
          </div>
        )}

        {tab === "equity" && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 16px" }}>
            <div style={{ fontWeight: 600, color: T.white, marginBottom: 16, fontSize: 13 }}>Cumulative P&L (pips)</div>
            {perf.length === 0
              ? <div style={{ textAlign: "center" as const, padding: "48px", color: T.muted, fontSize: 14 }}>Performance data will appear after the first signals close.</div>
              : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={perf}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.gold} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={T.gold} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.muted }} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                    <Tooltip contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v} pips`, "P&L"]} />
                    <ReferenceLine y={0} stroke={T.border} />
                    <Area type="monotone" dataKey="cum" stroke={T.gold} strokeWidth={2} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </div>
        )}

        {tab === "history" && (
          <div style={{ overflowX: "auto" as const, borderRadius: 12 }}>
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", minWidth: 680 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#111" }}>
                    {["Date", "Pair", "Dir", "Entry", "SL", "TP", "Conf", "P&L", "Status"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left" as const, fontWeight: 500, color: T.muted, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.length === 0
                    ? <tr><td colSpan={9} style={{ padding: "28px", textAlign: "center" as const, color: T.muted }}>No signals yet</td></tr>
                    : signals.slice(0, 30).map((s, i) => (
                      <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "9px 12px", color: T.muted, fontSize: 11 }}>{new Date(s.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 600 }}>{s.pair}</td>
                        <td style={{ padding: "9px 12px", color: s.is_delayed ? T.muted : s.direction === "BUY" ? T.green : T.red, fontWeight: 700 }}>{s.is_delayed ? "??" : s.direction}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11 }}>{s.entry_price?.toFixed(5) ?? "—"}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: s.sl_price ? T.red : T.gold }}>{s.sl_price?.toFixed(5) ?? "Pro"}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: s.tp_price ? T.green : T.gold }}>{s.tp_price?.toFixed(5) ?? "Pro"}</td>
                        <td style={{ padding: "9px 12px", color: T.muted }}>{s.confidence ? `${Math.round(s.confidence * 100)}%` : "—"}</td>
                        <td style={{ padding: "9px 12px", fontWeight: 600, color: (s.pnl_pips ?? 0) > 0 ? T.green : (s.pnl_pips ?? 0) < 0 ? T.red : T.muted }}>
                          {s.pnl_pips !== null && s.pnl_pips !== undefined ? `${s.pnl_pips > 0 ? "+" : ""}${s.pnl_pips}` : "open"}
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <span style={{ background: STATUS_COLOR[s.status] + "20", color: STATUS_COLOR[s.status], fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 99 }}>
                            {STATUS_LABEL[s.status]}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return <AuthProvider><DashboardContent /></AuthProvider>;
}
