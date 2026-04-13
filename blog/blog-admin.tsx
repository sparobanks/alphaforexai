"use client";
import { useState, useEffect } from "react";
import { T, AuthProvider } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";
const ADMIN_PASSWORD = "forexai-admin-2026";

function authHeaders() {
  const t = typeof window !== "undefined" ? localStorage.getItem("token") : "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
}

const CATEGORIES = ["Market Analysis", "Trading Education", "AI & Technology", "Signal Review", "Forex Basics", "Strategy", "News & Events"];

const EMPTY_POST = {
  title: "", slug: "", excerpt: "", content: "", cover_image: "",
  author: "AlphaForexAI Team", category: "", tags: "",
  status: "draft", featured: false, seo_title: "", seo_description: "",
};

function BlogAdminContent() {
  const [authed, setAuthed]   = useState(false);
  const [key, setKey]         = useState("");
  const [posts, setPosts]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState<any>(EMPTY_POST);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");
  const [preview, setPreview] = useState(false);
  const [filter, setFilter]   = useState("all");

  useEffect(() => { if (authed) fetchPosts(); }, [authed, filter]);

  async function fetchPosts() {
    const params = filter !== "all" ? `?status=${filter}` : "";
    const res  = await fetch(`${API}/blog/admin/posts${params}`, { headers: authHeaders() });
    const data = await res.json();
    setPosts(data.posts || []);
    setTotal(data.total || 0);
  }

  function set(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value })); }
  function setCheck(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.checked })); }

  function autoSlug(title: string) {
    return title.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...form, slug: form.slug || autoSlug(form.title) };
    try {
      let res;
      if (editing) {
        res = await fetch(`${API}/blog/admin/posts/${editing.id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(payload) });
      } else {
        res = await fetch(`${API}/blog/admin/posts`, { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (data.id) {
        setMsg(`✓ Post ${editing ? "updated" : "created"}: ${data.title}`);
        setEditing(null); setCreating(false); setForm(EMPTY_POST);
        fetchPosts();
      } else {
        setMsg(`Error: ${data.detail || "Save failed"}`);
      }
    } catch { setMsg("Save failed"); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await fetch(`${API}/blog/admin/posts/${id}`, { method: "DELETE", headers: authHeaders() });
    setMsg(`✓ Deleted: ${title}`);
    fetchPosts();
  }

  function startEdit(post: any) {
    setForm({ ...post, tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "" });
    setEditing(post);
    setCreating(false);
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle: any = { fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "40px", width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.white, marginBottom: 20 }}>Blog Admin</div>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Admin password"
            onKeyDown={e => e.key === "Enter" && (key === ADMIN_PASSWORD ? setAuthed(true) : alert("Wrong"))}
            style={{ ...inputStyle, marginBottom: 12, padding: "12px" }} />
          <button onClick={() => key === ADMIN_PASSWORD ? setAuthed(true) : alert("Wrong password")}
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
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 24px", display: "flex", alignItems: "center", height: 54, gap: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: T.white }}>Blog Admin</div>
        <div style={{ flex: 1 }} />
        <a href="/admin" style={{ fontSize: 13, color: T.muted, textDecoration: "none" }}>← Main Admin</a>
        <a href="/blog" target="_blank" style={{ fontSize: 13, color: T.gold, textDecoration: "none" }}>View Blog ↗</a>
        {!showForm && (
          <button onClick={() => { setCreating(true); setEditing(null); setForm(EMPTY_POST); }}
            style={{ padding: "8px 18px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + New Post
          </button>
        )}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✓") ? "#0a1a0a" : "#1a0a0a", padding: "10px 24px", fontSize: 13, color: msg.startsWith("✓") ? "#22c55e" : "#f87171", borderBottom: `1px solid ${T.border}` }}>
          {msg} <button onClick={() => setMsg("")} style={{ marginLeft: 12, background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>dismiss</button>
        </div>
      )}

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>

        {/* Post form */}
        {showForm && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 16, color: T.white }}>{editing ? "Edit Post" : "New Post"}</div>
              <div style={{ flex: 1 }} />
              <button onClick={() => setPreview(p => !p)} style={{ padding: "7px 14px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer" }}>
                {preview ? "Edit" : "Preview"}
              </button>
              <button onClick={() => { setEditing(null); setCreating(false); setForm(EMPTY_POST); }}
                style={{ padding: "7px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer" }}>
                Cancel
              </button>
            </div>

            {preview ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "32px" }}>
                <h1 style={{ fontFamily: "Georgia, serif", fontSize: 32, marginBottom: 16, color: T.white }}>{form.title}</h1>
                {form.excerpt && <p style={{ fontSize: 16, color: T.muted, fontStyle: "italic", marginBottom: 24, lineHeight: 1.7 }}>{form.excerpt}</p>}
                <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, marginBottom: 24 }} />
                <div style={{ fontSize: 15, lineHeight: 1.8, color: T.muted }}
                  dangerouslySetInnerHTML={{ __html: (form.content || "").replace(/\n/g, "<br>") }} />
              </div>
            ) : (
              <form onSubmit={handleSave}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>

                  {/* Main */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                          <label style={labelStyle}>Title *</label>
                          <input value={form.title} onChange={e => { set("title")(e); if (!editing) setForm((f: any) => ({ ...f, slug: autoSlug(e.target.value) })); }} required style={inputStyle} placeholder="Your post title..." />
                        </div>
                        <div>
                          <label style={labelStyle}>Slug</label>
                          <input value={form.slug} onChange={set("slug")} style={inputStyle} placeholder="auto-generated-from-title" />
                        </div>
                        <div>
                          <label style={labelStyle}>Excerpt</label>
                          <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Short description shown in blog list..." />
                        </div>
                      </div>
                    </div>

                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                      <label style={labelStyle}>Content (Markdown supported)</label>
                      <textarea value={form.content} onChange={set("content")} rows={20}
                        style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 }}
                        placeholder={`# Heading\n\n## Subheading\n\nYour content here...\n\n**Bold text** and *italic text*\n\n- List item\n- Another item\n\n> Blockquote\n\n\`inline code\``}
                      />
                      <div style={{ fontSize: 11, color: T.muted2, marginTop: 6 }}>
                        Supports: # headings, **bold**, *italic*, \`code\`, &gt; blockquote, - lists, [link](url)
                      </div>
                    </div>

                    {/* SEO */}
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                      <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>SEO</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={labelStyle}>SEO Title (overrides post title in search)</label>
                          <input value={form.seo_title} onChange={set("seo_title")} style={inputStyle} placeholder={form.title} />
                          <div style={{ fontSize: 10, color: form.seo_title?.length > 60 ? "#f87171" : T.muted2, marginTop: 3 }}>{form.seo_title?.length || 0}/60 chars</div>
                        </div>
                        <div>
                          <label style={labelStyle}>Meta Description</label>
                          <textarea value={form.seo_description} onChange={set("seo_description")} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder={form.excerpt} />
                          <div style={{ fontSize: 10, color: form.seo_description?.length > 160 ? "#f87171" : T.muted2, marginTop: 3 }}>{form.seo_description?.length || 0}/160 chars</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                      <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Publish</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Status</label>
                          <select value={form.status} onChange={set("status")} style={inputStyle}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" id="featured" checked={form.featured} onChange={setCheck("featured")} />
                          <label htmlFor="featured" style={{ fontSize: 13, color: T.muted }}>Featured post</label>
                        </div>
                        <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                          {loading ? "Saving..." : editing ? "Update Post" : "Create Post"}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
                      <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                        <div>
                          <label style={labelStyle}>Author</label>
                          <input value={form.author} onChange={set("author")} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Cover image URL</label>
                          <input value={form.cover_image} onChange={set("cover_image")} style={inputStyle} placeholder="https://..." />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Posts list */}
        {!showForm && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.white }}>Posts ({total})</div>
              <div style={{ flex: 1 }} />
              {["all", "published", "draft"].map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", background: filter === s ? T.goldBg : "transparent", border: `1px solid ${filter === s ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 12, color: filter === s ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#111" }}>
                    {["Title", "Category", "Status", "Views", "Date", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 500, color: T.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: T.muted }}>No posts yet — click "+ New Post" to create one</td></tr>
                  ) : posts.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ fontWeight: 500, color: T.white }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: T.muted2 }}>/{p.slug}</div>
                      </td>
                      <td style={{ padding: "11px 14px", color: T.muted }}>{p.category || "—"}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: p.status === "published" ? "#16a34a20" : "#1a1a1a", color: p.status === "published" ? "#22c55e" : T.muted, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize" }}>
                          {p.status}
                        </span>
                        {p.featured && <span style={{ marginLeft: 6, background: T.goldBg, color: T.gold, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>★</span>}
                      </td>
                      <td style={{ padding: "11px 14px", color: T.muted }}>{p.views || 0}</td>
                      <td style={{ padding: "11px 14px", color: T.muted, fontSize: 11 }}>{p.published_at ? new Date(p.published_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(p)} style={{ padding: "4px 10px", background: T.goldBg, color: T.gold, border: `1px solid ${T.gold}40`, borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Edit</button>
                          {p.status === "published" && <a href={`/blog/${p.slug}`} target="_blank" style={{ padding: "4px 10px", background: "#0a1a0a", color: "#22c55e", border: "1px solid #166534", borderRadius: 6, fontSize: 11, textDecoration: "none" }}>View</a>}
                          <button onClick={() => handleDelete(p.id, p.title)} style={{ padding: "4px 10px", background: "#1a0a0a", color: "#f87171", border: "1px solid #3a1a1a", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  return <AuthProvider><BlogAdminContent /></AuthProvider>;
}
