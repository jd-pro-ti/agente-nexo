import { defineTool } from "eve/tools";
import { z } from "zod";

function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export default defineTool({
  description: "Descarga una fuente web y extrae texto para analizarla. No inventa contenido si la fuente no se puede leer.",
  inputSchema: z.object({ url: z.string().url(), maxCharacters: z.number().int().min(1000).max(50000).default(20000) }),
  async execute({ url, maxCharacters }) {
    const response = await fetch(url, { headers: { "User-Agent": "Nexo-Agronomy-Research/1.0" } });
    if (!response.ok) {
      return { url, ok: false, error: `La fuente respondió ${response.status}; no se guardó información de esta URL.` };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/pdf")) {
      throw new Error("La fuente es PDF. La extracción de PDF se habilitará en la siguiente iteración; conserva la URL para procesarla.");
    }
    const raw = await response.text();
    return { url, ok: true, contentType, text: cleanHtml(raw).slice(0, maxCharacters), truncated: raw.length > maxCharacters };
  },
});
