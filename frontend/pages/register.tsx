"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { T, GoldButton, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
const COUNTRIES = ["Nigeria","United Kingdom","United States","Ghana","Kenya","South Africa","Canada","Australia","Germany","France","UAE","India","Pakistan","Bangladesh","Other"];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [form, setForm] = useState({ email:"", password:"", confirm:"", full_name:"", phone:"", country:"", city:"", date_of_birth:"" });
  function set(k: string) { return (e: any) => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email)     { setError("Email is required"); return; }
    if (!form.full_name) { setError("Full name is required"); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8)       { setError("Password must be at least 8 characters"); return; }
    if (!agreedToTerms) { setError("Please agree to the Terms of Service and Privacy Policy."); return; }
    setError(""); setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/register`, { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email:form.email, password:form.password, full_name:form.full_name, phone:form.phone, country:form.country, city:form.city, date_of_birth:form.date_of_birth||undefined }) });
      const data = await res.json();
      if (!res.ok) { setError(data.detail ?? "Registration failed"); return; }
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("tier",  data.tier);
      router.push("/dashboard");
    } catch { setError("Connection failed. Try again."); }
    finally { setLoading(false); }
  }

  const inp = { background:"#0f0f0f", border:`1px solid ${T.border}`, borderRadius:8, padding:"11px 14px", fontSize:14, color:T.white, outline:"none", width:"100%", boxSizing:"border-box" as const };
  const lbl = { fontSize:11, fontWeight:500 as const, color:T.muted, textTransform:"uppercase" as const, letterSpacing:"0.05em", display:"block", marginBottom:6 };

  return (
    <AuthProvider>
      <div style={{ minHeight:"100vh", background:T.black, fontFamily:"system-ui, sans-serif", padding:"32px 24px", backgroundImage:`radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)` }}>
        <div style={{ maxWidth:560, margin:"0 auto" }}>
          <div style={{ textAlign:"center" as const, marginBottom:28 }}>
            <a href="/" style={{ textDecoration:"none", display:"inline-flex", alignItems:"center", gap:10 }}>
              <div style={{ width:34, height:34, borderRadius:8, background:`linear-gradient(135deg, ${T.gold} 0%, ${T.gold2} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:T.black }}>A</div>
              <span style={{ fontFamily:"Georgia, serif", fontSize:19, fontWeight:700, color:T.white }}>Alpha<span style={{ color:T.gold }}>ForexAI</span></span>
            </a>
            <div style={{ fontSize:14, color:T.muted, marginTop:10 }}>Create your free account — no card required</div>
          </div>
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"32px 28px" }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
                <div style={{ fontSize:12, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Account Details</div>
                <div><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" style={inp} /></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><label style={lbl}>Password *</label><input type="password" value={form.password} onChange={set("password")} required placeholder="Min 8 characters" style={inp} /></div>
                  <div><label style={lbl}>Confirm Password *</label><input type="password" value={form.confirm} onChange={set("confirm")} required placeholder="Repeat password" style={inp} /></div>
                </div>
                <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:16, fontSize:12, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Profile Information</div>
                <div><label style={lbl}>Full Name *</label><input type="text" value={form.full_name} onChange={set("full_name")} required placeholder="John Doe" style={inp} /></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><label style={lbl}>Phone</label><input type="tel" value={form.phone} onChange={set("phone")} placeholder="+44 7000 000000" style={inp} /></div>
                  <div><label style={lbl}>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} style={{ ...inp, colorScheme:"dark" }} /></div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div><label style={lbl}>Country</label>
                    <select value={form.country} onChange={set("country")} style={inp}>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>City</label><input type="text" value={form.city} onChange={set("city")} placeholder="Lagos" style={inp} /></div>
                </div>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:4 }}>
                  <input type="checkbox" id="terms" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ marginTop:3, flexShrink:0, cursor:"pointer", accentColor:"#c9a84c" }} />
                  <label htmlFor="terms" style={{ fontSize:12, color:T.muted, lineHeight:1.6, cursor:"pointer" }}>
                    I agree to the <a href="/terms" target="_blank" style={{ color:T.gold, textDecoration:"none" }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color:T.gold, textDecoration:"none" }}>Privacy Policy</a>. AlphaForexAI signals are for informational purposes only and do not constitute financial advice.
                  </label>
                </div>
                {error && <div style={{ background:"#1a0a0a", border:"1px solid #3a1a1a", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171" }}>{error}</div>}
                <GoldButton type="submit" disabled={loading || !agreedToTerms} style={{ width:"100%", padding:"13px", fontSize:15, borderRadius:8, opacity:!agreedToTerms?0.5:1 }}>
                  {loading ? "Creating account..." : "Create Free Account"}
                </GoldButton>
                <div style={{ textAlign:"center" as const, fontSize:13, color:T.muted }}>
                  Already have an account? <a href="/login" style={{ color:T.gold, textDecoration:"none", fontWeight:600 }}>Sign in</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
