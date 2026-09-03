import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Busca artículos y trabajos académicos de agronomía en OpenAlex, sin API key.",
  inputSchema: z.object({ query: z.string().min(3), limit: z.number().int().min(1).max(10).default(5) }),
  async execute({ query, limit }) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&filter=is_oa:true&per-page=${limit}&select=id,doi,title,publication_year,authorships,primary_location,open_access,cited_by_count`;
    const response = await fetch(url, { headers: { "User-Agent": "Nexo-Agronomy-Research/1.0" } });
    if (!response.ok) throw new Error(`OpenAlex respondió ${response.status}.`);
    const data = await response.json() as { results?: Array<Record<string, any>> };
    return (data.results ?? []).map((item) => ({
      title: item.title ?? "",
      url: item.doi ?? item.primary_location?.landing_page_url ?? item.id,
      year: item.publication_year,
      authors: (item.authorships ?? []).slice(0, 5).map((a: any) => a.author?.display_name).filter(Boolean),
      journal: item.primary_location?.source?.display_name,
      openAccess: item.open_access?.is_oa ?? false,
      citations: item.cited_by_count ?? 0,
      source: "openalex",
    }));
  },
});
