// Paragraph-based ad injection utility
// Used in blog post page to inject ads at specific paragraph positions

export interface InContentAdConfig {
  slot: number;      // 1-5
  paragraph: number; // which paragraph to insert after (1-based)
  code: string;      // ad HTML code
}

export function renderContentWithAds(
  content: string,
  adConfigs: InContentAdConfig[]
): string {
  if (!content) return "";

  // First render markdown to HTML
  const html = renderMarkdown(content);

  // Split into paragraphs/blocks
  const blocks = html.split(/(?<=<\/p>|<\/h[1-6]>|<\/ul>|<\/blockquote>)/g).filter(b => b.trim());

  if (adConfigs.length === 0 || blocks.length === 0) return html;

  // Sort ad configs by paragraph number
  const sorted = [...adConfigs].filter(a => a.code && a.paragraph > 0).sort((a, b) => a.paragraph - b.paragraph);

  const result: string[] = [];
  let adIndex = 0;

  blocks.forEach((block, i) => {
    result.push(block);
    const paragraphNum = i + 1;

    // Check if any ad should be inserted after this paragraph
    while (adIndex < sorted.length && sorted[adIndex].paragraph === paragraphNum) {
      result.push(`<div class="in-content-ad" style="margin:24px 0">${sorted[adIndex].code}</div>`);
      adIndex++;
    }
  });

  // Add any remaining ads at the end
  while (adIndex < sorted.length) {
    result.push(`<div class="in-content-ad" style="margin:24px 0">${sorted[adIndex].code}</div>`);
    adIndex++;
  }

  return result.join("");
}

function renderMarkdown(content: string): string {
  return content
    .replace(/\[AD_SLOT\]/g, "") // Remove legacy AD_SLOT markers
    .replace(/^### (.+)$/gm, '<h3 style="font-size:17px;font-weight:700;color:#f5f4f0;margin:24px 0 10px;font-family:Georgia,serif">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 style="font-size:21px;font-weight:700;color:#f5f4f0;margin:32px 0 12px;font-family:Georgia,serif">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 style="font-size:26px;font-weight:700;color:#f5f4f0;margin:0 0 16px;font-family:Georgia,serif">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f5f4f0;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g,    '<em style="color:#aaa">$1</em>')
    .replace(/`([^`]+)`/g,    '<code style="background:#1a1a1a;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;color:#c9a84c">$1</code>')
    .replace(/^> (.+)$/gm,    '<blockquote style="border-left:3px solid #c9a84c;padding:12px 16px;margin:16px 0;background:#111;border-radius:0 8px 8px 0;color:#888;font-style:italic">$1</blockquote>')
    .replace(/^- (.+)$/gm,    '<li style="margin:6px 0;color:#888880;padding-left:4px">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="margin:14px 0;padding-left:20px">$&</ul>')
    .replace(/^\d+\. (.+)$/gm,'<li style="margin:6px 0;color:#888880">$1</li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#c9a84c;text-decoration:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:16px 0" />')
    .replace(/^(?!<[hulbipqci])(.*\S.*)$/gm, '<p style="margin:0 0 14px;color:#888880;line-height:1.8;font-size:16px">$1</p>')
    .replace(/\n{2,}/g, "");
}
