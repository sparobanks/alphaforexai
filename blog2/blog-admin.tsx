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
};

function slugify(t: string) {
  return t.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// Simple visual editor toolbar
function VisualToolbar({ onInsert }: { onInsert: (before: string, after: string) => void }) {
  const tools = [
    { label: "B",     style: { fontWeight: 800 }, before: "**", after: "**" },
    { label: "I",     style: { fontStyle: "italic" }, before: "*", after: "*" },
    { label: "H2",    style: { fontSize: 11 }, before: "\n## ", after: "\n" },
    { label: "H3",    style: { fontSize: 11 }, before: "\n### ", after: "\n" },
    { label: "›",     style: {}, before: "\n> ", after: "\n" },
    { label: "—",     style: {}, before: "\n- ", after: "\n" },
    { label: "</>",   style: { fontFamily: "monospace", fontSize: 11 }, before: "`", after: "`" },
    { label: "Link",  style: { fontSize: 11 }, before: "[", after: "](url)" },
    { label: "Img",   style: { fontSize: 11 }, before: "![alt](", after: ")" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, padding: "8px 10px", background: "#111", borderRadius: "8px 8px 0 0", borderBottom: `1px solid ${T.border}` }}>
      {tools.map(t => (
        <button key={t.label} type="button" onClick={() => onInsert(t.before, t.after)}
          style={{ padding: "4px 9px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 12, color: T.muted, cursor: "pointer", ...t.style }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function BlogAdminContent() {
  const [authed, setAuthed]   = useState(false);
  const [key, setKey]         = useState("");
  const [posts, setPosts]     = useState<any[]>([]);
  const [total, setTotal]     = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState<any>({ ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState("");
  const [editorMode, setEditorMode] = useState<"markdown" | "preview">("markdown");
  const [filter, setFilter]   = useState("all");
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [uploadLoading, setUploadLoading] = useState(false);
  const textareaRef           = useRef<HTMLTextAreaElement>(null);
  const fileRef               = useRef<HTMLInputElement>(null);

  useEffect(() => { if (authed) fetchPosts(); }, [authed, filter]);

  async function fetchPosts() {
    const params = filter !== "all" ? `?status=${filter}` : "";
    try {
      const res  = await fetch(`${API}/blog/admin/posts${params}`, { headers: authHeaders() });
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch { setMsg("Error loading posts"); }
  }

  function set(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value })); }
  function setCheck(k: string) { return (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.checked })); }

  function insertMarkdown(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const text  = form.content || "";
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    setForm((f: any) => ({ ...f, content: newText }));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg("Image must be under 5MB"); return; }
    setUploadLoading(true);
    try {
      // Convert to base64 and store as data URL (simple approach)
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setForm((f: any) => ({ ...f, cover_image: dataUrl }));
        setUploadLoading(false);
        setMsg("✓ Image loaded — save post to apply");
      };
      reader.readAsDataURL(file);
    } catch { setMsg("Upload failed"); setUploadLoading(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) { setMsg("Title is required"); return; }
    setLoading(true);
    const payload = { ...form, slug: form.slug || slugify(form.title), tags: form.tags };
    try {
      const url    = editing ? `${API}/blog/admin/posts/${editing.id}` : `${API}/blog/admin/posts`;
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data   = await res.json();
      if (data.id) {
        setMsg(`✓ Post ${editing ? "updated" : "created"}: ${data.title}`);
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
    setMsg(`✓ Deleted`);
    fetchPosts();
  }

  function startEdit(post: any) {
    setForm({ ...post, tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "" });
    setEditing(post); setCreating(false); setEditorMode("markdown");
  }

  const inputStyle: any = { background: "#0f0f0f", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, color: T.white, outline: "none", width: "100%", boxSizing: "border-box" };
  const labelStyle: any = { fontSize: 11, color: T.muted, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 5 };

  function renderPreview(md: string) {
    return md
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
      <div style={{ background: T.dark, borderBottom: `1px solid ${T.border}`, padding: "0 16px", display: "flex", alignItems: "center", height: 54, gap: 12, flexWrap: "wrap" as const }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: T.white }}>Blog Admin</div>
        <div style={{ flex: 1 }} />
        <a href="/admin" style={{ fontSize: 12, color: T.muted, textDecoration: "none" }}>← Admin</a>
        <a href="/blog" target="_blank" style={{ fontSize: 12, color: T.gold, textDecoration: "none" }}>View Blog ↗</a>
        {!showForm && (
          <button onClick={() => { setCreating(true); setEditing(null); setForm({ ...EMPTY }); setEditorMode("markdown"); }}
            style={{ padding: "7px 16px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            + New Post
          </button>
        )}
      </div>

      {msg && (
        <div style={{ background: msg.startsWith("✓") ? "#0a1a0a" : "#1a0a0a", padding: "10px 16px", fontSize: 13, color: msg.startsWith("✓") ? "#22c55e" : "#f87171", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between" }}>
          <span>{msg}</span>
          <button onClick={() => setMsg("")} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>✕</button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>

        {showForm && (
          <form onSubmit={handleSave}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: T.white }}>{editing ? "Edit Post" : "New Post"}</div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 4 }}>
                {(["markdown", "preview"] as const).map(m => (
                  <button key={m} type="button" onClick={() => setEditorMode(m)}
                    style={{ padding: "6px 14px", background: editorMode === m ? T.goldBg : T.card, border: `1px solid ${editorMode === m ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 12, color: editorMode === m ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                    {m}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => { setEditing(null); setCreating(false); setForm({ ...EMPTY }); }}
                style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ padding: "7px 18px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Saving..." : editing ? "Update" : "Publish"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
              {/* On wider screens use side-by-side layout via auto grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>

                {/* Main content */}
                <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column" as const, gap: 14 }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Title *</label>
                        <input value={form.title} onChange={e => { set("title")(e); if (!editing) setForm((f: any) => ({ ...f, slug: slugify(e.target.value) })); }} required style={inputStyle} placeholder="Post title..." />
                      </div>
                      <div>
                        <label style={labelStyle}>Slug (URL)</label>
                        <input value={form.slug} onChange={set("slug")} style={inputStyle} placeholder="auto-from-title" />
                      </div>
                      <div>
                        <label style={labelStyle}>Excerpt</label>
                        <textarea value={form.excerpt} onChange={set("excerpt")} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Short description..." />
                      </div>
                    </div>
                  </div>

                  {/* Content editor */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
                    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Content</span>
                      <span style={{ fontSize: 11, color: T.muted2 }}>Markdown supported</span>
                    </div>
                    {editorMode === "markdown" ? (
                      <>
                        <VisualToolbar onInsert={insertMarkdown} />
                        <textarea
                          ref={textareaRef}
                          value={form.content} onChange={set("content")} rows={18}
                          style={{ ...inputStyle, borderRadius: "0 0 12px 12px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, resize: "vertical" as const, border: "none" }}
                          placeholder={"# Your Title\n\nWrite your content here...\n\n## Section\n\nMore text...\n\n**Bold**, *italic*, `code`\n\n- List item\n\n> Quote"}
                        />
                      </>
                    ) : (
                      <div style={{ padding: "20px", minHeight: 300, fontSize: 15, lineHeight: 1.8, color: T.muted }}
                        dangerouslySetInnerHTML={{ __html: renderPreview(form.content || "<em style='color:#444'>Nothing to preview yet...</em>") }} />
                    )}
                  </div>

                  {/* SEO */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>SEO</div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
                      <div>
                        <label style={labelStyle}>SEO Title <span style={{ color: form.seo_title?.length > 60 ? "#f87171" : T.muted2 }}>({form.seo_title?.length || 0}/60)</span></label>
                        <input value={form.seo_title} onChange={set("seo_title")} style={inputStyle} placeholder={form.title} />
                      </div>
                      <div>
                        <label style={labelStyle}>Meta Description <span style={{ color: form.seo_description?.length > 160 ? "#f87171" : T.muted2 }}>({form.seo_description?.length || 0}/160)</span></label>
                        <textarea value={form.seo_description} onChange={set("seo_description")} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} placeholder={form.excerpt} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar settings */}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" id="featured" checked={form.featured} onChange={setCheck("featured")} />
                        <label htmlFor="featured" style={{ fontSize: 13, color: T.muted, cursor: "pointer" }}>Featured post ★</label>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Details</div>
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
                      <div>
                        <label style={labelStyle}>Author</label>
                        <input value={form.author} onChange={set("author")} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Cover image */}
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px" }}>
                    <div style={{ fontSize: 12, color: T.gold, fontWeight: 600, marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Cover Image</div>

                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {(["url", "upload"] as const).map(m => (
                        <button key={m} type="button" onClick={() => setImageMode(m)}
                          style={{ padding: "5px 12px", background: imageMode === m ? T.goldBg : "transparent", border: `1px solid ${imageMode === m ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 11, color: imageMode === m ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                          {m === "url" ? "URL" : "Upload"}
                        </button>
                      ))}
                    </div>

                    {imageMode === "url" ? (
                      <input value={form.cover_image?.startsWith("data:") ? "" : (form.cover_image || "")}
                        onChange={set("cover_image")} style={inputStyle} placeholder="https://example.com/image.jpg" />
                    ) : (
                      <div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadLoading}
                          style={{ width: "100%", padding: "10px", background: "#111", border: `2px dashed ${T.border}`, borderRadius: 8, color: T.muted, fontSize: 13, cursor: "pointer" }}>
                          {uploadLoading ? "Loading..." : "Click to select image (max 5MB)"}
                        </button>
                      </div>
                    )}

                    {form.cover_image && (
                      <div style={{ marginTop: 10 }}>
                        <img src={form.cover_image} alt="Cover preview" style={{ width: "100%", borderRadius: 8, maxHeight: 120, objectFit: "cover" as const }} />
                        <button type="button" onClick={() => setForm((f: any) => ({ ...f, cover_image: "" }))}
                          style={{ marginTop: 6, fontSize: 11, color: "#f87171", background: "none", border: "none", cursor: "pointer" }}>
                          Remove image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Posts list */}
        {!showForm && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: T.white }}>Posts ({total})</div>
              <div style={{ flex: 1 }} />
              {["all", "published", "draft"].map(s => (
                <button key={s} onClick={() => setFilter(s)}
                  style={{ padding: "5px 12px", background: filter === s ? T.goldBg : "transparent", border: `1px solid ${filter === s ? T.gold + "40" : T.border}`, borderRadius: 8, fontSize: 11, color: filter === s ? T.gold : T.muted, cursor: "pointer", textTransform: "capitalize" as const }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Mobile-friendly cards */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {posts.length === 0 ? (
                <div style={{ textAlign: "center" as const, padding: "48px", color: T.muted, background: T.card, borderRadius: 12 }}>
                  No posts yet — click "+ New Post" to create one
                </div>
              ) : posts.map(p => (
                <div key={p.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
                  {p.cover_image && <img src={p.cover_image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" as const, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 600, color: T.white, fontSize: 14 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: T.muted2, marginTop: 3 }}>
                      {p.category && <span style={{ marginRight: 8 }}>{p.category}</span>}
                      {p.published_at ? new Date(p.published_at).toLocaleDateString() : "Draft"}
                      {p.featured && <span style={{ marginLeft: 6, color: T.gold }}>★</span>}
                    </div>
                  </div>
                  <span style={{ background: p.status === "published" ? "#16a34a20" : "#1a1a1a", color: p.status === "published" ? "#22c55e" : T.muted, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99, textTransform: "capitalize" as const }}>
                    {p.status}
                  </span>
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
      </div>
    </div>
  );
}

export default function BlogAdminPage() {
  return <AuthProvider><BlogAdminContent /></AuthProvider>;
}
