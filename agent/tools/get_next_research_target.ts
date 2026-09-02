import { defineTool } from "eve/tools";
import { supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Selecciona el siguiente subtema de Agronomía pendiente de investigación.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  async execute() {
    const subtopics = await supabaseRequest<Array<Record<string, unknown>>>("subtopics", { query: { select: "id,name,category_id,status", status: "eq.pending", order: "sort_order.asc", limit: "1" } });
    if (!subtopics[0]) return { available: false, message: "No hay subtemas pendientes." };
    const category = await supabaseRequest<Array<Record<string, unknown>>>("categories", { query: { select: "id,name", id: `eq.${subtopics[0].category_id}`, limit: "1" } });
    return { available: true, subtopic: subtopics[0], category: category[0] ?? null };
  },
});
