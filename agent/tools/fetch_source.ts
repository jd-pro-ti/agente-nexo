import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Lee una fuente web y devuelve texto acotado para verificar datos.",
  inputSchema: z.object({ url: z.string().url(), maxCharacters: z.number().int().min(1000).max(30000).default(12000) }),
  async execute({ url, maxCharacters }) {
    const response = await fetch(url, { headers: { "User-Agent": "Nexo/1.0 research bot" } });
    if (!response.ok) return { url, ok: false, error: `HTTP ${response.status}` };
    const type = response.headers.get("content-type") ?? "";
    if (type.includes("pdf")) return { url, ok: false, error: "PDF: descarga y extracción deben hacerse en un proceso específico." };
    const html = await response.text();
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const safeLimit = Math.min(maxCharacters, 8000);
    return { url, ok: true, content: text.slice(0, safeLimit), truncated: text.length > safeLimit };
  },
});
