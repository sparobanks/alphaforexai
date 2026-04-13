// pages/sitemap.xml.tsx
// Dynamic sitemap generator - auto-includes all blog posts + static pages

import { GetServerSideProps } from "next";

const SITE = "https://alphaforexai.com";
const API  = "https://alphaforexai.com/api/v1";

const STATIC_PAGES = [
  { url: "/",               priority: "1.0", changefreq: "daily" },
  { url: "/pricing",        priority: "0.9", changefreq: "weekly" },
  { url: "/blog",           priority: "0.9", changefreq: "daily" },
  { url: "/about",          priority: "0.7", changefreq: "monthly" },
  { url: "/contact",        priority: "0.6", changefreq: "monthly" },
  { url: "/terms",          priority: "0.3", changefreq: "yearly" },
  { url: "/privacy",        priority: "0.3", changefreq: "yearly" },
  { url: "/register",       priority: "0.8", changefreq: "monthly" },
  { url: "/login",          priority: "0.5", changefreq: "monthly" },
];

function generateSitemap(posts: any[]): string {
  const now = new Date().toISOString();

  const staticUrls = STATIC_PAGES.map(p => `
  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("");

  const postUrls = posts.map(p => `
  <url>
    <loc>${SITE}/blog/${p.slug}</loc>
    <lastmod>${p.published_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${p.cover_image && !p.cover_image.startsWith("data:") ? `
    <image:image>
      <image:loc>${p.cover_image}</image:loc>
      <image:title>${p.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</image:title>
    </image:image>` : ""}
  </url>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${staticUrls}
${postUrls}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  let posts: any[] = [];

  try {
    // Fetch all published posts for sitemap
    const response = await fetch(`${API}/blog/posts?limit=500&page=1`);
    if (response.ok) {
      const data = await response.json();
      posts = data.posts || [];
    }
  } catch (e) {
    console.error("Sitemap fetch error:", e);
  }

  const sitemap = generateSitemap(posts);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=59");
  res.write(sitemap);
  res.end();

  return { props: {} };
};

export default function Sitemap() { return null; }
