import { defineTool } from "eve/tools";
import { z } from "zod";

type Result = { title: string; url: string; snippet: string; source: string };

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function duckDuckGoHtmlSearch(query: string, limit: number): Promise<Result[]> {
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": "Mozilla/5.0 Nexo-Agronomy-Research/1.0" },
  });
  if (!response.ok) throw new Error(`DuckDuckGo HTML respondió ${response.status}.`);
  const html = await response.text();
  const results: Result[] = [];
  const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    let url = decodeHtml(match[1]);
    try {
      const parsed = new URL(url, "https://duckduckgo.com");
      url = parsed.searchParams.get("uddg") ?? url;
    } catch {
      continue;
    }
    const title = decodeHtml(match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    const snippet = decodeHtml(match[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (url.startsWith("http") && title) results.push({ title, url, snippet, source: "duckduckgo-html" });
    if (results.length >= limit) break;
  }
  return results;
}

async function duckDuckGoSearch(query: string, limit: number): Promise<Result[]> {
  const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
  if (!response.ok) throw new Error(`DuckDuckGo respondió ${response.status}.`);
  const data = await response.json() as { AbstractText?: string; AbstractURL?: string; Heading?: string; RelatedTopics?: Array<{ Text?: string; FirstURL?: string }> };
  const results: Result[] = [];
  if (data.AbstractURL) results.push({ title: data.Heading || query, url: data.AbstractURL, snippet: data.AbstractText ?? "", source: "duckduckgo" });
  for (const item of data.RelatedTopics ?? []) {
    if (item.FirstURL && item.Text) results.push({ title: item.Text.split(" - ")[0], url: item.FirstURL, snippet: item.Text, source: "duckduckgo" });
  }
  if (results.length > 0) return results.slice(0, limit);
  return duckDuckGoHtmlSearch(query, limit);
}

export default defineTool({
  description: "Busca fuentes confiables de agronomía en Internet. Prioriza universidades, gobiernos y organismos agrícolas.",
  inputSchema: z.object({ query: z.string().min(3), limit: z.number().int().min(1).max(10).default(5) }),
  async execute({ query, limit }): Promise<Result[]> {
    return duckDuckGoSearch(query, limit);
  },
});
