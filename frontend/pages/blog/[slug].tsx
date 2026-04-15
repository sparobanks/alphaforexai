"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Nav, Footer, T, AuthProvider } from "../../components/_layout";

const API_BASE = "https://alphaforexai.com/api/v1";

// ── Shortcode: [live_signals] ─────────────────────────────────────────────────
function LiveSignalsWidget() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/signals/public/live`)
      .then(r => r.json())
      .then(data => setSignals(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "16px", textAlign: "center" as const, color: T.muted, fontSize: 13 }}>Loading signals...</div>;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px", margin: "24px 0" }}>
      <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>
        ● Live Signals
      </div>
      {signals.length === 0 ? (
        <div style={{ fontSize: 13, color: T.muted, textAlign: "center" as const, padding: "12px" }}>No active signals right now</div>
      ) : signals.map(s => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${T.border}`, flexWrap: "wrap" as const }}>
          <span style={{ fontWeight: 700, color: s.direction === "BUY" ? T.green : T.red, fontSize: 13, minWidth: 36 }}>{s.direction}</span>
          <span style={{ fontWeight: 600, color: T.white, fontSize: 13 }}>{s.pair}</span>
          <span style={{ background: "#22c55e20", color: "#22c55e", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>● LIVE</span>
          <span style={{ fontSize: 12, color: T.muted, fontFamily: "monospace" }}>{s.entry_price?.toFixed(s.pair?.includes("XAU") || s.pair?.includes("JPY") ? 2 : 5)}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <div style={{ background: "#0f0f0f", borderRadius: 6, padding: "4px 10px", textAlign: "center" as const }}>
              <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase" as const }}>SL</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.red, filter: "blur(4px)", userSelect: "none" as const }}>1.2345</div>
            </div>
            <div style={{ background: "#0f0f0f", borderRadius: 6, padding: "4px 10px", textAlign: "center" as const }}>
              <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase" as const }}>TP</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.green, filter: "blur(4px)", userSelect: "none" as const }}>1.2345</div>
            </div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center" }}>
        <a href="/register" style={{ fontSize: 12, fontWeight: 700, color: T.black, background: `linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, padding: "7px 16px", borderRadius: 6, textDecoration: "none" }}>Get Full Signals Free</a>
        <a href="/dashboard" style={{ fontSize: 12, color: T.gold, background: T.goldBg, border: `1px solid ${T.gold}30`, padding: "7px 16px", borderRadius: 6, textDecoration: "none" }}>Dashboard →</a>
      </div>
    </div>
  );
}

// ── Shortcode: [recent_results] ────────────────────────────────────────────────
function RecentResultsWidget() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/signals/public/recent`)
      .then(r => r.json())
      .then(data => setSignals(Array.isArray(data) ? data.filter((s: any) => s.status !== "EXPIRED").slice(0, 10) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: "16px", textAlign: "center" as const, color: T.muted, fontSize: 13 }}>Loading results...</div>;

  const wins  = signals.filter(s => s.status === "TP_HIT").length;
  const total = signals.length;
  const pips  = signals.reduce((sum, s) => sum + (s.pnl_pips || 0), 0);
  const dp    = (pair: string) => pair?.includes("XAU") || pair?.includes("JPY") ? 2 : 5;

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px", margin: "24px 0" }}>
      <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 }}>
        Recent Signal Results
      </div>
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            { label: "Win Rate", value: `${Math.round((wins/total)*100)}%`, color: wins/total >= 0.5 ? T.green : T.red },
            { label: "Total Pips", value: `${pips > 0 ? "+" : ""}${Math.round(pips)}`, color: pips >= 0 ? T.green : T.red },
            { label: "Signals", value: `${total}`, color: T.muted },
          ].map(s => (
            <div key={s.label} style={{ background: "#0f0f0f", borderRadius: 8, padding: "10px", textAlign: "center" as const }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {signals.length === 0 ? (
        <div style={{ fontSize: 13, color: T.muted, textAlign: "center" as const }}>No closed signals yet</div>
      ) : signals.map((s, i) => {
        const isWin = s.status === "TP_HIT";
        const color = isWin ? T.green : T.red;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < signals.length-1 ? `1px solid ${T.border}` : "none", flexWrap: "wrap" as const }}>
            <span style={{ fontWeight: 700, color: s.direction === "BUY" ? T.green : T.red, fontSize: 12, minWidth: 32 }}>{s.direction}</span>
            <span style={{ fontWeight: 600, color: T.white, fontSize: 12 }}>{s.pair}</span>
            <span style={{ background: color + "20", color, fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 99 }}>{isWin ? "✓ TP" : "✗ SL"}</span>
            <span style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>{s.entry_price?.toFixed(dp(s.pair))}</span>
            <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 12, color }}>{isWin ? "+" : ""}{s.pnl_pips}p</span>
          </div>
        );
      })}
      <div style={{ marginTop: 12, textAlign: "center" as const }}>
        <a href="/register" style={{ fontSize: 12, color: T.gold, textDecoration: "none", fontWeight: 600 }}>Get live signals free →</a>
      </div>
    </div>
  );
}

// ── Shortcode processor ────────────────────────────────────────────────────────
function processShortcodes(html: string): { parts: Array<{ type: "html" | "live_signals" | "recent_results"; content: string }> } {
  const parts: Array<{ type: "html" | "live_signals" | "recent_results"; content: string }> = [];
  const regex = /\[(live_signals|recent_results)\]/g;
  let last = 0;
  let match;

  while ((match = regex.exec(html)) !== null) {
    if (match.index > last) {
      parts.push({ type: "html", content: html.slice(last, match.index) });
    }
    parts.push({ type: match[1] as "live_signals" | "recent_results", content: "" });
    last = match.index + match[0].length;
  }

  if (last < html.length) {
    parts.push({ type: "html", content: html.slice(last) });
  }

  return { parts };
}

const API = "https://alphaforexai.com/api/v1";

function AdSlot({ code, label }: { code?: string; label: string }) {
  if (code) return <div style={{ margin:"24px 0" }} dangerouslySetInnerHTML={{ __html: code }} />;
  return (
    <div style={{ background:"#0f0f0f", border:"1px dashed #2a2a2a", borderRadius:8, padding:"14px", textAlign:"center" as const, color:"#333", fontSize:11, margin:"20px 0", minHeight:70, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" as const, gap:3 }}>
      <div>Advertisement</div><div style={{ fontSize:9, color:"#222" }}>{label}</div>
    </div>
  );
}

function renderMarkdown(content: string): string {
  return content
    .replace(/\[AD_SLOT\]/g, "")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:700;color:#f5f4f0;margin:24px 0 10px;font-family:Georgia,serif">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:21px;font-weight:700;color:#f5f4f0;margin:32px 0 12px;font-family:Georgia,serif">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:700;color:#f5f4f0;margin:0 0 16px;font-family:Georgia,serif">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong style="color:#f5f4f0;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em style="color:#aaa">$1</em>')
    .replace(/`([^`]+)`/g,   '<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;color:#c9a84c">$1</code>')
    .replace(/^> (.+)$/gm,   '<blockquote style="border-left:3px solid #c9a84c;padding:12px 16px;margin:16px 0;background:#111;border-radius:0 8px 8px 0;color:#888;font-style:italic">$1</blockquote>')
    .replace(/^- (.+)$/gm,   '<li style="margin:6px 0;color:#888880;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g,'<ul style="margin:14px 0;padding-left:20px">$&</ul>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin:6px 0;color:#888880">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2" style="color:#c9a84c;text-decoration:underline;font-weight:500" target="_blank" rel="noopener">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0" />')
    .replace(/^(?!<[hulbipqci])(.*\S.*)$/gm,'<p style="margin:0 0 14px;color:#f0f0f0;line-height:1.8;font-size:16px">$1</p>')
    .replace(/\n{2,}/g,"");
}

function injectAds(html: string, adConfigs: Array<{ para: number; code: string }>): string {
  if (!adConfigs.length) return html;
  const active = adConfigs.filter(a => a.code && a.para > 0).sort((a,b) => a.para - b.para);
  if (!active.length) return html;

  // Split on closing block tags
  const blocks = html.split(/(?<=<\/p>|<\/h[1-6]>|<\/ul>|<\/ol>|<\/blockquote>)/g).filter(b => b.trim());
  const result: string[] = [];
  let adIdx = 0;

  blocks.forEach((block, i) => {
    result.push(block);
    const paraNum = i + 1;
    while (adIdx < active.length && active[adIdx].para === paraNum) {
      result.push(`<div style="margin:24px 0">${active[adIdx].code}</div>`);
      adIdx++;
    }
  });

  while (adIdx < active.length) {
    result.push(`<div style="margin:24px 0">${active[adIdx].code}</div>`);
    adIdx++;
  }

  return result.join("");
}

function PostContent() {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost]       = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [adCodes, setAdCodes] = useState<any>({});
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/admin/settings`)
      .then(r => r.json())
      .then(data => { setAdCodes(data); setSiteSettings(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/blog/posts/${slug}`)
      .then(r => { if(!r.ok) throw new Error("Not found"); return r.json(); })
      .then(data => {
        setPost(data);
        if (data.category) {
          fetch(`${API}/blog/posts?category=${encodeURIComponent(data.category)}&limit=4`)
            .then(r => r.json())
            .then(rel => setRelated((rel.posts||[]).filter((p:any) => p.slug !== data.slug).slice(0,3)));
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ minHeight:"100vh", background:T.black, display:"flex", alignItems:"center", justifyContent:"center", color:T.muted }}>Loading...</div>;

  if (notFound||!post) return (
    <div style={{ minHeight:"100vh", background:T.black, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column" as const, gap:12, fontFamily:"system-ui, sans-serif" }}>
      <div style={{ fontSize:40, color:T.gold }}>◎</div>
      <div style={{ fontSize:18, color:T.white }}>Post not found</div>
      <a href="/blog" style={{ color:T.gold, textDecoration:"none" }}>← Back to blog</a>
    </div>
  );

  const postUrl  = `https://alphaforexai.com/blog/${post.slug}`;
  const seoTitle = post.seo_title || post.title;
  const seoDesc  = post.seo_description || post.excerpt || "";
  const showShare   = siteSettings.blog_show_share !== "false";
  const showRelated = siteSettings.blog_show_related !== "false";
  const showAuthor  = siteSettings.blog_show_author !== "false";
  const showDate    = siteSettings.blog_show_date !== "false";
  const showViews   = siteSettings.blog_show_views !== "false";

  // Build in-content ad configs
  const inContentAds = [1,2,3,4,5]
    .map(n => ({ para: parseInt(adCodes[`blog_incontent_${n}_para`]||"0"), code: adCodes[`blog_incontent_${n}_code`]||"" }))
    .filter(a => a.code && a.para > 0);

  const renderedContent = injectAds(renderMarkdown(post.content||""), inContentAds);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": seoDesc,
    "author": {
      "@type": "Organization",
      "name": post.author || "AlphaForexAI",
      "url": "https://alphaforexai.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AlphaForexAI",
      "url": "https://alphaforexai.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://alphaforexai.com/logo.png",
        "width": 512,
        "height": 512
      }
    },
    "datePublished": post.published_at,
    "dateModified": post.updated_at || post.published_at,
    "url": postUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "image": post.cover_image && !post.cover_image.startsWith("data:")
      ? {
          "@type": "ImageObject",
          "url": post.cover_image,
          "width": 1200,
          "height": 630
        }
      : {
          "@type": "ImageObject",
          "url": "https://alphaforexai.com/og-default.png",
          "width": 1200,
          "height": 630
        },
    "keywords": Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags || "forex, trading, signals"),
    "articleSection": post.category || "Forex Trading",
    "inLanguage": "en-GB",
    "isAccessibleForFree": true,
  });

  return (
    <div style={{ background:T.black, color:T.white, minHeight:"100vh", fontFamily:"system-ui, sans-serif" }}>
      <Head>
        <title>{seoTitle} | AlphaForexAI Blog</title>
        <meta name="description" content={seoDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:url" content={postUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="AlphaForexAI" />
        <meta property="og:locale" content="en_GB" />
        <meta property="og:image" content={post.cover_image && !post.cover_image.startsWith("data:") ? post.cover_image : "https://alphaforexai.com/og-default.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="article:published_time" content={post.published_at} />
        <meta property="article:modified_time" content={post.updated_at||post.published_at} />
        <meta property="article:author" content={post.author||"AlphaForexAI"} />
        {post.category && <meta property="article:section" content={post.category} />}
        {post.tags?.map((t:string) => <meta key={t} property="article:tag" content={t} />)}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDesc} />
        <meta name="twitter:image" content={post.cover_image && !post.cover_image.startsWith("data:") ? post.cover_image : "https://alphaforexai.com/og-default.png"} />
        <link rel="canonical" href={postUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </Head>
      <Nav />

      <div style={{ maxWidth:760, margin:"0 auto", padding:"0 16px" }}>
        <AdSlot code={adCodes.blog_ad_top_banner} label="Top Banner" />

        <nav style={{ fontSize:12, color:T.muted2, marginBottom:20, display:"flex", gap:5, flexWrap:"wrap" as const }}>
          <a href="/" style={{ color:T.muted2, textDecoration:"none" }}>Home</a><span>/</span>
          <a href="/blog" style={{ color:T.muted2, textDecoration:"none" }}>Blog</a>
          {post.category && <><span>/</span><a href={`/blog?category=${encodeURIComponent(post.category)}`} style={{ color:T.muted2, textDecoration:"none" }}>{post.category}</a></>}
          <span>/</span><span style={{ color:T.muted }}>{post.title.substring(0,35)}{post.title.length>35?"...":""}</span>
        </nav>

        {post.cover_image && (
          <img src={post.cover_image} alt={post.title} style={{ width:"100%", borderRadius:12, marginBottom:24, maxHeight:380, objectFit:"cover" as const }} />
        )}

        <header style={{ marginBottom:24 }}>
          {post.category && <a href={`/blog?category=${encodeURIComponent(post.category)}`} style={{ fontSize:11, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.08em", textDecoration:"none" }}>{post.category}</a>}
          <h1 style={{ fontSize:30, fontWeight:700, fontFamily:"Georgia, serif", margin:"8px 0 12px", lineHeight:1.25 }}>{post.title}</h1>
          {post.excerpt && <p style={{ fontSize:16, color:T.muted, lineHeight:1.7, margin:"0 0 14px", fontStyle:"italic" }}>{post.excerpt}</p>}
          <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:T.muted2, flexWrap:"wrap" as const }}>
            {showAuthor && <span>{post.author}</span>}
            {showDate && post.published_at && <span>{new Date(post.published_at).toLocaleDateString("en-GB",{year:"numeric",month:"long",day:"numeric"})}</span>}
            {showViews && <span>{post.views} views</span>}
          </div>
          {post.tags?.length > 0 && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const, marginTop:12 }}>
              {post.tags.map((t:string) => <a key={t} href={`/blog?tag=${encodeURIComponent(t)}`} style={{ padding:"3px 10px", borderRadius:99, border:`1px solid ${T.border2}`, color:T.muted, fontSize:11, textDecoration:"none" }}>#{t}</a>)}
            </div>
          )}
        </header>

        <hr style={{ border:"none", borderTop:`1px solid ${T.border}`, marginBottom:24 }} />

        <AdSlot code={adCodes.blog_ad_before_post} label="Before Post" />

        {(() => {
          const { parts } = processShortcodes(renderedContent);
          return parts.map((part, i) => {
            if (part.type === "live_signals")   return <LiveSignalsWidget key={i} />;
            if (part.type === "recent_results") return <RecentResultsWidget key={i} />;
            return (
              <div key={i}>
                <style>{`
                  .blog-content a { color: #c9a84c !important; text-decoration: underline; font-weight: 500; }
                  .blog-content a:hover { color: #e8c97e !important; }
                `}</style>
                <div className="blog-content" style={{ fontSize:16, lineHeight:1.8, color:T.white }} dangerouslySetInnerHTML={{ __html: part.content }} />
              </div>
            );
          });
        })()}

        <AdSlot code={adCodes.blog_ad_after_post} label="After Post" />

        {showShare && (
          <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:24, marginTop:8 }}>
            <div style={{ fontSize:13, color:T.muted, marginBottom:10 }}>Share:</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
              {[
                { label:"Twitter/X", url:`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(postUrl)}` },
                { label:"Facebook",  url:`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}` },
                { label:"Telegram",  url:`https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.title)}` },
                { label:"WhatsApp",  url:`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title+" "+postUrl)}` },
                { label:"LinkedIn",  url:`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(post.title)}` },
              ].map(s => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" style={{ padding:"7px 14px", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.muted, textDecoration:"none" }}>{s.label}</a>)}
            </div>
          </div>
        )}

        <div style={{ background:T.goldBg, border:`1px solid ${T.gold}30`, borderRadius:12, padding:"24px 20px", marginTop:28, textAlign:"center" as const }}>
          <div style={{ fontWeight:700, fontSize:17, color:T.gold, fontFamily:"Georgia, serif", marginBottom:8 }}>Ready to trade with AI signals?</div>
          <p style={{ fontSize:14, color:T.muted, marginBottom:16, lineHeight:1.6 }}>Live EUR/USD signals with full entry, SL & TP. Free to start.</p>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" as const }}>
            <a href="/register" style={{ padding:"10px 22px", background:`linear-gradient(135deg, ${T.gold} 0%, #e8c97e 100%)`, color:"#000", borderRadius:8, fontSize:14, fontWeight:700, textDecoration:"none" }}>Start Free</a>
            <a href="https://t.me/alphaforexai" target="_blank" rel="noopener noreferrer" style={{ padding:"10px 22px", background:"#0088cc", color:"#fff", borderRadius:8, fontSize:14, fontWeight:600, textDecoration:"none" }}>Join Telegram</a>
          </div>
        </div>
        <div style={{ height:48 }} />
      </div>

      {showRelated && related.length > 0 && (
        <div style={{ background:T.dark, borderTop:`1px solid ${T.border}`, padding:"36px 16px" }}>
          <div style={{ maxWidth:760, margin:"0 auto" }}>
            <div style={{ fontSize:11, color:T.gold, fontWeight:600, textTransform:"uppercase" as const, letterSpacing:"0.08em", marginBottom:16 }}>Related Articles</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
              {related.map(p => (
                <a key={p.id} href={`/blog/${p.slug}`} style={{ textDecoration:"none" }}>
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"16px" }}>
                    {p.cover_image && !p.cover_image.startsWith("data:") && <img src={p.cover_image} alt={p.title} style={{ width:"100%", height:80, objectFit:"cover" as const, borderRadius:6, marginBottom:10 }} />}
                    {p.category && <span style={{ fontSize:10, color:T.gold, fontWeight:600, textTransform:"uppercase" as const }}>{p.category}</span>}
                    <div style={{ fontSize:14, fontWeight:600, color:T.white, margin:"5px 0 6px", lineHeight:1.35, fontFamily:"Georgia, serif" }}>{p.title}</div>
                    <div style={{ fontSize:11, color:T.muted2 }}>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-GB") : ""}</div>
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
