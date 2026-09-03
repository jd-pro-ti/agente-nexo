import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Busca en DuckDuckGo sin API key. No usa Brave.",
  inputSchema: z.object({ query: z.string().min(3), limit: z.number().int().min(1).max(10).default(5) }),
  async execute({ query, limit }) {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Nexo/1.0" } });
    if (!response.ok) return { query, results: [], error: `DuckDuckGo HTTP ${response.status}` };
    const html = await response.text();
    const results = [...html.matchAll(/result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].slice(0, limit).map((m) => ({ url: m[1], title: m[2].replace(/<[^>]+>/g, "").trim() }));
    return { query, results };
  },
});
