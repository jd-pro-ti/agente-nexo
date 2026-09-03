import { defineTool } from "eve/tools";
import { z } from "zod";
import { enc, supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Busca primero en la base Supabase de Nexo información agronómica ya guardada.",
  inputSchema: z.object({ query: z.string().min(2), limit: z.number().int().min(1).max(6).default(5) }),
  async execute({ query, limit }) {
    const words = query.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}-]/gu, "")).filter((w) => w.length > 2).slice(0, 8);
    const or = words.flatMap((w) => [`title.ilike.*${w}*`, `summary.ilike.*${w}*`, `content.ilike.*${w}*`]).join(",");
    const rows = await supabaseRequest<Array<Record<string, unknown>>>("information", { method: "GET" }, `select=id,title,summary,content,information_type,obtained_at,source_id&or=(${or})&order=obtained_at.desc&limit=${limit}`);
    const results = rows.slice(0, 6).map((row) => ({ ...row, content: typeof row.content === "string" ? row.content.slice(0, 1800) : row.content, summary: typeof row.summary === "string" ? row.summary.slice(0, 700) : row.summary }));
    return { database: "Supabase", query, resultCount: results.length, results };
  },
});
