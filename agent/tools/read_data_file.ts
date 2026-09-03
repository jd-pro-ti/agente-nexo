import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";
import * as XLSX from "xlsx";
import { defineTool } from "eve/tools";
import { z } from "zod";

const supportedExtensions = [".json", ".xlsx", ".xls", ".xlsm", ".csv"] as const;

function limitRows(rows: unknown[], maxRows: number) {
  return {
    rows: rows.slice(0, maxRows),
    truncated: rows.length > maxRows,
    totalRows: rows.length,
  };
}

export default defineTool({
  description:
    "Lee un archivo local JSON, Excel (.xlsx, .xls, .xlsm) o CSV y devuelve sus datos de forma estructurada. Para Excel, puede indicarse la hoja. La salida se limita para evitar respuestas demasiado grandes.",
  inputSchema: z.object({
    path: z.string().min(1).describe("Ruta absoluta o relativa al archivo"),
    sheet: z.string().min(1).optional().describe("Nombre de la hoja de Excel; por defecto, la primera"),
    maxRows: z.number().int().min(1).max(1000).default(200),
  }),
  async execute({ path, sheet, maxRows }) {
    const extension = extname(path).toLowerCase();
    if (!(supportedExtensions as readonly string[]).includes(extension)) {
      return {
        ok: false,
        path,
        error: `Formato no compatible: ${extension || "sin extensión"}. Usa JSON, XLSX, XLS, XLSM o CSV.`,
      };
    }

    try {
      if (extension === ".json") {
        const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
        if (Array.isArray(parsed)) {
          return { ok: true, path, format: "json", ...limitRows(parsed, maxRows) };
        }
        return { ok: true, path, format: "json", data: parsed };
      }

      const workbook = XLSX.readFile(path, { cellDates: true, raw: true });
      const selectedSheet = sheet ?? workbook.SheetNames[0];
      if (!selectedSheet || !workbook.Sheets[selectedSheet]) {
        return {
          ok: false,
          path,
          format: extension.slice(1),
          availableSheets: workbook.SheetNames,
          error: sheet ? `No existe la hoja: ${sheet}` : "El libro no contiene hojas.",
        };
      }

      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[selectedSheet], {
        header: 1,
        defval: null,
        raw: false,
      });
      const limited = limitRows(rows, maxRows);
      return {
        ok: true,
        path,
        fileName: basename(path),
        format: extension.slice(1),
        sheet: selectedSheet,
        availableSheets: workbook.SheetNames,
        ...limited,
      };
    } catch (error) {
      return {
        ok: false,
        path,
        error: error instanceof Error ? error.message : "No se pudo leer el archivo.",
      };
    }
  },
});
