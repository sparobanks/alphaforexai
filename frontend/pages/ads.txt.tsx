import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // Fetch ads.txt content from site settings
  let content = "";
  try {
    const r = await fetch("https://alphaforexai.com/api/v1/auth/admin/settings");
    if (r.ok) {
      const data = await r.json();
      content = data.ads_txt_content || "";
    }
  } catch {}

  // Default placeholder if not set
  if (!content) {
    content = "# ads.txt - Manage this from your admin panel > Settings > Ads.txt\n# Add your ad network lines below\n# Example: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0";
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.write(content);
  res.end();
  return { props: {} };
};

export default function AdsTxt() { return null; }
