"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Nav, Footer, T, GoldButton, AuthProvider, SeoHead } from "../components/_layout";

const API = "https://alphaforexai.com/api/v1";

function AdSlot({ label, height = 90 }: { label: string; height?: number }) {
  return (
    <div style={{
      background: "#111", border: "1px dashed #333", borderRadius: 8,
      padding: "16px", textAlign: "center" as const, color: "#444",
      fontSize: 12, margin: "28px 0", minHeight: height,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column" as const, gap: 4,
    }}>
      <div>Advertisement</div>
      <div style={{ fontSize: 10, color: "#333" }}>{label}</div>
    </div>
  );
}

function renderMarkdown(content: string): string {
  if (!content) return "";
  return content
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;color:#f5f4f0;margin:28px 0 12px;font-family:Georgia,serif">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:22px;font-weight:700;color:#f5f4f0;margin:36px 0 14px;font-family:Georgia,serif">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:28px;font-weight:700;color:#f5f4f0;margin:0 0 20px;font-family:Georgia,serif">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f5f4f0;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em>$1</em>')
    .replace(/`(.+?)`/g,      '<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;color:#c9a84c">$1</code>')
    .replace(/^\> (.+)$/gm,   '<blockquote style="border-left:3px solid #c9a84c;padding:12px 16px;margin:20px 0;background:#111;border-radius:0 8px 8px 0;color:#888880;font-style:italic">$1</blockquote>')
    .replace(/^\- (.+)$/gm,   '<li style="margin:6px 0;color:#888880;padding-left:4px">$1</li>')
    .replace(/(<li.*<\/li>\n?)+/g, '<ul style="margin:16px 0;padding-left:20px;list-style:disc">$&</ul>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin:6px 0;color:#888880">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#c9a84c;text-decoration:underline">$1</a>')
    .replace(/^(?!<[h|b|u|l|p|i|c])(.*\S.*)$/gm, '<p style="margin:0 0 16px;color:#888880;line-height:1.8;font-size:16px">$1</p>')
    .replace(/\n\n/g, "")
    .replace(/<\/p>\s*<p/g, "</p><p");
}

function PostContent() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost]           = useState<any>(null);
  const [related, setRelated]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/blog/posts/${slug}`)
      .then(r => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => {
        setPost(data);
        // Fetch related by category
        if (data.category) {
          fetch(`${API}/blog/posts?category=${encodeURIComponent(data.category)}&limit=3`)
            .then(r => r.json())
            .then(rel => setRelated((rel.posts || []).filter((p: any) => p.slug !== data.slug)));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: T.muted }}>Loading...</div>
    </div>
  );

  if (notFound || !post) return (
    <div style={{ minHeight: "100vh", background: T.black, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 48, color: T.gold }}>◎</div>
      <div style={{ fontSize: 20, color: T.white, fontFamily: "Georgia, serif" }}>Post not found</div>
      <a href="/blog" style={{ color: T.gold, textDecoration: "none" }}>← Back to blog</a>
    </div>
  );

  const postUrl = `https://alphaforexai.com/blog/${post.slug}`;
  const seoTitle = post.seo_title || post.title;
  const seoDesc  = post.seo_description || post.excerpt || "";

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": seoDesc,
    "author": { "@type": "Organization", "name": post.author || "AlphaForexAI" },
    "publisher": {
      "@type": "Organization",
      "name": "AlphaForexAI",
      "url": "https://alphaforexai.com",
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "url": postUrl,
    ...(post.cover_image ? { "image": post.cover_image } : {}),
  };

  return (
    <div style={{ background: T.black, color: T.white, minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <Head>
        <title>{seoTitle} | AlphaForexAI Blog</title>
        <meta name="description" content={seoDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AlphaForexAI" />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        {post.cover_image && <meta name="twitter:image" content={post.cover_image} />}
        <meta property="article:published_time" content={post.published_at} />
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags?.map((t: string) => <meta key={t} property="article:tag" content={t} />)}
        <link rel="canonical" href={postUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <Nav />

      {/* Top ad */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px" }}>
        <AdSlot label="Top Banner — 728x90" />
      </div>

      {/* Article */}
      <article style={{ maxWidth: 860, margin: "0 auto", padding: "0 20px 64px" }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 12, color: T.muted2, marginBottom: 28, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" as const }}>
          <a href="/" style={{ color: T.muted2, textDecoration: "none" }}>Home</a>
          <span>/</span>
          <a href="/blog" style={{ color: T.muted2, textDecoration: "none" }}>Blog</a>
          {post.category && <>
            <span>/</span>
            <a href={`/blog?category=${post.category}`} style={{ color: T.muted2, textDecoration: "none" }}>{post.category}</a>
          </>}
          <span>/</span>
          <span style={{ color: T.muted }}>{post.title.substring(0, 40)}{post.title.length > 40 ? "..." : ""}</span>
        </nav>

        {/* Cover */}
        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} style={{ width: "100%", borderRadius: 12, marginBottom: 32, maxHeight: 400, objectFit: "cover" }} />
        )}

        {/* Header */}
        <header style={{ marginBottom: 36 }}>
          {post.category && (
            <a href={`/blog?category=${post.category}`} style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", textDecoration: "none" }}>
              {post.category}
            </a>
          )}
          <h1 style={{ fontSize: 36, fontWeight: 700, fontFamily: "Georgia, serif", margin: "10px 0 16px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
            {post.title}
          </h1>
          {post.excerpt && <p style={{ fontSize: 18, color: T.muted, lineHeight: 1.7, margin: "0 0 20px", fontStyle: "italic" }}>{post.excerpt}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: T.muted2, flexWrap: "wrap" as const }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.goldBg, border: `1px solid ${T.gold}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: T.gold }}>
                {(post.author || "A")[0].toUpperCase()}
              </div>
              {post.author}
            </span>
            {post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</span>}
            <span>{post.views} views</span>
          </div>
          {post.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 16 }}>
              {post.tags.map((tag: string) => (
                <a key={tag} href={`/blog?tag=${tag}`} style={{ padding: "4px 12px", borderRadius: 99, border: `1px solid ${T.border2}`, color: T.muted, fontSize: 12, textDecoration: "none" }}>
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </header>

        <hr style={{ border: "none", borderTop: `1px solid ${T.border}`, marginBottom: 36 }} />

        {/* Before-post ad */}
        <AdSlot label="Before Post — 728x90" />

        {/* Content */}
        <div
          style={{ fontSize: 16, lineHeight: 1.8, color: T.muted }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || "") }}
        />

        {/* After-post ad */}
        <AdSlot label="After Post — 728x90" />

        {/* Share */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 28, marginTop: 12 }}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>Share this article:</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
            {[
              { label: "Twitter / X", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}` },
              { label: "Facebook",    url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}` },
              { label: "Telegram",    url: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}` },
              { label: "WhatsApp",    url: `https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " " + postUrl)}` },
            ].map(s => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12, color: T.muted, textDecoration: "none" }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: T.goldBg, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "28px", marginTop: 36, textAlign: "center" as const }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: T.gold, fontFamily: "Georgia, serif", marginBottom: 10 }}>
            Ready to trade with AI signals?
          </div>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 20, lineHeight: 1.7 }}>
            Join AlphaForexAI and get live EUR/USD signals with full entry, SL & TP levels.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const }}>
            <a href="/register" style={{ padding: "11px 24px", background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color: "#000", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>Start Free</a>
            <a href="https://t.me/alphaforexai" target="_blank" rel="noopener noreferrer" style={{ padding: "11px 24px", background: "#0088cc", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Join Telegram</a>
          </div>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div style={{ background: T.dark, borderTop: `1px solid ${T.border}`, padding: "48px 20px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 20 }}>Related Articles</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {related.map(p => (
                <a key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "18px" }}>
                    {p.category && <span style={{ fontSize: 10, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>{p.category}</span>}
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.white, margin: "6px 0 8px", lineHeight: 1.4, fontFamily: "Georgia, serif" }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: T.muted2 }}>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-GB") : ""}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function BlogPostPage() {
  return <AuthProvider><PostContent /></AuthProvider>;
}
