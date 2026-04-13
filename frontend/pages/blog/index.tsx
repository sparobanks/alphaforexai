"use client";
import { useState, useEffect } from "react";
import { Nav, Footer, T, AuthProvider, SeoHead } from "../../components/_layout";

const API = "https://alphaforexai.com/api/v1";

function AdSlot({ label, code, height = 90 }: { label: string; code?: string; height?: number }) {
  if (code) return <div style={{ margin: "20px 0" }} dangerouslySetInnerHTML={{ __html: code }} />;
  return null;
}

function PostCard({ post }: { post: any }) {
  return (
    <a href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block", height: "100%" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" as const }}>
        {post.cover_image
          ? <img src={post.cover_image} alt={post.title} style={{ width: "100%", height: 180, objectFit: "cover" as const }} />
          : <div style={{ width: "100%", height: 140, background: `linear-gradient(135deg, #1a1400 0%, #111 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: T.gold }}>◈</div>
        }
        <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column" as const }}>
          {post.category && <span style={{ fontSize: 10, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 6 }}>{post.category}</span>}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.white, margin: "0 0 8px", lineHeight: 1.4, fontFamily: "Georgia, serif", flex: 1 }}>{post.title}</h2>
          {post.excerpt && <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 12px" }}>{post.excerpt.substring(0, 110)}{post.excerpt.length > 110 ? "..." : ""}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted2 }}>
            <span>{post.author}</span>
            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
          </div>
          {post.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginTop: 10 }}>
              {post.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} style={{ background: "#1a1a1a", color: T.muted, fontSize: 10, padding: "2px 7px", borderRadius: 99 }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function BlogContent() {
  const [posts, setPosts]           = useState<any[]>([]);
  const [featured, setFeatured]     = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [tags, setTags]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [pages, setPages]           = useState(1);
  const [category, setCategory]     = useState("");
  const [tag, setTag]               = useState("");
  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading]       = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [adCodes, setAdCodes] = useState<any>({});
  useEffect(() => {
    fetch("https://alphaforexai.com/api/v1/auth/admin/settings")
      .then(r => r.json()).then(data => setAdCodes(data)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/blog/posts/categories`).then(r => r.json()).catch(() => []),
      fetch(`${API}/blog/posts/tags`).then(r => r.json()).catch(() => []),
      fetch(`${API}/blog/posts?featured=true&limit=1`).then(r => r.json()).catch(() => ({})),
    ]).then(([cats, tgs, feat]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setTags(Array.isArray(tgs) ? tgs : []);
      if (feat?.posts?.length > 0) setFeatured(feat.posts[0]);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);
    fetch(`${API}/blog/posts?${params}`)
      .then(r => r.json())
      .then(data => { setPosts(data.posts || []); setTotal(data.total || 0); setPages(data.pages || 1); })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page, category, tag, search]);

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearch(searchInput); setPage(1); }
  function clearFilters() { setCategory(""); setTag(""); setSearch(""); setSearchInput(""); setPage(1); }
  const hasFilter = !!(category || tag || search);

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <SeoHead title="Forex Trading Blog" description="Expert forex trading insights, AI signal analysis, market education and trading strategies from AlphaForexAI." path="/blog" />
      <Nav />

      {/* Header */}
      <div style={{ padding: "48px 20px 36px", textAlign: "center" as const, background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 10 }}>BLOG</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 12px" }}>Forex Trading Insights</h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 480, margin: "0 auto 24px" }}>Market analysis, AI signals, and trading strategies.</p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 400, margin: "0 auto" }}>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search articles..."
            style={{ flex: 1, background: "#111", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: T.white, outline: "none" }} />
          <button type="submit" style={{ padding: "10px 18px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Search</button>
        </form>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
        <AdSlot label="Top Banner" code={adCodes.blog_ad_top_banner} />
      </div>

      {/* Featured post - hidden on very small screens */}
      {featured && !hasFilter && page === 1 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 24px" }}>
          <a href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ background: T.card, border: `1px solid ${T.gold}30`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr" }}>
                {featured.cover_image && <img src={featured.cover_image} alt={featured.title} style={{ width: "100%", height: 200, objectFit: "cover" as const }} />}
                <div style={{ padding: "24px 20px" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" as const }}>
                    <span style={{ background: T.goldBg, color: T.gold, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" as const }}>Featured</span>
                    {featured.category && <span style={{ fontSize: 10, color: T.muted, padding: "3px 0" }}>{featured.category}</span>}
                  </div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: T.white, margin: "0 0 10px", fontFamily: "Georgia, serif", lineHeight: 1.3 }}>{featured.title}</h2>
                  {featured.excerpt && <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.6, margin: "0 0 12px" }}>{featured.excerpt.substring(0, 140)}...</p>}
                  <div style={{ fontSize: 12, color: T.muted2 }}>{featured.author} · {featured.published_at ? new Date(featured.published_at).toLocaleDateString("en-GB") : ""}</div>
                </div>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Layout: posts + sidebar */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 48px" }}>

        {/* Mobile filter toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" as const }}>
          <button onClick={() => setShowSidebar(s => !s)}
            style={{ padding: "8px 14px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, cursor: "pointer" }}>
            {showSidebar ? "Hide" : "☰ Filters & Categories"}
          </button>
          {hasFilter && (
            <>
              {category && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "6px 10px", borderRadius: 8 }}>{category}</span>}
              {tag && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "6px 10px", borderRadius: 8 }}>#{tag}</span>}
              {search && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "6px 10px", borderRadius: 8 }}>"{search}"</span>}
              <button onClick={clearFilters} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear</button>
            </>
          )}
          <span style={{ fontSize: 12, color: T.muted2, marginLeft: "auto", alignSelf: "center" }}>{total} article{total !== 1 ? "s" : ""}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: showSidebar ? "1fr" : "1fr", gap: 24 }}>

          {/* Sidebar - shown when toggled on mobile, always on desktop via media */}
          {showSidebar && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
              {categories.length > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>Categories</div>
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                    {categories.map(c => (
                      <button key={c.name} onClick={() => { setCategory(category === c.name ? "" : c.name); setPage(1); setShowSidebar(false); }}
                        style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", borderRadius: 8, background: category === c.name ? T.goldBg : "transparent", border: `1px solid ${category === c.name ? T.gold + "40" : "transparent"}`, cursor: "pointer", width: "100%" }}>
                        <span style={{ fontSize: 13, color: category === c.name ? T.gold : T.muted }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: T.muted2 }}>{c.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {tags.length > 0 && (
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>Tags</div>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                    {tags.map(t => (
                      <button key={t.name} onClick={() => { setTag(tag === t.name ? "" : t.name); setPage(1); setShowSidebar(false); }}
                        style={{ padding: "4px 10px", borderRadius: 99, border: `1px solid ${tag === t.name ? T.gold : T.border2}`, background: tag === t.name ? T.goldBg : "transparent", color: tag === t.name ? T.gold : T.muted, fontSize: 11, cursor: "pointer" }}>
                        #{t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Posts */}
          <div>
            {loading ? (
              <div style={{ textAlign: "center" as const, padding: "48px", color: T.muted }}>Loading...</div>
            ) : posts.length === 0 ? (
              <div style={{ textAlign: "center" as const, padding: "48px", color: T.muted }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
                <div>No posts found.{" "}{hasFilter && <button onClick={clearFilters} style={{ color: T.gold, background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>}</div>
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
                  {posts.slice(0, 3).map(p => <PostCard key={p.id} post={p} />)}
                </div>
                {posts.length > 3 && <AdSlot label="In-feed" code={adCodes.blog_ad_in_feed} />}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {posts.slice(3).map(p => <PostCard key={p.id} post={p} />)}
                </div>
              </>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 28, flexWrap: "wrap" as const }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "8px 14px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: page === 1 ? T.muted2 : T.white, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13 }}>← Prev</button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "8px 12px", background: page === p ? T.gold : T.card, border: `1px solid ${page === p ? T.gold : T.border}`, borderRadius: 8, color: page === p ? T.black : T.white, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400 }}>{p}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ padding: "8px 14px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: page === pages ? T.muted2 : T.white, cursor: page === pages ? "not-allowed" : "pointer", fontSize: 13 }}>Next →</button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "24px 20px", marginTop: 32, textAlign: "center" as const }}>
          <div style={{ fontWeight: 700, color: T.gold, marginBottom: 8, fontSize: 16 }}>Get live AI signals</div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>Join AlphaForexAI for EUR/USD signals with entry, SL & TP.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/register" style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Start Free</a>
            <a href="https://t.me/alphaforexai" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 20px", background: "#0088cc", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Join Telegram</a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function BlogPage() {
  return <AuthProvider><BlogContent /></AuthProvider>;
}
