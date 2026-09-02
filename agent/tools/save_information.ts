import { defineTool } from "eve/tools";
import { z } from "zod";
import { findOrCreate, supabaseRequest } from "../lib/supabase.js";

export default defineTool({
  description: "Guarda información agronómica validada junto con su fuente, categoría, subtema y etiquetas en Supabase.",
  inputSchema: z.object({
    category: z.string().min(2),
    subtopic: z.string().min(2),
    source: z.object({ url: z.string().url(), title: z.string(), author: z.string().optional(), publisher: z.string().optional(), type: z.enum(["web", "academic", "pdf", "report", "video", "api", "book", "other"]).default("web") }),
    title: z.string().min(2),
    content: z.string().min(20),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    confidenceScore: z.number().min(0).max(1).default(0.7),
    validationStatus: z.enum(["unreviewed", "validated", "contradictory", "needs_review"]).default("unreviewed"),
  }),
  async execute(input) {
    const topic = await findOrCreate("topics", { name: "eq.Agronomía" }, { name: "Agronomía", description: "Base de conocimiento agronómico.", language: "es" });
    const category = await findOrCreate("categories", { topic_id: `eq.${topic.id}`, name: `eq.${input.category}` }, { topic_id: topic.id, name: input.category });
    const subtopic = await findOrCreate("subtopics", { category_id: `eq.${category.id}`, name: `eq.${input.subtopic}` }, { category_id: category.id, name: input.subtopic });
    const source = await findOrCreate("sources", { url: `eq.${input.source.url}` }, { source_type: input.source.type, title: input.source.title, url: input.source.url, author: input.source.author, publisher: input.source.publisher });
    const information = await supabaseRequest<Array<Record<string, unknown>>>("information", { method: "POST", body: { topic_id: topic.id, category_id: category.id, subtopic_id: subtopic.id, source_id: source.id, title: input.title, content: input.content, summary: input.summary, confidence_score: input.confidenceScore, validation_status: input.validationStatus }, prefer: "resolution=ignore-duplicates,return=representation" });
    const saved = information[0];
    for (const name of input.tags) {
      const tag = await findOrCreate("tags", { name: `eq.${name}` }, { name });
      if (saved?.id) await supabaseRequest("information_tags", { method: "POST", body: { information_id: saved.id, tag_id: tag.id }, prefer: "resolution=ignore-duplicates,return=minimal" });
    }
    return { saved: Boolean(saved), informationId: saved?.id, sourceId: source.id, category: input.category, subtopic: input.subtopic };
  },
});
