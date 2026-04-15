"use client";
import { useState, useEffect, useRef } from "react";
import { T, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
const ADMIN_PASSWORD = "forexai-admin-2026";

function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const CATEGORIES = ["Market Analysis","Trading Education","AI & Technology","Signal Review","Forex Basics","Strategy","News & Events"];
const EMPTY: any = { title:"", slug:"", excerpt:"", content:"", cover_image:"", author:"AlphaForexAI Team", category:"", tags:"", status:"draft", featured:false, seo_title:"", seo_description:"", published_at:"" };

function slugify(t: string) { return t.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,""); }

function VisualToolbar({ onInsert }: { onInsert: (b:string,a:string)=>void }) {
  return (
    <div style={{ display:"flex", gap:4, flexWrap:"wrap" as const, padding:"8px 10px", background:"#111", borderRadius:"8px 8px 0 0", borderBottom:`1px solid ${T.border}` }}>
      {[
        { label:"B", b:"**", a:"**", style:{fontWeight:800 as const} },
        { label:"I", b:"*", a:"*", style:{fontStyle:"italic" as const} },
        { label:"H2", b:"\n## ", a:"\n", style:{fontSize:11} },
        { label:"H3", b:"\n### ", a:"\n", style:{fontSize:11} },
        { label:"›", b:"\n> ", a:"\n", style:{} },
        { label:"—", b:"\n- ", a:"\n", style:{} },
        { label:"</>", b:"`", a:"`", style:{fontFamily:"monospace",fontSize:11} },
        { label:"Link", b:"[", a:"](url)", style:{fontSize:11} },
        { label:"Img", b:"![alt](", a:")", style:{fontSize:11} },
      ].map(t => (
        <button key={t.label} type="button" onClick={() => onInsert(t.b, t.a)}
          style={{ padding:"4px 9px", background:T.card, border:`1px solid ${T.border}`, borderRadius:5, fontSize:12, color:T.muted, cursor:"pointer", ...t.style }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function BlogAdminContent() {
  const [authed, setAuthed]   = useState(false);
  const [key, setKey]         = useState("");
  const [tab, setTab]         = useState<"posts"|"ads"|"settings"|"analytics">("posts");
  const [posts, setPosts]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState<any>({...EMPTY});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");
  const [editorMode, setEditorMode] = useState<"markdown"|"preview">("markdown");
  const [filter, setFilter]   = useState("all");
  const [imageMode, setImageMode] = useState<"url"|"upload"|"library">("url");
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  const fileRef               = useRef<HTMLInputElement>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);

  async function loadLibrary() {
    try {
      const res = await fetch(`${API}/blog/media`, { headers: authHeaders() });
      const data = await res.json();
      setMediaLibrary(Array.isArray(data) ? data : []);
    } catch {}
  }

  // Ads state - separate slots for each position
  const [ads, setAds] = useState({
    top_banner: "", before_post: "", after_post: "", in_feed: "",
    sidebar_1: "", sidebar_2: "",
    // 5 in-content slots with paragraph numbers
    incontent_1_para: "3",  incontent_1_code: "",
    incontent_2_para: "6",  incontent_2_code: "",
    incontent_3_para: "9",  incontent_3_code: "",
    incontent_4_para: "12", incontent_4_code: "",
    incontent_5_para: "15", incontent_5_code: "",
  });

  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [customRange, setCustomRange]     = useState(false);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");

  async function fetchAnalytics(days = 30) {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/blog/analytics?days=${days}`, { headers: authHeaders() });
      const data = await res.json();
      setAnalytics(data);
    } finally { setAnalyticsLoading(false); }
  }

  const [settings, setSettings] = useState({
    posts_per_page: "9", posts_per_category: "9", posts_per_tag: "9",
    show_author: "true", show_date: "true", show_views: "true",
    show_share: "true", show_related: "true",
  });

  async function verifyAdminPassword(password: string): Promise<boolean> {
    try {
      const res = await fetch(`${API}/auth/admin/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      return data.ok === true;
    } catch { return false; }
  }

  useEffect(() => { if (authed) { fetchPosts(); fetchAds(); fetchSettings(); fetchAnalytics(); } }, [authed, filter]);

  async function fetchPosts() {
    const params = filter !== "all" ? `?status=${filter}` : "";
    try {
      const res = await fetch(`${API}/blog/admin/posts${params}`, { headers: authHeaders() });
      const data = await res.json();
      setPosts(data.posts || []); setTotal(data.total || 0);
    } catch { setMsg("Error loading posts"); }
  }

  async function fetchAds() {
    try {
      const res = await fetch(`${API}/auth/admin/settings`, { headers: authHeaders() });
      const data = await res.json();
      setAds(prev => ({
        ...prev,
        top_banner:  data.blog_ad_top_banner  || "",
        before_post: data.blog_ad_before_post || "",
        after_post:  data.blog_ad_after_post  || "",
        in_feed:     data.blog_ad_in_feed     || "",
        sidebar_1:   data.blog_ad_sidebar_1   || "",
        sidebar_2:   data.blog_ad_sidebar_2   || "",
        incontent_1_para: data.blog_incontent_1_para || "3",
        incontent_1_code: data.blog_incontent_1_code || "",
        incontent_2_para: data.blog_incontent_2_para || "6",
        incontent_2_code: data.blog_incontent_2_code || "",
        incontent_3_para: data.blog_incontent_3_para || "9",
        incontent_3_code: data.blog_incontent_3_code || "",
        incontent_4_para: data.blog_incontent_4_para || "12",
        incontent_4_code: data.blog_incontent_4_code || "",
        incontent_5_para: data.blog_incontent_5_para || "15",
        incontent_5_code: data.blog_incontent_5_code || "",
      }));
    } catch {}
  }

  async function fetchSettings() {
    try {
      const res = await fetch(`${API}/auth/admin/settings`, { headers: authHeaders() });
      const data = await res.json();
      setSettings(prev => ({
        ...prev,
        posts_per_page:     data.blog_posts_per_page     || "9",
        posts_per_category: data.blog_posts_per_category || "9",
        posts_per_tag:      data.blog_posts_per_tag      || "9",
        show_author:  data.blog_show_author  ?? "true",
        show_date:    data.blog_show_date    ?? "true",
        show_views:   data.blog_show_views   ?? "true",
        show_share:   data.blog_show_share   ?? "true",
        show_related: data.blog_show_related ?? "true",
      }));
    } catch {}
  }

  async function saveAds(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${API}/auth/admin/settings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          blog_ad_top_banner:  ads.top_banner,
          blog_ad_before_post: ads.before_post,
          blog_ad_after_post:  ads.after_post,
          blog_ad_in_feed:     ads.in_feed,
          blog_ad_sidebar_1:   ads.sidebar_1,
          blog_ad_sidebar_2:   ads.sidebar_2,
          blog_incontent_1_para: ads.incontent_1_para,
          blog_incontent_1_code: ads.incontent_1_code,
          blog_incontent_2_para: ads.incontent_2_para,
          blog_incontent_2_code: ads.incontent_2_code,
          blog_incontent_3_para: ads.incontent_3_para,
          blog_incontent_3_code: ads.incontent_3_code,
          blog_incontent_4_para: ads.incontent_4_para,
          blog_incontent_4_code: ads.incontent_4_code,
          blog_incontent_5_para: ads.incontent_5_para,
          blog_incontent_5_code: ads.incontent_5_code,
        }),
      });
      setMsg("✓ Ad codes saved");
    } finally { setLoading(false); }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await fetch(`${API}/auth/admin/settings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          blog_posts_per_page:     settings.posts_per_page,
          blog_posts_per_category: settings.posts_per_category,
          blog_posts_per_tag:      settings.posts_per_tag,
          blog_show_author:  settings.show_author,
          blog_show_date:    settings.show_date,
          blog_show_views:   settings.show_views,
          blog_show_share:   settings.show_share,
          blog_show_related: settings.show_related,
        }),
      });
      setMsg("✓ Settings saved");
    } finally { setLoading(false); }
  }

  function set(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value })); }
  function setCheck(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.checked })); }
  function setAd(k: string) { return (e: any) => setAds((a: any) => ({ ...a, [k]: e.target.value })); }
  function setSetting(k: string) { return (e: any) => setSettings((s: any) => ({ ...s, [k]: e.target.value })); }

  function insertMarkdown(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const text = form.content || "";
    const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);
    setForm((f: any) => ({ ...f, content: newText }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + (end - start)); }, 0);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { setMsg("Title is required"); return; }
    setLoading(true);
    const payload = { ...form, slug: form.slug || slugify(form.title), published_at: form.published_at || undefined };
    try {
      const url = editing ? `${API}/blog/admin/posts/${editing.id}` : `${API}/blog/admin/posts`;
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.id) { setMsg(`✓ Post ${editing ? "updated" : "created"}`); setEditing(null); setCreating(false); setForm({...EMPTY}); fetchPosts(); }
      else setMsg(`Error: ${data.detail || JSON.stringify(data)}`);
    } catch (err: any) { setMsg(`Error: ${err.message}`); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`${API}/blog/admin/posts/${id}`, { method:"DELETE", headers: authHeaders() });
    setMsg("✓ Deleted"); fetchPosts();
  }

  function startEdit(post: any) {
    const pubDate = post.published_at ? new Date(post.published_at).toISOString().slice(0,16) : "";
    setForm({ ...post, tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "", published_at: pubDate });
    setEditing(post); setCreating(false); setEditorMode("markdown");
  }

  function renderPreview(md: string) {
    return md
      .replace(/^## (.+)$/gm,'<h2 style="font-size:20px;font-family:Georgia,serif;color:#f5f4f0;margin:20px 0 8px">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="font-size:26px;font-family:Georgia,serif;color:#f5f4f0;margin:16px 0 10px">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;color:#c9a84c">$1</code>')
      .replace(/^> (.+)$/gm,'<blockquote style="border-left:3px solid #c9a84c;padding:10px 14px;margin:12px 0;background:#111;color:#888">$1</blockquote>')
      .replace(/^- (.+)$/gm,'<li style="margin:4px 0;color:#888">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g,'<ul style="padding-left:20px;margin:12px 0">$&</ul>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" style="color:#c9a84c">$1</a>')
      .replace(/^(?!<[hulbipqci])(.*\S.*)$/gm,'<p style="margin:0 0 12px;color:#888;line-height:1.7">$1</p>');
  }

  const inputStyle: any = { background:"#0f0f0f", border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px", fontSize:13, color:T.white, outline:"none", width:"100%", boxSizing:"border-box" };
  const labelStyle: any = { fontSize:11, color:T.muted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", display:"block", marginBottom:5 };

  if (!authed) {
    return (
      <div style={{ minHeight:"100vh", background:T.black, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui, sans-serif" }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:"40px", width:"100%", maxWidth:360, textAlign:"center" as const }}>
          <div style={{ fontWeight:700, fontSize:18, color:T.white, marginBottom:20 }}>Blog Admin</div>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin password"
            onKeyDown={e => e.key === "Enter" && (verifyAdminPassword(key).then(ok => ok ? setAuthed(true) : setMsg("Wrong password")))}
            style={{ ...inputStyle, marginBottom:12, padding:"12px" }} />
          {msg && <div style={{ color:"#f87171", fontSize:13, marginBottom:8 }}>{msg}</div>}
          <button onClick={() => verifyAdminPassword(key).then(ok => ok ? setAuthed(true) : setMsg("Wrong password"))}
            style={{ width:"100%", padding:"12px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  const showForm = creating || editing;

  return (
    <div style={{ background:T.black, color:T.white, minHeight:"100vh", fontFamily:"system-ui, sans-serif" }}>
      <div style={{ background:T.dark, borderBottom:`1px solid ${T.border}`, padding:"0 16px", display:"flex", alignItems:"center", height:54, gap:10 }}>
        <div style={{ fontWeight:700, fontSize:14, color:T.white }}>Blog Admin</div>
        {!showForm && (
          <div style={{ display:"flex", gap:2, marginLeft:8 }}>
            {(["posts","ads","settings","analytics"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding:"6px 12px", background:tab===t?T.goldBg:"none", border:`1px solid ${tab===t?T.gold+"40":"transparent"}`, borderRadius:8, fontSize:12, color:tab===t?T.gold:T.muted, cursor:"pointer", textTransform:"capitalize" as const }}>
                {t}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex:1 }} />
        <a href="/admin" style={{ fontSize:12, color:T.muted, textDecoration:"none" }}>← Admin</a>
        <a href="/blog" target="_blank" style={{ fontSize:12, color:T.gold, textDecoration:"none" }}>View Blog ↗</a>
        {!showForm && tab==="posts" && (
          <button onClick={() => { setCreating(true); setEditing(null); setForm({...EMPTY}); setEditorMode("markdown"); }}
            style={{ padding:"7px 14px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer" }}>
            + New Post
          </button>
        )}
      </div>

      {msg && (
        <div style={{ background:msg.startsWith("✓")?"#0a1a0a":"#1a0a0a", padding:"10px 16px", fontSize:13, color:msg.startsWith("✓")?"#22c55e":"#f87171", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between" }}>
          <span>{msg}</span>
          <button onClick={() => setMsg("")} style={{ background:"none", border:"none", color:T.muted, cursor:"pointer" }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 16px" }}>

        {/* POST FORM */}
        {showForm && (
          <form onSubmit={handleSave}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexWrap:"wrap" as const }}>
              <div style={{ fontWeight:600, fontSize:15, color:T.white }}>{editing?"Edit Post":"New Post"}</div>
              <div style={{ flex:1 }} />
              {(["markdown","preview"] as const).map(m => (
                <button key={m} type="button" onClick={() => setEditorMode(m)}
                  style={{ padding:"6px 12px", background:editorMode===m?T.goldBg:T.card, border:`1px solid ${editorMode===m?T.gold+"40":T.border}`, borderRadius:8, fontSize:12, color:editorMode===m?T.gold:T.muted, cursor:"pointer", textTransform:"capitalize" as const }}>
                  {m}
                </button>
              ))}
              <button type="button" onClick={() => { setEditing(null); setCreating(false); setForm({...EMPTY}); }}
                style={{ padding:"6px 14px", background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.muted, cursor:"pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ padding:"7px 18px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", opacity:loading?0.7:1 }}>
                {loading?"Saving...":editing?"Update":"Create Post"}
              </button>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:16, alignItems:"start" }}>
              <div style={{ gridColumn:"span 2", display:"flex", flexDirection:"column" as const, gap:14 }}>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12 }}>
                    <div style={{ gridColumn:"1 / -1" }}>
                      <label style={labelStyle}>Title *</label>
                      <input value={form.title} onChange={e => { set("title")(e); if(!editing) setForm((f:any) => ({...f,slug:slugify(e.target.value)})); }} required style={inputStyle} placeholder="Post title..." />
                    </div>
                    <div><label style={labelStyle}>Slug</label><input value={form.slug} onChange={set("slug")} style={inputStyle} placeholder="auto-from-title" /></div>
                    <div><label style={labelStyle}>Author</label><input value={form.author} onChange={set("author")} style={inputStyle} /></div>
                    <div style={{ gridColumn:"1 / -1" }}><label style={labelStyle}>Excerpt</label><textarea value={form.excerpt} onChange={set("excerpt")} rows={2} style={{ ...inputStyle, resize:"vertical" as const }} /></div>
                  </div>
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
                  <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, fontSize:12, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Content</div>
                  {editorMode==="markdown" ? (
                    <>
                      <VisualToolbar onInsert={insertMarkdown} />
                      <textarea ref={textareaRef} value={form.content} onChange={set("content")} rows={20}
                        style={{ ...inputStyle, borderRadius:"0 0 12px 12px", fontFamily:"monospace", fontSize:13, lineHeight:1.6, resize:"vertical" as const, border:"none" }}
                        placeholder={"# Heading\n\nParagraph 1...\n\nParagraph 2...\n\n## Section\n\nMore content..."} />
                    </>
                  ) : (
                    <div style={{ padding:"20px", minHeight:300, fontSize:15, lineHeight:1.8, color:T.muted }}
                      dangerouslySetInnerHTML={{ __html: renderPreview(form.content || "<em style='color:#444'>Nothing to preview yet...</em>") }} />
                  )}
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px" }}>
                  <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:14, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>SEO</div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12 }}>
                    <div>
                      <label style={labelStyle}>SEO Title <span style={{ color:(form.seo_title?.length||0)>60?"#f87171":T.muted2 }}>({form.seo_title?.length||0}/60)</span></label>
                      <input value={form.seo_title} onChange={set("seo_title")} style={inputStyle} placeholder={form.title} />
                    </div>
                    <div>
                      <label style={labelStyle}>Meta Description <span style={{ color:(form.seo_description?.length||0)>160?"#f87171":T.muted2 }}>({form.seo_description?.length||0}/160)</span></label>
                      <input value={form.seo_description} onChange={set("seo_description")} style={inputStyle} placeholder={form.excerpt} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column" as const, gap:14 }}>
                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px" }}>
                  <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:14, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Publish</div>
                  <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
                    <div><label style={labelStyle}>Status</label>
                      <select value={form.status} onChange={set("status")} style={inputStyle}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Publish date & time</label>
                      <input type="datetime-local" value={form.published_at||""} onChange={set("published_at")} style={{ ...inputStyle, colorScheme:"dark" }} />
                      <div style={{ fontSize:10, color:T.muted2, marginTop:3 }}>Leave blank to use current time</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="checkbox" id="featured" checked={form.featured} onChange={setCheck("featured")} />
                      <label htmlFor="featured" style={{ fontSize:13, color:T.muted, cursor:"pointer" }}>Featured ★</label>
                    </div>
                  </div>
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px" }}>
                  <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:14, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Category & Tags</div>
                  <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
                    <div><label style={labelStyle}>Category</label>
                      <select value={form.category} onChange={set("category")} style={inputStyle}>
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Tags (comma-separated)</label><input value={form.tags} onChange={set("tags")} style={inputStyle} placeholder="forex, signals" /></div>
                  </div>
                </div>

                <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"18px" }}>
                  <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:14, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Cover Image</div>
                  <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" as const }}>
                    {(["url","upload","library"] as const).map(m => (
                      <button key={m} type="button" onClick={() => { setImageMode(m); if(m==="library") loadLibrary(); }}
                        style={{ padding:"5px 12px", background:imageMode===m?T.goldBg:"transparent", border:`1px solid ${imageMode===m?T.gold+"40":T.border}`, borderRadius:8, fontSize:11, color:imageMode===m?T.gold:T.muted, cursor:"pointer", textTransform:"capitalize" as const }}>
                        {m==="library"?"📁 Library":m==="url"?"URL":"Upload"}
                      </button>
                    ))}
                  </div>
                  {imageMode==="url" && (
                    <input value={form.cover_image?.startsWith("data:")?"":form.cover_image||""} onChange={set("cover_image")} style={inputStyle} placeholder="https://..." />
                  )}
                  {imageMode==="upload" && (
                    <div>
                      <input ref={fileRef} type="file" accept="image/*" onChange={e => {
                        const file = e.target.files?.[0]; if(!file) return;
                        if(file.size > 5*1024*1024) { setMsg("Max 5MB"); return; }
                        const r = new FileReader();
                        r.onload = async ev => {
                          const data = ev.target?.result as string;
                          try {
                            const res = await fetch(`${API}/blog/media/upload`, {
                              method:"POST", headers: authHeaders(),
                              body: JSON.stringify({ filename: file.name, data, mime_type: file.type })
                            });
                            const result = await res.json();
                            if (result.url) {
                              setForm((f:any) => ({...f, cover_image: result.url}));
                              setMsg("✓ Image uploaded");
                            } else {
                              setForm((f:any) => ({...f, cover_image: data}));
                              setMsg("Upload failed - using local preview");
                            }
                            loadLibrary();
                          } catch {
                            setForm((f:any) => ({...f, cover_image: data}));
                          }
                        };
                        r.readAsDataURL(file);
                      }} style={{ display:"none" }} />
                      <button type="button" onClick={() => fileRef.current?.click()}
                        style={{ width:"100%", padding:"10px", background:"#111", border:`2px dashed ${T.border}`, borderRadius:8, color:T.muted, fontSize:13, cursor:"pointer" }}>
                        Click to upload image (max 5MB) — saved to library
                      </button>
                    </div>
                  )}
                  {imageMode==="library" && (
                    <div>
                      {mediaLibrary.length === 0 ? (
                        <div style={{ textAlign:"center" as const, padding:"20px", color:T.muted, fontSize:13 }}>No images yet — upload one first</div>
                      ) : (
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(80px, 1fr))", gap:8 }}>
                          {mediaLibrary.map((img:any) => (
                            <div key={img.id} style={{ position:"relative" as const, borderRadius:8, overflow:"hidden", border:`2px solid ${form.cover_image===img.data?T.gold:T.border}` }}>
                              <img src={img.data} alt={img.filename}
                                onClick={() => setForm((f:any) => ({...f, cover_image: img.data}))}
                                style={{ width:"100%", height:70, objectFit:"cover" as const, display:"block", cursor:"pointer" }} />
                              <button
                                type="button"
                                onClick={async e => {
                                  e.stopPropagation();
                                  if (!confirm("Delete this image?")) return;
                                  try {
                                    await fetch(`${API}/blog/media/${img.id}`, { method:"DELETE", headers: authHeaders() });
                                    setMediaLibrary((prev:any[]) => prev.filter((m:any) => m.id !== img.id));
                                    if (form.cover_image === img.data) setForm((f:any) => ({...f, cover_image: ""}));
                                    setMsg("✓ Image deleted");
                                  } catch { setMsg("Delete failed"); }
                                }}
                                style={{ position:"absolute" as const, top:2, right:2, width:18, height:18, borderRadius:"50%", background:"rgba(0,0,0,0.8)", border:"1px solid #f87171", color:"#f87171", fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, padding:0 }}>
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {form.cover_image && (
                    <div style={{ marginTop:10 }}>
                      <img src={form.cover_image} alt="Preview" style={{ width:"100%", borderRadius:8, maxHeight:120, objectFit:"cover" as const }} />
                      <button type="button" onClick={() => setForm((f:any) => ({...f,cover_image:""}))}
                        style={{ marginTop:4, fontSize:11, color:"#f87171", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* POSTS LIST */}
        {!showForm && tab==="posts" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, flexWrap:"wrap" as const }}>
              <div style={{ fontWeight:600, fontSize:14, color:T.white }}>Posts ({total})</div>
              <div style={{ flex:1 }} />
              {["all","published","draft"].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  style={{ padding:"5px 12px", background:filter===s?T.goldBg:"transparent", border:`1px solid ${filter===s?T.gold+"40":T.border}`, borderRadius:8, fontSize:11, color:filter===s?T.gold:T.muted, cursor:"pointer", textTransform:"capitalize" as const }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
              {posts.length===0 ? (
                <div style={{ textAlign:"center" as const, padding:"48px", color:T.muted, background:T.card, borderRadius:12 }}>No posts — click "+ New Post" to create one</div>
              ) : posts.map(p => (
                <div key={p.id} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" as const }}>
                  {p.cover_image && <img src={p.cover_image} alt="" style={{ width:44, height:44, borderRadius:6, objectFit:"cover" as const, flexShrink:0 }} />}
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontWeight:600, color:T.white, fontSize:14 }}>{p.title}</div>
                    <div style={{ fontSize:11, color:T.muted2, marginTop:2 }}>
                      {p.category && <span style={{ marginRight:8 }}>{p.category}</span>}
                      {p.published_at ? new Date(p.published_at).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short"}) : "Draft"}
                      {p.featured && <span style={{ marginLeft:6, color:T.gold }}>★</span>}
                    </div>
                  </div>
                  <span style={{ background:p.status==="published"?"#16a34a20":"#1a1a1a", color:p.status==="published"?"#22c55e":T.muted, fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:99 }}>{p.status}</span>
                  <span style={{ fontSize:11, color:T.muted2 }}>{p.views||0} views</span>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => startEdit(p)} style={{ padding:"5px 10px", background:T.goldBg, color:T.gold, border:`1px solid ${T.gold}40`, borderRadius:6, fontSize:11, cursor:"pointer" }}>Edit</button>
                    {p.status==="published" && <a href={`/blog/${p.slug}`} target="_blank" style={{ padding:"5px 10px", background:"#0a1a0a", color:"#22c55e", border:"1px solid #166534", borderRadius:6, fontSize:11, textDecoration:"none" }}>View</a>}
                    <button onClick={() => handleDelete(p.id,p.title)} style={{ padding:"5px 10px", background:"#1a0a0a", color:"#f87171", border:"1px solid #3a1a1a", borderRadius:6, fontSize:11, cursor:"pointer" }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADS MANAGER */}
        {!showForm && tab==="ads" && (
          <form onSubmit={saveAds}>
            <div style={{ fontWeight:600, fontSize:15, color:T.white, marginBottom:16 }}>Ad Code Manager</div>
            <div style={{ background:T.goldBg, border:`1px solid ${T.gold}30`, borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:T.muted, lineHeight:1.6 }}>
              Paste your Google AdSense or any ad network HTML code in each slot. Leave blank to hide. In-content ads are automatically injected after the paragraph number you specify — no need to edit post content.
            </div>

            {/* Standard ad slots */}
            <div style={{ fontSize:12, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:12 }}>Standard Ad Slots</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:14, marginBottom:24 }}>
              {[
                { key:"top_banner",  label:"Top Banner (728×90)",     hint:"Top of blog index and post pages" },
                { key:"before_post", label:"Before Post (728×90)",    hint:"Just before article content" },
                { key:"after_post",  label:"After Post (728×90)",     hint:"After article content ends" },
                { key:"in_feed",     label:"In-Feed (728×90)",        hint:"Between post rows on blog index" },
                { key:"sidebar_1",   label:"Sidebar 1 (300×250)",     hint:"First sidebar slot" },
                { key:"sidebar_2",   label:"Sidebar 2 (300×250)",     hint:"Second sidebar slot" },
              ].map(slot => (
                <div key={slot.key} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px" }}>
                  <label style={{ ...labelStyle, color:T.gold }}>{slot.label}</label>
                  <div style={{ fontSize:11, color:T.muted2, marginBottom:8 }}>{slot.hint}</div>
                  <textarea value={(ads as any)[slot.key]} onChange={setAd(slot.key)} rows={3}
                    style={{ background:"#0f0f0f", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:12, color:T.white, outline:"none", width:"100%", boxSizing:"border-box" as const, fontFamily:"monospace", resize:"vertical" as const }}
                    placeholder="<!-- Paste ad code here -->" />
                  {(ads as any)[slot.key] && <div style={{ marginTop:4, fontSize:10, color:"#22c55e" }}>● Active</div>}
                </div>
              ))}
            </div>

            {/* In-content ad slots */}
            <div style={{ fontSize:12, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.05em", marginBottom:8 }}>In-Content Ads (5 slots)</div>
            <div style={{ background:T.goldBg, border:`1px solid ${T.gold}30`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12, color:T.muted }}>
              Set the paragraph number to inject each ad after. For example, "After paragraph 3" means the ad appears after the 3rd paragraph of the article. Leave code blank to disable a slot.
            </div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
              {[1,2,3,4,5].map(n => (
                <div key={n} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" as const }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.white }}>In-Content Ad #{n}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <label style={{ fontSize:12, color:T.muted }}>Insert after paragraph:</label>
                      <input
                        type="number" min="1" max="100"
                        value={(ads as any)[`incontent_${n}_para`]}
                        onChange={setAd(`incontent_${n}_para`)}
                        style={{ background:"#0f0f0f", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", fontSize:13, color:T.white, outline:"none", width:70 }}
                      />
                    </div>
                    {(ads as any)[`incontent_${n}_code`] && <div style={{ fontSize:10, color:"#22c55e", marginLeft:"auto" }}>● Active</div>}
                  </div>
                  <textarea
                    value={(ads as any)[`incontent_${n}_code`]}
                    onChange={setAd(`incontent_${n}_code`)}
                    rows={3}
                    style={{ background:"#0f0f0f", border:`1px solid ${T.border}`, borderRadius:8, padding:"9px 12px", fontSize:12, color:T.white, outline:"none", width:"100%", boxSizing:"border-box" as const, fontFamily:"monospace", resize:"vertical" as const }}
                    placeholder={`<!-- In-content ad #${n} code - auto-injected after paragraph ${(ads as any)[`incontent_${n}_para`]} -->`}
                  />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} style={{ marginTop:20, padding:"12px 28px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              {loading?"Saving...":"Save All Ad Codes"}
            </button>
          </form>
        )}

        {/* SETTINGS */}
        {!showForm && tab==="settings" && (
          <form onSubmit={saveSettings}>
            <div style={{ fontWeight:600, fontSize:15, color:T.white, marginBottom:20 }}>Blog Settings</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:16 }}>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px" }}>
                <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:16, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Pagination</div>
                <div style={{ display:"flex", flexDirection:"column" as const, gap:14 }}>
                  {[
                    { label:"Posts per page (archive)", key:"posts_per_page" },
                    { label:"Posts per category page",  key:"posts_per_category" },
                    { label:"Posts per tag page",       key:"posts_per_tag" },
                  ].map(s => (
                    <div key={s.key}>
                      <label style={labelStyle}>{s.label}</label>
                      <input type="number" min="1" max="50" value={(settings as any)[s.key]} onChange={setSetting(s.key)} style={{ ...inputStyle, width:80 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px" }}>
                <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:16, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Display</div>
                <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                  {[
                    { label:"Show author name",    key:"show_author" },
                    { label:"Show published date", key:"show_date" },
                    { label:"Show view count",     key:"show_views" },
                    { label:"Show share buttons",  key:"show_share" },
                    { label:"Show related posts",  key:"show_related" },
                  ].map(s => (
                    <div key={s.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="checkbox" id={s.key} checked={(settings as any)[s.key]==="true"}
                        onChange={e => setSettings((prev:any) => ({...prev,[s.key]:e.target.checked?"true":"false"}))} />
                      <label htmlFor={s.key} style={{ fontSize:13, color:T.muted, cursor:"pointer" }}>{s.label}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"20px" }}>
                <div style={{ fontSize:12, color:T.gold, fontWeight:600, marginBottom:12, textTransform:"uppercase" as const, letterSpacing:"0.05em" }}>Sitemap</div>
                <p style={{ fontSize:13, color:T.muted, marginBottom:12, lineHeight:1.6 }}>Auto-generated sitemap includes all published posts:</p>
                <a href="/sitemap.xml" target="_blank" style={{ display:"block", padding:"10px 14px", background:"#111", border:`1px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.gold, textDecoration:"none", fontFamily:"monospace", marginBottom:10 }}>
                  alphaforexai.com/sitemap.xml
                </a>
                <p style={{ fontSize:11, color:T.muted2, lineHeight:1.6 }}>Submit to Google Search Console → Sitemaps tab.</p>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop:20, padding:"12px 28px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", border:"none", borderRadius:8, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              {loading?"Saving...":"Save Settings"}
            </button>
          </form>
        )}

        {/* ANALYTICS */}
        {!showForm && tab==="analytics" && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap" as const }}>
              <div style={{ fontWeight:600, fontSize:15, color:T.white }}>Traffic Analytics</div>
              <div style={{ flex:1 }} />
              {[{label:"Today",days:1},{label:"Yesterday",days:2},{label:"7D",days:7},{label:"1M",days:30},{label:"3M",days:90},{label:"6M",days:180},{label:"1Y",days:365},{label:"All",days:3650}].map(d=>(
                <button key={d.days} onClick={()=>{
                  if(d.label==="Yesterday"){const y=new Date();y.setDate(y.getDate()-1);const s=y.toISOString().split("T")[0];setCustomRange(true);setDateFrom(s);setDateTo(s);setAnalyticsLoading(true);fetch(`${API}/blog/analytics?from=${s}&to=${s}`,{headers:authHeaders()}).then(r=>r.json()).then(setAnalytics).finally(()=>setAnalyticsLoading(false));}
                  else if(d.label==="Today"){const s=new Date().toISOString().split("T")[0];setCustomRange(true);setDateFrom(s);setDateTo(s);setAnalyticsLoading(true);fetch(`${API}/blog/analytics?from=${s}&to=${s}`,{headers:authHeaders()}).then(r=>r.json()).then(setAnalytics).finally(()=>setAnalyticsLoading(false));}
                  else{setAnalyticsDays(d.days);setCustomRange(false);fetchAnalytics(d.days);}
                }} style={{padding:"5px 10px",background:analyticsDays===d.days&&!customRange?T.goldBg:"transparent",border:`1px solid ${analyticsDays===d.days&&!customRange?T.gold+"40":T.border}`,borderRadius:8,fontSize:11,color:analyticsDays===d.days&&!customRange?T.gold:T.muted,cursor:"pointer"}}>{d.label}</button>
              ))}
              <button onClick={()=>setCustomRange(r=>!r)} style={{padding:"5px 10px",background:customRange?T.goldBg:"transparent",border:`1px solid ${customRange?T.gold+"40":T.border}`,borderRadius:8,fontSize:11,color:customRange?T.gold:T.muted,cursor:"pointer"}}>Custom</button>
              <button onClick={()=>fetchAnalytics(analyticsDays)} style={{padding:"5px 10px",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:11,color:T.muted,cursor:"pointer"}}>↻</button>
              <button onClick={async()=>{
                if(!confirm("Reset ALL analytics data? This cannot be undone.")) return;
                await fetch(`${API}/blog/analytics/reset`,{method:"DELETE",headers:authHeaders()});
                setAnalytics(null);
                setMsg("✓ Analytics reset");
              }} style={{padding:"5px 10px",background:"#1a0a0a",border:"1px solid #3a1a1a",borderRadius:8,fontSize:11,color:"#f87171",cursor:"pointer"}}>Reset</button>
            </div>
            {customRange&&(
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:16,flexWrap:"wrap" as const,padding:"12px 14px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10}}>
                <span style={{fontSize:12,color:T.muted}}>From:</span>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{background:"#0f0f0f",border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,color:T.white,colorScheme:"dark"}}/>
                <span style={{fontSize:12,color:T.muted}}>To:</span>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{background:"#0f0f0f",border:`1px solid ${T.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,color:T.white,colorScheme:"dark"}}/>
                <button onClick={async()=>{if(!dateFrom||!dateTo)return;setAnalyticsLoading(true);try{const r=await fetch(`${API}/blog/analytics?from=${dateFrom}&to=${dateTo}`,{headers:authHeaders()});setAnalytics(await r.json());}finally{setAnalyticsLoading(false);}}} style={{padding:"6px 14px",background:`linear-gradient(135deg,${T.gold} 0%,#e8c97e 100%)`,color:"#000",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>Apply</button>
              </div>
            )}
            {analyticsLoading?(
              <div style={{textAlign:"center" as const,padding:"48px",color:T.muted}}>Loading...</div>
            ):!analytics?(
              <div style={{textAlign:"center" as const,padding:"48px",color:T.muted}}>No data yet — visit your site to start tracking</div>
            ):(
              <div style={{display:"flex",flexDirection:"column" as const,gap:16}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))",gap:12}}>
                  {[{label:"Total Visits",value:analytics.total_visits,color:T.gold},{label:"Unique Visitors",value:analytics.unique_visitors,color:T.green}].map(s=>(
                    <div key={s.label} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:"16px",textAlign:"center" as const}}>
                      <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.value}</div>
                      <div style={{fontSize:11,color:T.muted,marginTop:4}}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:14}}>
                  {[
                    {title:"Top Pages",data:analytics.top_pages,kF:(r:any)=>r.path,vF:(r:any)=>r.count},
                    {title:"Referrers",data:analytics.referrers,kF:(r:any)=>r.referrer||"Direct",vF:(r:any)=>r.count},
                    {title:"Devices",data:analytics.devices,kF:(r:any)=>r.device,vF:(r:any)=>r.count},
                    {title:"Browsers",data:analytics.browsers,kF:(r:any)=>r.browser,vF:(r:any)=>r.count},
                    {title:"OS",data:analytics.os,kF:(r:any)=>r.os,vF:(r:any)=>r.count},
                  ].map(sec=>(
                    <div key={sec.title} style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                      <div style={{fontSize:12,color:T.gold,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.05em",marginBottom:12}}>{sec.title}</div>
                      {!(sec.data||[]).length?<div style={{fontSize:12,color:T.muted2}}>No data yet</div>
                      :(sec.data||[]).map((r:any)=>{
                        const tot=(sec.data||[]).reduce((s:number,x:any)=>s+sec.vF(x),0);
                        const pct=tot>0?Math.round((sec.vF(r)/tot)*100):0;
                        return(
                          <div key={sec.kF(r)} style={{marginBottom:8}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                              <span style={{fontSize:12,color:T.muted,maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sec.kF(r)}</span>
                              <span style={{fontSize:12,color:T.white,fontWeight:600}}>{sec.vF(r)} <span style={{color:T.muted2}}>({pct}%)</span></span>
                            </div>
                            <div style={{background:"#1a1a1a",borderRadius:3,height:4}}><div style={{background:T.gold,borderRadius:3,height:4,width:`${pct}%`}}/></div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                  <div style={{fontSize:12,color:T.gold,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.05em",marginBottom:12}}>Top Posts by Views</div>
                  {!analytics.top_posts?.length?<div style={{fontSize:12,color:T.muted2}}>No views yet</div>
                  :analytics.top_posts.map((p:any)=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{flex:1,fontSize:13,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.title}</div>
                      <a href={`/blog/${p.slug}`} target="_blank" style={{fontSize:11,color:T.muted,textDecoration:"none"}}>↗</a>
                      <span style={{fontSize:12,fontWeight:600,color:T.gold}}>{p.views}</span>
                    </div>
                  ))}
                </div>
                {analytics.daily?.length>0&&(
                  <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px"}}>
                    <div style={{fontSize:12,color:T.gold,fontWeight:600,textTransform:"uppercase" as const,letterSpacing:"0.05em",marginBottom:12}}>Daily Visits</div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:80}}>
                      {analytics.daily.map((d:any)=>{const mx=Math.max(...analytics.daily.map((x:any)=>x.count));const h=mx>0?Math.max(4,Math.round((d.count/mx)*80)):4;return <div key={d.day} title={`${d.day}: ${d.count}`} style={{flex:1,background:T.gold,borderRadius:"2px 2px 0 0",height:h,opacity:0.8,minWidth:2}}/>;  })}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:10,color:T.muted2}}>
                      <span>{analytics.daily[0]?.day}</span><span>{analytics.daily[analytics.daily.length-1]?.day}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  return <AuthProvider><BlogAdminContent /></AuthProvider>;
}
