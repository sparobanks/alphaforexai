/**
 * api.ts — typed client for all ForexAI backend endpoints.
 * Uses SWR for caching/revalidation in components.
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type SignalStatus = "OPEN" | "TP_HIT" | "SL_HIT" | "EXPIRED" | "CANCELLED";
export type Direction    = "BUY" | "SELL";

export interface Signal {
  id: number;
  pair: string;
  timeframe: string;
  direction: Direction;
  status: SignalStatus;
  entry_price: number;
  sl_price: number;
  tp_price: number;
  rr_ratio: number | null;
  confidence: number;
  reason: string | null;
  created_at: string;
  expires_at: string | null;
  closed_at: string | null;
  pnl_pips: number | null;
}

export interface Performance {
  date: string;
  pair: string;
  signals_issued: number;
  tp_count: number;
  sl_count: number;
  pnl_pips: number;
  win_rate: number | null;
}

export interface StatsSummary {
  total: number;
  win_rate: number;
  pnl_pips: number;
  open_count: number;
  period_days: number;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  tier: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string) =>
    apiFetch<TokenOut>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<TokenOut>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => apiFetch<{ id: number; email: string; tier: string; tier_expires: string | null }>("/auth/me"),
};

// ── Signals ───────────────────────────────────────────────────────────────────

export const signals = {
  latest:  (pair?: string) =>
    apiFetch<Signal[]>(`/signals/latest${pair ? `?pair=${pair}` : ""}`),

  history: (days = 30, pair?: string) =>
    apiFetch<Signal[]>(`/signals/history?days=${days}${pair ? `&pair=${pair}` : ""}`),

  summary: (days = 30, pair?: string) =>
    apiFetch<StatsSummary>(`/signals/stats/summary?days=${days}${pair ? `&pair=${pair}` : ""}`),

  performance: (days = 90, pair?: string) =>
    apiFetch<Performance[]>(`/signals/performance?days=${days}${pair ? `&pair=${pair}` : ""}`),

  get: (id: number) =>
    apiFetch<Signal>(`/signals/${id}`),
};

// ── SWR fetcher ───────────────────────────────────────────────────────────────

export const fetcher = (url: string) => apiFetch(url);
