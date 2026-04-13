"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { Nav, Footer, T, GoldButton, AuthProvider, SeoHead } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";

const AD_SLOT_STYLE: React.CSSProperties = {
  background: "#111",
  border: `1px dashed #333`,
  borderRadius: 8,
  padding: "20px",
  textAlign: "center",
  color: "#444",
  fontSize: 12,
  margin: "24px 0",
  minHeight: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

function AdSlot({ label }: { label: string }) {
  return (
    <div style={AD_SLOT_STYLE}>
      <div>
        <div style={{ marginBottom: 4 }}>Advertisement</div>
        <div style={{ fontSize: 10, color: "#333" }}>{label}</div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: any }) {
  return (
    <a href={`/blog/${post.slug}`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color 0.2s", height: "100%" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold + "60")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
      >
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} style={{ width: "100%", height: 180, objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: 180, background: `linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, color: T.gold }}>◈</div>
        )}
        <div style={{ padding: "20px" }}>
          {post.category && (
            <span style={{ fontSize: 10, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{post.category}</span>
          )}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.white, margin: "8px 0 10px", lineHeight: 1.4, fontFamily: "Georgia, serif" }}>{post.title}</h2>
          {post.excerpt && <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.7, margin: "0 0 14px" }}>{post.excerpt.substring(0, 120)}{post.excerpt.length > 120 ? "..." : ""}</p>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: T.muted2 }}>
            <span>{post.author}</span>
            <span>{post.published_at ? new Date(post.published_at).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
          </div>
          {post.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 12 }}>
              {post.tags.slice(0, 3).map((tag: string) => (
                <span key={tag} style={{ background: "#1a1a1a", color: T.muted, fontSize: 10, padding: "2px 8px", borderRadius: 99 }}>{tag}</span>
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

  useEffect(() => {
    Promise.all([
      fetch(`${API}/blog/posts/categories`).then(r => r.json()),
      fetch(`${API}/blog/posts/tags`).then(r => r.json()),
      fetch(`${API}/blog/posts?featured=true&limit=1`).then(r => r.json()),
    ]).then(([cats, tgs, feat]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setTags(Array.isArray(tgs) ? tgs : []);
      if (feat?.posts?.length > 0) setFeatured(feat.posts[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (category) params.set("category", category);
    if (tag) params.set("tag", tag);
    if (search) params.set("search", search);
    fetch(`${API}/blog/posts?${params}`)
      .then(r => r.json())
      .then(data => {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [page, category, tag, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function clearFilters() {
    setCategory(""); setTag(""); setSearch(""); setSearchInput(""); setPage(1);
  }

  const hasFilter = category || tag || search;

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <SeoHead
        title="Forex Trading Blog"
        description="Expert forex trading insights, AI signal analysis, market education and trading strategies from AlphaForexAI."
        path="/blog"
      />
      <Nav />

      {/* Header */}
      <div style={{ padding: "64px 20px 48px", textAlign: "center", background: `radial-gradient(ellipse 60% 40% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 12 }}>BLOG</div>
        <h1 style={{ fontSize: 42, fontWeight: 700, fontFamily: "Georgia, serif", margin: "0 0 14px", letterSpacing: "-0.02em" }}>Forex Trading Insights</h1>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 500, margin: "0 auto 28px" }}>Market analysis, AI signal education, and trading strategies.</p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, maxWidth: 440, margin: "0 auto", justifyContent: "center" }}>
          <input
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="Search articles..."
            style={{ flex: 1, background: "#111", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, color: T.white, outline: "none" }}
          />
          <button type="submit" style={{ padding: "10px 20px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Search</button>
        </form>
      </div>

      {/* Ad slot - top of page */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
        <AdSlot label="Top Banner — 728x90" />
      </div>

      {/* Featured post */}
      {featured && !hasFilter && page === 1 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 32px" }}>
          <a href={`/blog/${featured.slug}`} style={{ textDecoration: "none", display: "block" }}>
            <div style={{ background: T.card, border: `1px solid ${T.gold}30`, borderRadius: 16, overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T.gold + "60")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.gold + "30")}
            >
              {featured.cover_image
                ? <img src={featured.cover_image} alt={featured.title} style={{ width: "100%", height: 280, objectFit: "cover" }} />
                : <div style={{ height: 280, background: `linear-gradient(135deg, #1a1400 0%, #0f0f0f 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: T.gold }}>◈</div>
              }
              <div style={{ padding: "36px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <span style={{ background: T.goldBg, color: T.gold, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Featured</span>
                  {featured.category && <span style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "3px 0" }}>{featured.category}</span>}
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: T.white, margin: "0 0 14px", lineHeight: 1.35, fontFamily: "Georgia, serif" }}>{featured.title}</h2>
                {featured.excerpt && <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, margin: "0 0 20px" }}>{featured.excerpt.substring(0, 160)}...</p>}
                <div style={{ fontSize: 12, color: T.muted2 }}>{featured.author} · {featured.published_at ? new Date(featured.published_at).toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" }) : ""}</div>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 64px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 32, alignItems: "start" }}>

        {/* Posts grid */}
        <div>
          {/* Filter bar */}
          {hasFilter && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 13, color: T.muted }}>Filtering by:</span>
              {category && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>{category}</span>}
              {tag && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>#{tag}</span>}
              {search && <span style={{ background: T.goldBg, color: T.gold, fontSize: 12, padding: "3px 10px", borderRadius: 99 }}>"{search}"</span>}
              <button onClick={clearFilters} style={{ fontSize: 12, color: T.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear</button>
              <span style={{ fontSize: 12, color: T.muted2, marginLeft: "auto" }}>{total} result{total !== 1 ? "s" : ""}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center" as const, padding: "64px", color: T.muted }}>Loading...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center" as const, padding: "64px", color: T.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
              <div>No posts found. {hasFilter && <button onClick={clearFilters} style={{ color: T.gold, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filters</button>}</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
                {posts.slice(0, 3).map(p => <PostCard key={p.id} post={p} />)}
              </div>

              {/* Mid-content ad slot */}
              {posts.length > 3 && <AdSlot label="In-feed Ad — 728x90" />}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {posts.slice(3).map(p => <PostCard key={p.id} post={p} />)}
              </div>
            </>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 32 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "8px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: page === 1 ? T.muted2 : T.white, cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 13 }}>
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ padding: "8px 14px", background: page === p ? T.gold : T.card, border: `1px solid ${page === p ? T.gold : T.border}`, borderRadius: 8, color: page === p ? T.black : T.white, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ padding: "8px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, color: page === pages ? T.muted2 : T.white, cursor: page === pages ? "not-allowed" : "pointer", fontSize: 13 }}>
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 72 }}>

          {/* Sidebar ad */}
          <div style={{ background: "#111", border: `1px dashed #333`, borderRadius: 8, padding: "20px", textAlign: "center", color: "#444", fontSize: 12, minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
            <div>Advertisement</div>
            <div style={{ fontSize: 10, color: "#333" }}>Sidebar — 300x250</div>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
              <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Categories</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {categories.map(c => (
                  <button key={c.name} onClick={() => { setCategory(category === c.name ? "" : c.name); setPage(1); }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, background: category === c.name ? T.goldBg : "transparent", border: `1px solid ${category === c.name ? T.gold + "40" : "transparent"}`, cursor: "pointer", width: "100%" }}>
                    <span style={{ fontSize: 13, color: category === c.name ? T.gold : T.muted }}>{c.name}</span>
                    <span style={{ fontSize: 11, color: T.muted2, background: "#1a1a1a", padding: "1px 7px", borderRadius: 99 }}>{c.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px" }}>
              <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {tags.map(t => (
                  <button key={t.name} onClick={() => { setTag(tag === t.name ? "" : t.name); setPage(1); }}
                    style={{ padding: "4px 12px", borderRadius: 99, border: `1px solid ${tag === t.name ? T.gold : T.border2}`, background: tag === t.name ? T.goldBg : "transparent", color: tag === t.name ? T.gold : T.muted, fontSize: 12, cursor: "pointer" }}>
                    #{t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "20px", textAlign: "center" as const }}>
            <div style={{ fontWeight: 700, color: T.gold, marginBottom: 8, fontSize: 15 }}>Get live signals</div>
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 16, lineHeight: 1.6 }}>Join AlphaForexAI and get AI-powered EUR/USD signals.</p>
            <a href="/register" style={{ display: "block", padding: "10px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Start Free</a>
          </div>

          {/* Second sidebar ad */}
          <div style={{ background: "#111", border: `1px dashed #333`, borderRadius: 8, padding: "20px", textAlign: "center" as const, color: "#444", fontSize: 12, minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" as const, gap: 4 }}>
            <div>Advertisement</div>
            <div style={{ fontSize: 10, color: "#333" }}>Sidebar — 300x250</div>
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
