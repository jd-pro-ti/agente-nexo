import { defineTool } from "eve/tools";
import { z } from "zod";
import { findOrCreate, supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Crea un trabajo de investigación agronómica con límites de fuentes y tokens.",
  inputSchema: z.object({ topic: z.string().default("Agronomía"), area: z.string().optional(), subtopic: z.string().optional(), sourcesLimit: z.number().int().min(1).max(5).default(3), tokensLimit: z.number().int().min(1000).max(50000).default(12000) }),
  async execute({ topic: topicName, area, subtopic, sourcesLimit, tokensLimit }) {
    const topic = await findOrCreate("topics", { name: `eq.${topicName}` }, { name: topicName, language: "es" });
    const jobs = await supabaseRequest<Array<Record<string, unknown>>>("research_jobs", { method: "POST", body: JSON.stringify({ topic_id: topic.id, requested_area: area, requested_subtopic: subtopic, status: "pending", sources_limit: sourcesLimit, tokens_limit: tokensLimit }) });
    return jobs[0] ?? { topicId: topic.id, status: "pending" };
  },
});
