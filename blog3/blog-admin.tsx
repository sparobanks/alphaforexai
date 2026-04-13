"use client";
import { useState, useEffect, useRef } from "react";
import { T, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
const ADMIN_PASSWORD = "forexai-admin-2026";

function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const CATEGORIES = ["Market Analysis", "Trading Education", "AI & Technology", "Signal Review", "Forex Basics", "Strategy", "News & Events"];

const EMPTY: any = {
  title: "", slug: "", excerpt: "", content: "", cover_image: "",
  author: "AlphaForexAI Team", category: "", tags: "",
  status: "draft", featured: false, seo_title: "", seo_description: "",
  published_at: "",
};

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function VisualToolbar({ onInsert }: { onInsert: (b: string, a: string) => void }) {
  const tools = [
    { label: "B", style: { fontWeight: 800 as const }, b: "**", a: "**" },
    { label: "I", style: { fontStyle: "italic" as const }, b: "*", a: "*" },
    { label: "H2", style: { fontSize: 11 }, b: "\n## ", a: "\n" },
    { label: "H3", style: { fontSize: 11 }, b: "\n### ", a: "\n" },
    { label: "›", style: {}, b: "\n> ", a: "\n" },
    { label: "—", style: {}, b: "\n- ", a: "\n" },
    { label: "</>", style: { fontFamily: "monospace", fontSize: 11 }, b: "`", a: "`" },
    { label: "Link", style: { fontSize: 11 }, b: "[", a: "](url)" },
    { label: "Img", style: { fontSize: 11 }, b: "![alt](", a: ")" },
    { label: "📢 Ad", style: { fontSize: 11, color: "#f59e0b" }, b: "\n[AD_SLOT]\n", a: "" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, padding: "8px 10px", background: "#111", borderRadius: "8px 8px 0 0", borderBottom: `1px solid ${T.border}` }}>
      {tools.map(t => (
        <button key={t.label} type="button" onClick={() => onInsert(t.b, t.a)}
          style={{ padding: "4px 9px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, color: T.muted, cursor: "pointer", ...t.style }}>
          {t.label}
        </button>
      ))}
      <div style={{ marginLeft: "auto", fontSize: 10, color: T.muted2, alignSelf: "center" }}>Use [AD_SLOT] to insert an ad between paragraphs</div>
    </div>
  );
}

function BlogAdminContent() {
  const [authed, setAuthed]     = useState(false);
  const [key, setKey]           = useState("");
  const [tab, setTab]           = useState<"posts" | "ads" | "settings">("posts");
  const [posts, setPosts]       = useState<any[]>([]);
  const [total, setTotal]       = useState(0);
  const [editing, setEditing]   = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState<any>({ ...EMPTY });
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState("");
  const [editorMode, setEditorMode] = useState<"markdown" | "preview">("markdown");
  const [filter, setFilter]     = useState("all");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploadLoading, setUploadLoading] = useState(false);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  // Ads state
  const [ads, setAds] = useState({
    top_banner:      "",
    before_post:     "",
    after_post:      "",
    in_feed:         "",
    sidebar_1:       "",
    sidebar_2:       "",
    inline_ad:       "",  // used for [AD_SLOT] in content
  });

  // Settings state
  const [settings, setSettings] = useState({
    posts_per_page:   "9",
    posts_per_category: "9",
    posts_per_tag:    "9",
    show_author:      "true",
    show_date:        "true",
    show_views:       "true",
    show_share:       "true",
    show_related:     "true",
  });

  useEffect(() => { if (authed) { fetchPosts(); fetchAds(); fetchSettings(); } }, [authed, filter]);

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
        inline_ad:   data.blog_ad_inline      || "",
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
          blog_ad_inline:      ads.inline_ad,
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
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setForm((f: any) => ({ ...f, content: newText }));
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg("Image must be under 5MB"); return; }
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f: any) => ({ ...f, cover_image: ev.target?.result as string }));
      setUploadLoading(false);
      setMsg("✓ Image loaded");
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { setMsg("Title is required"); return; }
    setLoading(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      published_at: form.published_at || undefined,
    };
    try {
      const url = editing ? `${API}/blog/admin/posts/${editing.id}` : `${API}/blog/admin/posts`;
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.id) {
        setMsg(`✓ Post ${editing ? "updated" : "created"}`);
        setEditing(null); setCreating(false); setForm({ ...EMPTY });
        fetchPosts();
      } else {
        setMsg(`Error: ${data.detail || JSON.stringify(data)}`);
      }
    } catch (err: any) { setMsg(`Error: ${err.message}`); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`${API}/blog/admin/posts/${id}`, { method: "DELETE", headers: authHeaders() });
    setMsg("✓ Deleted"); fetchPosts();
  }

  function startEdit(post: any) {
    const pubDate = post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : "";
    setForm({ ...post, tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "", published_at: pubDate });
    setEditing(post); setCreating(false); setEditorMode("markdown");
  }

  function renderPreview(md: string) {
    return md
      .replace(/\[AD_SLOT\]/g, '<div style="background:#1a1a0a;border:1px dashed #854d0e;border-radius:6px;padding:8px;text-align:center;color:#854d0e;font-size:11px;margin:12px 0">📢 Ad will appear here</div>')
      .replace(/^## (.+)$/gm, '<h2 style="font-size:20px;font-family:Georgia,serif;color:#f5f4f0;margin:20px 0 8px">$1</h2>')
      .replace(/^# (.+)$/gm,  '<h1 style="font-size:26px;font-family:Georgia,serif;color:#f5f4f0;margin:16px 0 10px">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,    '<em>$1</em>')
      .replace(/`(.+?)`/g,      '<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;color:#c9a84c">$1</code>')
      .replace(/^> (.+)$/gm,    '<blockquote style="border-left:3px solid #c9a84c;padding:10px 14px;margin:12px 0;background:#111;color:#888">$1</blockquote>')
      .replace(/^- (.+)$/gm,    '<li style="margin:4px 0;color:#888">$1</li>')
      .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="padding-left:20px;margin:12px 0">$&</ul>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,  '<a href="$2" style="color:#c9a84c">$1</a>')
      .replace(/^(?!<[hulbipqci])(.*\S.*)$/gm, '<p style="margin:0 0 12px;color:#888;line-height:1.7">$1</p>');
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle: any = { fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 };
  const textareaAdStyle: any = { ...inputStyle, fontFamily: "monospace", fontSize: 12, resize: "vertical" as const };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", width: "100%", maxWidth: 360, textAlign: "center" as const }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 20 }}>Blog Admin</div>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin password"
            onKeyDown={e => e.key === "Enter" && (key === ADMIN_PASSWORD ? setAuthed(true) : setMsg("Wrong password"))}
            style={{ ...inputStyle, marginBottom: 12, padding: "12px" }} />
          {msg && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{msg}</div>}
          <button onClick={() => key === ADMIN_PASSWORD ? setAuthed(true) : setMsg("Wrong password")}
            style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  const showForm = creating || editing;

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", height: 54, gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.white }}>Blog Admin</div>
        {!showForm && (
          <div style={{ display: "flex", gap: 2, marginLeft: 12 }}>
            {(["posts", "ads", "settings"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "6px 14px", background: tab === t ? T.goldBg : "none", border: `1px solid ${tab === t ? T.gold + "40" : "transparent"}`, borderRadius: 8, fontSize: 12, color: tab === t ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                {t}
              </button>
            ))}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <a href="/admin" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>← Admin</a>
        <a href="/blog" target="_blank" style={{ fontSize: 12, color: T.gold, textDecoration: "none" }}>View Blog ↗</a>
        {!showForm && tab === "posts" && (
          <button onClick={() => { setCreating(true); setEditing(null); setForm({ ...EMPTY }); setEditorMode("markdown"); }}
            style={{ padding: "7px 16px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + New Post
          </button>
        )}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✓") ? "#0a1a0a" : "#1a0a0a", padding: "10px 16px", fontSize: 13, color: msg.startsWith("✓") ? "#22c55e" : "#f87171", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
          <span>{msg}</span>
          <button onClick={() => setMsg("")} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── POST FORM ── */}
        {showForm && (
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.white }}>{editing ? "Edit Post" : "New Post"}</div>
              <div style={{ flex: 1 }} />
              {(["markdown", "preview"] as const).map(m => (
                <button key={m} type="button" onClick={() => setEditorMode(m)}
                  style={{ padding: "6px 12px", background: editorMode === m ? T.goldBg : T.card, border: `1px solid ${editorMode === m ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 12, color: editorMode === m ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                  {m}
                </button>
              ))}
              <button type="button" onClick={() => { setEditing(null); setCreating(false); setForm({ ...EMPTY }); }}
                style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: "7px 18px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving..." : editing ? "Update" : "Create Post"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>

              {/* Main — spans both columns on wide screens */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column" as const, gap: 14 }}>

                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Title *</label>
                      <input value={form.title} onChange={e => { set("title")(e); if (!editing) setForm((f: any) => ({ ...f, slug: slugify(e.target.value) })); }} required style={inputStyle} placeholder="Post title..." />
                    </div>
                    <div>
                      <label style={labelStyle}>Slug (URL)</label>
                      <input value={form.slug} onChange={set("slug")} style={inputStyle} placeholder="auto-from-title" />
                    </div>
                    <div>
                      <label style={labelStyle}>Author</label>
                      <input value={form.author} onChange={set("author")} style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={labelStyle}>Excerpt</label>
                      <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Short description shown in blog list..." />
                    </div>
                  </div>
                </div>

                {/* Content editor */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Content</span>
                    <span style={{ fontSize: 11, color: T.muted2 }}>Use [AD_SLOT] to insert ads between paragraphs</span>
                  </div>
                  {editorMode === "markdown" ? (
                    <>
                      <VisualToolbar onInsert={insertMarkdown} />
                      <textarea ref={textareaRef} value={form.content} onChange={set("content")} rows={20}
                        style={{ ...inputStyle, borderRadius: "0 0 12px 12px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, resize: "vertical" as const, border: "none" }}
                        placeholder={"# Heading\n\nWrite your content...\n\n## Section\n\n[AD_SLOT]\n\nMore content after ad..."} />
                    </>
                  ) : (
                    <div style={{ padding: "20px", minHeight: 300, fontSize: 15, lineHeight: 1.8, color: T.muted }}
                      dangerouslySetInnerHTML={{ __html: renderPreview(form.content || "<em style='color:#444'>Nothing to preview yet...</em>") }} />
                  )}
                </div>

                {/* SEO */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>SEO</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>SEO Title <span style={{ color: (form.seo_title?.length || 0) > 60 ? "#f87171" : T.muted2 }}>({form.seo_title?.length || 0}/60)</span></label>
                      <input value={form.seo_title} onChange={set("seo_title")} style={inputStyle} placeholder={form.title} />
                    </div>
                    <div>
                      <label style={labelStyle}>Meta Description <span style={{ color: (form.seo_description?.length || 0) > 160 ? "#f87171" : T.muted2 }}>({form.seo_description?.length || 0}/160)</span></label>
                      <input value={form.seo_description} onChange={set("seo_description")} style={inputStyle} placeholder={form.excerpt} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>

                {/* Publish */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Publish</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Status</label>
                      <select value={form.status} onChange={set("status")} style={inputStyle}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Published date & time</label>
                      <input type="datetime-local" value={form.published_at || ""} onChange={set("published_at")}
                        style={{ ...inputStyle, colorScheme: "dark" }} />
                      <div style={{ fontSize: 10, color: T.muted2, marginTop: 3 }}>Leave blank to use current time when publishing</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" id="featured" checked={form.featured} onChange={setCheck("featured")} />
                      <label htmlFor="featured" style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>Featured post ★</label>
                    </div>
                  </div>
                </div>

                {/* Category & Tags */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Taxonomy</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <select value={form.category} onChange={set("category")} style={inputStyle}>
                        <option value="">Select category</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Tags (comma-separated)</label>
                      <input value={form.tags} onChange={set("tags")} style={inputStyle} placeholder="forex, EUR/USD, signals" />
                    </div>
                  </div>
                </div>

                {/* Cover image */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                  <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Cover Image</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {(["url", "upload"] as const).map(m => (
                      <button key={m} type="button" onClick={() => setImageMode(m)}
                        style={{ padding: "5px 12px", background: imageMode === m ? T.goldBg : "transparent", border: `1px solid ${imageMode === m ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 11, color: imageMode === m ? T.gold : T.muted, cursor: "pointer" }}>
                        {m === "url" ? "URL" : "Upload"}
                      </button>
                    ))}
                  </div>
                  {imageMode === "url"
                    ? <input value={form.cover_image?.startsWith("data:") ? "" : (form.cover_image || "")} onChange={set("cover_image")} style={inputStyle} placeholder="https://..." />
                    : (
                      <div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadLoading}
                          style={{ width: "100%", padding: "10px", background: "#111", border: `2px dashed ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer" }}>
                          {uploadLoading ? "Loading..." : "Click to select image (max 5MB)"}
                        </button>
                      </div>
                    )
                  }
                  {form.cover_image && (
                    <div style={{ marginTop: 10 }}>
                      <img src={form.cover_image} alt="Preview" style={{ width: "100%", borderRadius: 8, maxHeight: 120, objectFit: "cover" as const }} />
                      <button type="button" onClick={() => setForm((f: any) => ({ ...f, cover_image: "" }))}
                        style={{ marginTop: 4, fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ── POSTS LIST ── */}
        {!showForm && tab === "posts" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" as const }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.white }}>Posts ({total})</div>
              <div style={{ flex: 1 }} />
              {["all", "published", "draft"].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  style={{ padding: "5px 12px", background: filter === s ? T.goldBg : "transparent", border: `1px solid ${filter === s ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 11, color: filter === s ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {posts.length === 0 ? (
                <div style={{ textAlign: "center" as const, padding: "48px", color: T.muted, background: T.card, borderRadius: 12 }}>No posts — click "+ New Post" to create one</div>
              ) : posts.map(p => (
                <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  {p.cover_image && <img src={p.cover_image} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" as const, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontWeight: 600, color: T.white, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: T.muted2, marginTop: 2 }}>
                      {p.category && <span style={{ marginRight: 8 }}>{p.category}</span>}
                      {p.published_at ? new Date(p.published_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Draft"}
                      {p.featured && <span style={{ marginLeft: 6, color: T.gold }}>★</span>}
                    </div>
                  </div>
                  <span style={{ background: p.status === "published" ? "#16a34a20" : "#1a1a1a", color: p.status === "published" ? "#22c55e" : T.muted, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{p.status}</span>
                  <span style={{ fontSize: 11, color: T.muted2 }}>{p.views || 0} views</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => startEdit(p)} style={{ padding: "5px 10px", background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}40`, borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
                    {p.status === "published" && <a href={`/blog/${p.slug}`} target="_blank" style={{ padding: "5px 10px", background: "#0a1a0a", color: "#22c55e", border: "1px solid #166534", borderRadius: 6, fontSize: 11, textDecoration: "none" }}>View</a>}
                    <button onClick={() => handleDelete(p.id, p.title)} style={{ padding: "5px 10px", background: "#1a0a0a", color: "#f87171", border: "1px solid #3a1a1a", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADS MANAGER ── */}
        {!showForm && tab === "ads" && (
          <form onSubmit={saveAds}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.white, marginBottom: 20 }}>Ad Code Manager</div>
            <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: T.muted }}>
              Paste your Google AdSense, Media.net, or any ad network HTML code in each slot. Leave blank to hide the slot. Use <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, color: T.gold }}>{"[AD_SLOT]"}</code> in post content to place the <strong>inline ad</strong> between paragraphs.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {[
                { key: "top_banner",  label: "Top Banner (728×90)", hint: "Shown at top of blog index and post pages" },
                { key: "before_post", label: "Before Post (728×90)", hint: "Shown just before the article content begins" },
                { key: "after_post",  label: "After Post (728×90)",  hint: "Shown after the article content ends" },
                { key: "in_feed",     label: "In-Feed Ad (728×90)",  hint: "Shown between rows of posts on the blog index" },
                { key: "sidebar_1",   label: "Sidebar Ad 1 (300×250)", hint: "First sidebar ad slot" },
                { key: "sidebar_2",   label: "Sidebar Ad 2 (300×250)", hint: "Second sidebar ad slot" },
                { key: "inline_ad",   label: "Inline / In-Content Ad", hint: "Inserted wherever [AD_SLOT] appears in post content" },
              ].map(slot => (
                <div key={slot.key} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" }}>
                  <label style={{ ...labelStyle, color: T.gold }}>{slot.label}</label>
                  <div style={{ fontSize: 11, color: T.muted2, marginBottom: 8 }}>{slot.hint}</div>
                  <textarea value={(ads as any)[slot.key]} onChange={setAd(slot.key)} rows={4}
                    style={{ ...textareaAdStyle }}
                    placeholder={`<!-- ${slot.label} ad code -->\n<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>\n<!-- Your ad unit -->`}
                  />
                  {(ads as any)[slot.key] && (
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 10, color: "#22c55e" }}>Active</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: 20, padding: "12px 28px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Saving..." : "Save All Ad Codes"}
            </button>
          </form>
        )}

        {/* ── SETTINGS ── */}
        {!showForm && tab === "settings" && (
          <form onSubmit={saveSettings}>
            <div style={{ fontWeight: 600, fontSize: 15, color: T.white, marginBottom: 20 }}>Blog Settings</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Pagination</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                  {[
                    { label: "Posts per page (archive)", key: "posts_per_page" },
                    { label: "Posts per category page",  key: "posts_per_category" },
                    { label: "Posts per tag page",       key: "posts_per_tag" },
                  ].map(s => (
                    <div key={s.key}>
                      <label style={labelStyle}>{s.label}</label>
                      <input type="number" min="1" max="50" value={(settings as any)[s.key]} onChange={setSetting(s.key)} style={{ ...inputStyle, width: 80 }} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Display Options</div>
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                  {[
                    { label: "Show author name",    key: "show_author" },
                    { label: "Show published date", key: "show_date" },
                    { label: "Show view count",     key: "show_views" },
                    { label: "Show share buttons",  key: "show_share" },
                    { label: "Show related posts",  key: "show_related" },
                  ].map(s => (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" id={s.key} checked={(settings as any)[s.key] === "true"}
                        onChange={e => setSettings((prev: any) => ({ ...prev, [s.key]: e.target.checked ? "true" : "false" }))} />
                      <label htmlFor={s.key} style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>{s.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Sitemap</div>
                <p style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>
                  Your sitemap is automatically generated at:
                </p>
                <a href="/sitemap.xml" target="_blank" style={{ display: "block", padding: "10px 14px", background: "#111", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.gold, textDecoration: "none", fontFamily: "monospace", marginBottom: 12 }}>
                  alphaforexai.com/sitemap.xml
                </a>
                <p style={{ fontSize: 12, color: T.muted2, lineHeight: 1.6 }}>
                  Submit to Google Search Console and Bing Webmaster Tools. Includes all published blog posts, pages, and dynamic routes.
                </p>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ marginTop: 20, padding: "12px 28px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  return <AuthProvider><BlogAdminContent /></AuthProvider>;
}
