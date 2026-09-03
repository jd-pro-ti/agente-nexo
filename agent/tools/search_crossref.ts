import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Busca metadatos de artículos científicos en Crossref, sin API key.",
  inputSchema: z.object({ query: z.string().min(3), limit: z.number().int().min(1).max(10).default(5) }),
  async execute({ query, limit }) {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${limit}&select=DOI,title,author,published,container-title,URL,type`;
    const response = await fetch(url, { headers: { "User-Agent": "Nexo-Agronomy-Research/1.0 (mailto:nexo@example.com)" } });
    if (!response.ok) throw new Error(`Crossref respondió ${response.status}.`);
    const data = await response.json() as { message?: { items?: Array<Record<string, any>> } };
    return (data.message?.items ?? []).map((item) => ({
      title: Array.isArray(item.title) ? item.title[0] : "",
      url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : ""),
      doi: item.DOI,
      year: item.published?.["date-parts"]?.[0]?.[0],
      authors: (item.author ?? []).slice(0, 5).map((a: any) => [a.given, a.family].filter(Boolean).join(" ")),
      journal: item["container-title"]?.[0],
      source: "crossref",
    }));
  },
});
