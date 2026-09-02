import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Obtiene una ficha organizada de un cultivo o área agronómica desde la base de conocimiento.",
  inputSchema: z.object({ query: z.string().min(2) }),
  async execute({ query }) {
    const results = await supabaseRequest<Array<Record<string, unknown>>>("information", { query: { select: "title,summary,content,category_id,subtopic_id,source_id,confidence_score,validation_status", or: `(title.ilike.*${query}*,summary.ilike.*${query}*,content.ilike.*${query}*)`, limit: "30", order: "confidence_score.desc" } });
    return { query, count: results.length, information: results };
  },
});
