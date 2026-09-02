import { defineTool } from "eve/tools";
import { z } from "zod";
import { agronomyContext } from "../lib/supabase.js";

export default defineTool({
  description: "Consulta el conocimiento agronómico guardado en Supabase antes de responder una pregunta.",
  inputSchema: z.object({ query: z.string().min(2), limit: z.number().int().min(1).max(20).default(8) }),
  async execute({ query, limit }) {
    const results = await agronomyContext(query, limit);
    console.log(`[Nexo] Supabase: ${results.length} resultados para "${query}".`);
    return { database: "Supabase", query, resultCount: results.length, results };
  },
});
