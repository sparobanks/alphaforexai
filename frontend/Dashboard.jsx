import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

// ── Mock data (replace with fetch("/api/v1/signals/...") calls) ──────────────
const MOCK_SIGNALS = [
  { id: 1, pair: "EUR/USD", direction: "BUY",  status: "TP_HIT",  entry_price: 1.08512, sl_price: 1.08312, tp_price: 1.08712, confidence: 0.74, pnl_pips: 20,  created_at: "2024-01-15T09:15:00Z", reason: "BUY signal in London session. Price in uptrend. RSI 42. Confidence 74%. R:R 2.0:1." },
  { id: 2, pair: "EUR/USD", direction: "SELL", status: "SL_HIT",  entry_price: 1.08820, sl_price: 1.09020, tp_price: 1.08620, confidence: 0.67, pnl_pips: -10, created_at: "2024-01-15T14:30:00Z", reason: "SELL signal in NY session. Price in downtrend. RSI 61. Confidence 67%. R:R 2.0:1." },
  { id: 3, pair: "EUR/USD", direction: "BUY",  status: "TP_HIT",  entry_price: 1.08340, sl_price: 1.08140, tp_price: 1.08540, confidence: 0.81, pnl_pips: 20,  created_at: "2024-01-16T08:45:00Z", reason: "BUY signal in London session. Price in uptrend. RSI 38. Confidence 81%. R:R 2.0:1." },
  { id: 4, pair: "EUR/USD", direction: "BUY",  status: "TP_HIT",  entry_price: 1.08150, sl_price: 1.07950, tp_price: 1.08350, confidence: 0.72, pnl_pips: 20,  created_at: "2024-01-17T10:00:00Z", reason: "BUY signal in overlap session. Price in uptrend. RSI 44. Confidence 72%. R:R 2.0:1." },
  { id: 5, pair: "EUR/USD", direction: "SELL", status: "TP_HIT",  entry_price: 1.08780, sl_price: 1.08980, tp_price: 1.08580, confidence: 0.78, pnl_pips: 20,  created_at: "2024-01-18T13:15:00Z", reason: "SELL signal in NY session. Price in downtrend. RSI 66. Confidence 78%. R:R 2.0:1." },
  { id: 6, pair: "EUR/USD", direction: "BUY",  status: "EXPIRED", entry_price: 1.08490, sl_price: 1.08290, tp_price: 1.08690, confidence: 0.62, pnl_pips: 0,   created_at: "2024-01-19T09:30:00Z", reason: "BUY signal in London session. Expired before reaching target." },
  { id: 7, pair: "EUR/USD", direction: "BUY",  status: "OPEN",    entry_price: 1.08620, sl_price: 1.08420, tp_price: 1.08820, confidence: 0.76, pnl_pips: null, created_at: "2024-01-20T08:00:00Z", reason: "BUY signal in London session. Price in uptrend. RSI 41. Confidence 76%. R:R 2.0:1." },
];

const MOCK_PERF = [
  { date: "Jan 10", pnl: 20, cum: 20 }, { date: "Jan 11", pnl: -10, cum: 10 },
  { date: "Jan 12", pnl: 20, cum: 30 }, { date: "Jan 13", pnl: 20, cum: 50 },
  { date: "Jan 14", pnl: 0,  cum: 50 }, { date: "Jan 15", pnl: 10, cum: 60 },
  { date: "Jan 16", pnl: 20, cum: 80 }, { date: "Jan 17", pnl: -10, cum: 70 },
  { date: "Jan 18", pnl: 20, cum: 90 }, { date: "Jan 19", pnl: 20, cum: 110 },
  { date: "Jan 20", pnl: 0,  cum: 110 },
];

// ── Utils ────────────────────────────────────────────────────────────────────

const fmt = {
  pct:    (v) => `${(v * 100).toFixed(0)}%`,
  price:  (v) => v?.toFixed(5) ?? "—",
  pips:   (v) => v === null || v === undefined ? "open" : `${v > 0 ? "+" : ""}${v}`,
  date:   (v) => new Date(v).toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
  conf:   (v) => `${(v * 100).toFixed(0)}%`,
};

const STATUS_STYLE = {
  TP_HIT:  { bg: "#dcfce7", color: "#15803d", label: "TP Hit" },
  SL_HIT:  { bg: "#fee2e2", color: "#b91c1c", label: "SL Hit" },
  OPEN:    { bg: "#dbeafe", color: "#1d4ed8", label: "Open" },
  EXPIRED: { bg: "#f3f4f6", color: "#6b7280", label: "Expired" },
};

const DIR_COLOR = { BUY: "#16a34a", SELL: "#dc2626" };

// ── Components ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      padding: "20px 24px",
      borderTop: accent ? `3px solid ${accent}` : "1px solid #e5e7eb",
    }}>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#111827", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function SignalBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.EXPIRED;
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 600, padding: "2px 8px",
      borderRadius: 99, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "#16a34a" : pct >= 65 ? "#ca8a04" : "#dc2626";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, background: "#f3f4f6", borderRadius: 99, height: 6, minWidth: 60 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function SignalCard({ signal, expanded, onToggle }) {
  const dirColor = DIR_COLOR[signal.direction];
  return (
    <div
      onClick={onToggle}
      style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "16px 20px", cursor: "pointer",
        borderLeft: `4px solid ${dirColor}`,
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontWeight: 700, color: dirColor, fontSize: 15, minWidth: 36 }}>{signal.direction}</span>
        <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{signal.pair}</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>{signal.timeframe || "H1"}</span>
        <SignalBadge status={signal.status} />
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{fmt.date(signal.created_at)}</span>
        <span style={{
          fontWeight: 700, fontSize: 14,
          color: signal.pnl_pips > 0 ? "#16a34a" : signal.pnl_pips < 0 ? "#dc2626" : "#6b7280"
        }}>
          {fmt.pips(signal.pnl_pips)} pips
        </span>
      </div>
      <div style={{ marginTop: 10 }}>
        <ConfidenceBar value={signal.confidence} />
      </div>
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
            {[
              ["Entry", fmt.price(signal.entry_price)],
              ["Stop Loss", fmt.price(signal.sl_price)],
              ["Take Profit", fmt.price(signal.tp_price)],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", fontFamily: "monospace" }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
            {signal.reason}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [signals] = useState(MOCK_SIGNALS);
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState("signals");

  const closed   = signals.filter(s => s.status !== "OPEN");
  const open     = signals.filter(s => s.status === "OPEN");
  const tp_count = closed.filter(s => s.status === "TP_HIT").length;
  const win_rate = closed.length ? tp_count / closed.length : 0;
  const total_pnl = closed.reduce((a, s) => a + (s.pnl_pips || 0), 0);

  const tabs = [
    { id: "signals",  label: "Signals" },
    { id: "equity",   label: "Equity Curve" },
    { id: "history",  label: "Trade History" },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", padding: "0" }}>

      {/* Header */}
      <div style={{ background: "#111827", color: "#fff", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>ForexAI Signals</span>
        <span style={{ fontSize: 12, color: "#9ca3af", background: "#1f2937", padding: "2px 10px", borderRadius: 99 }}>EUR/USD · H1</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>
          {new Date().toLocaleString("en-GB", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} UTC
        </span>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          <StatCard label="Win Rate (30d)" value={`${(win_rate*100).toFixed(0)}%`} sub={`${tp_count}/${closed.length} signals`} accent="#22c55e" />
          <StatCard label="Total P&L" value={`${total_pnl > 0 ? "+" : ""}${total_pnl} pips`} sub="last 30 days" accent={total_pnl >= 0 ? "#22c55e" : "#ef4444"} />
          <StatCard label="Open Signals" value={open.length} sub="active now" accent="#3b82f6" />
          <StatCard label="R:R Ratio" value="2.0 : 1" sub="TP 20 / SL 10 pips" accent="#f59e0b" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: "10px 18px", fontWeight: 600, fontSize: 14,
              background: "none", border: "none", cursor: "pointer",
              color: activeTab === t.id ? "#111827" : "#9ca3af",
              borderBottom: activeTab === t.id ? "2px solid #111827" : "2px solid transparent",
              transition: "color 0.15s",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Signals tab */}
        {activeTab === "signals" && (
          <div>
            {open.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🟢 Active Signals
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {open.map(s => (
                    <SignalCard key={s.id} signal={s} expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />
                  ))}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Recent Signals
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {closed.slice(0, 8).map(s => (
                  <SignalCard key={s.id} signal={s} expanded={expandedId === s.id}
                    onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Equity curve tab */}
        {activeTab === "equity" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "24px" }}>
            <div style={{ fontWeight: 600, marginBottom: 20, color: "#111827" }}>Cumulative P&L (pips)</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={MOCK_PERF}>
                <defs>
                  <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                  formatter={(v) => [`${v} pips`, "Cumulative P&L"]}
                />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Area type="monotone" dataKey="cum" stroke="#22c55e" strokeWidth={2} fill="url(#pnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: 32 }}>
              <div style={{ fontWeight: 600, marginBottom: 16, color: "#111827" }}>Daily P&L</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={MOCK_PERF} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                    formatter={(v) => [`${v > 0 ? "+" : ""}${v} pips`, "P&L"]}
                  />
                  <ReferenceLine y={0} stroke="#e5e7eb" />
                  <Bar dataKey="pnl" fill="#22c55e" radius={[4, 4, 0, 0]}
                    label={false}
                    isAnimationActive={true}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  {["Date", "Pair", "Direction", "Entry", "SL", "TP", "Confidence", "P&L", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#374151", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signals.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "12px 16px", color: "#6b7280" }}>{fmt.date(s.created_at)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: 600 }}>{s.pair}</td>
                    <td style={{ padding: "12px 16px", color: DIR_COLOR[s.direction], fontWeight: 700 }}>{s.direction}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace" }}>{fmt.price(s.entry_price)}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#dc2626" }}>{fmt.price(s.sl_price)}</td>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#16a34a" }}>{fmt.price(s.tp_price)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <ConfidenceBar value={s.confidence} />
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700,
                      color: s.pnl_pips > 0 ? "#16a34a" : s.pnl_pips < 0 ? "#dc2626" : "#6b7280"
                    }}>
                      {fmt.pips(s.pnl_pips)}
                    </td>
                    <td style={{ padding: "12px 16px" }}><SignalBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
