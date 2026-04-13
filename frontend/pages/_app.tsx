import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { useEffect, useState } from "react";
import "../styles/globals.css";

const API = "https://alphaforexai.com/api/v1";

function extractScriptSrc(html: string): string[] {
  const matches = html.match(/src="([^"]+)"/g) || [];
  return matches.map(m => m.replace('src="', '').replace('"', ''));
}

export default function App({ Component, pageProps }: AppProps) {
  const [scripts, setScripts] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    fetch(`${API}/auth/admin/settings`)
      .then(r => r.json())
      .then(data => {
        if (data.header_scripts) {
          const srcs = extractScriptSrc(data.header_scripts);
          setScripts(srcs);
        }
        if (data.announcement) setAnnouncement(data.announcement);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large" />
      </Head>
      {scripts.map((src, i) => (
        <Script key={i} src={src} strategy="afterInteractive" crossOrigin="anonymous" />
      ))}
      {announcement && (
        <div style={{ background: "#c9a84c", color: "#000", padding: "10px 20px", textAlign: "center", fontSize: 13, fontWeight: 600, position: "sticky", top: 0, zIndex: 999 }}>
          {announcement}
        </div>
      )}
      <Component {...pageProps} />
      <div style={{ background: "#080808", borderTop: "1px solid #1a1a1a", padding: "16px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", fontSize: 12, color: "#aaa", lineHeight: 1.7, textAlign: "center" as const }}>
          <strong style={{ color: "#ddd" }}>Risk Warning:</strong> Trading forex involves significant risk of loss. AlphaForexAI signals are for informational purposes only and do not constitute financial advice. We are not FCA regulated. Past performance is not indicative of future results. 73-89% of retail investor accounts lose money trading CFDs.
        </div>
      </div>
    </>
  );
}
