import { createHash } from "node:crypto";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { findOrCreate, supabaseRequest } from "../lib/supabase.js";

const input = z.object({
  topic: z.string().default("Agronomía"), category: z.string().min(2), subtopic: z.string().min(2),
  title: z.string().min(3), content: z.string().min(20), summary: z.string().min(5),
  sourceUrl: z.string().url(), sourceTitle: z.string().optional(), author: z.string().optional(),
  publishedAt: z.string().optional(), informationType: z.string().default("technical"), tags: z.array(z.string()).max(20).default([]),
});

export default defineTool({
  description: "OBLIGATORIO para investigaciones: guarda información agronómica verificada en Supabase. Debe llamarse después de leer cada fuente válida; evita duplicados por URL y contenido.",
  inputSchema: input,
  async execute(data) {
    const topic = await findOrCreate<Record<string, any>>("topics", { name: `eq.${data.topic}` }, { name: data.topic, language: "es" });
    const category = await findOrCreate<Record<string, any>>("categories", { topic_id: `eq.${topic.id}`, name: `eq.${data.category}` }, { topic_id: topic.id, name: data.category });
    const subtopic = await findOrCreate<Record<string, any>>("subtopics", { category_id: `eq.${category.id}`, name: `eq.${data.subtopic}` }, { category_id: category.id, name: data.subtopic });
    const hash = createHash("sha256").update(`${data.sourceUrl}\n${data.title}\n${data.content}`).digest("hex");
    const sources = await supabaseRequest<Record<string, any>[]>("sources", { method: "GET" }, `select=id&url=eq.${encodeURIComponent(data.sourceUrl)}&limit=1`);
    // La instalación existente exige al menos título, tipo y URL en sources.
    // No enviamos metadatos opcionales porque sus nombres cambian entre esquemas.
    const source = sources[0] ?? (await supabaseRequest<Record<string, any>[]>("sources", { method: "POST", body: JSON.stringify({ source_type: "web", title: data.sourceTitle ?? data.title, url: data.sourceUrl }) }))[0];
    const existing = await supabaseRequest<Record<string, any>[]>("information", { method: "GET" }, `select=id,title,content_hash&source_id=eq.${source.id}&limit=20`).catch(() => []);
    if (existing.some((row) => row.title === data.title || row.content_hash === hash)) return { saved: false, duplicate: true, reason: "title-or-content" };
    const rows = await supabaseRequest<Record<string, any>[]>("information", { method: "POST", body: JSON.stringify({ subtopic_id: subtopic.id, source_id: source.id, title: data.title, content: data.content, summary: data.summary, information_type: data.informationType, obtained_at: new Date().toISOString(), content_hash: hash }) });
    const info = rows[0];
    for (const tagName of data.tags) {
      const tag = await findOrCreate<Record<string, any>>("tags", { name: `eq.${encodeURIComponent(tagName)}` }, { name: tagName });
      await supabaseRequest("information_tags", { method: "POST", body: JSON.stringify({ info_id: info.id, etiqueta_id: tag.id }) }).catch(() => undefined);
    }
    return { saved: true, informationId: info.id, sourceId: source.id, contentHash: hash };
  },
});
