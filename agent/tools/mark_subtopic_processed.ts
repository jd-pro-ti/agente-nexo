import { defineTool } from "eve/tools";
import { z } from "zod";
import { supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Marca un subtema agronómico como procesado, pendiente o con error después de una investigación.",
  inputSchema: z.object({ subtopicId: z.string().uuid(), status: z.enum(["pending", "processed", "error"]), errorMessage: z.string().optional() }),
  async execute({ subtopicId, status, errorMessage }) {
    const rows = await supabaseRequest<Array<Record<string, unknown>>>("subtopics", { method: "PATCH", query: { id: `eq.${subtopicId}` }, body: { status, last_researched_at: status === "processed" ? new Date().toISOString() : undefined }, prefer: "return=representation" });
    return { updated: rows.length > 0, subtopicId, status, errorMessage };
  },
});
