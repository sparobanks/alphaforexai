import { GetServerSideProps } from "next";

const SITE = "https://alphaforexai.com";
const API  = "https://alphaforexai.com/api/v1";

const STATIC_PAGES = [
  { url: "/",        priority: "1.0", changefreq: "daily" },
  { url: "/pricing", priority: "0.9", changefreq: "weekly" },
  { url: "/blog",    priority: "0.9", changefreq: "daily" },
  { url: "/about",   priority: "0.7", changefreq: "monthly" },
  { url: "/contact", priority: "0.6", changefreq: "monthly" },
  { url: "/terms",   priority: "0.3", changefreq: "yearly" },
  { url: "/privacy", priority: "0.3", changefreq: "yearly" },
];

function esc(s: string) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function toISO(dateStr: string | null): string {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toISOString().replace(/\.\d{3}Z$/, "+00:00");
  } catch {
    return new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");
  }
}

function gen(posts: any[]): string {
  const today = toISO(null);

  const staticUrls = STATIC_PAGES.map(p =>
    `  <url><loc>${SITE}${p.url}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  ).join("\n");

  const postUrls = posts.map(p => {
    const date = toISO(p.published_at);
    const image = p.cover_image && !p.cover_image.startsWith("data:")
      ? `<image:image><image:loc>${esc(p.cover_image)}</image:loc><image:title>${esc(p.title)}</image:title></image:image>`
      : "";
    return `  <url><loc>${SITE}/blog/${esc(p.slug)}</loc><lastmod>${date}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${image}</url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${staticUrls}
${postUrls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let posts: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const r = await fetch(`${API}/blog/posts?limit=50&page=${page}`);
      if (!r.ok) break;
      const d = await r.json();
      const batch = d.posts || [];
      posts = [...posts, ...batch];
      hasMore = batch.length === 50 && page < d.pages;
      page++;
    } catch { break; }
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.write(gen(posts));
  res.end();
  return { props: {} };
};

export default function Sitemap() { return null; }
