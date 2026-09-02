type Row = Record<string, unknown>;

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRequest<T = Row>(
  table: string,
  options: { method?: string; query?: Record<string, string>; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const { url, key } = config();
  const params = new URLSearchParams(options.query);
  const response = await fetch(`${url}/rest/v1/${table}?${params}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: options.prefer ?? "return=representation",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${text.slice(0, 500)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export async function findOrCreate(
  table: string,
  lookup: Record<string, string>,
  values: Row,
): Promise<Row> {
  const existing = await supabaseRequest<Row[]>(table, { query: { ...lookup, select: "*", limit: "1" } });
  if (existing[0]) return existing[0];
  const created = await supabaseRequest<Row[]>(table, { method: "POST", body: values });
  return created[0];
}

export async function agronomyContext(query: string, limit = 8): Promise<Row[]> {
  const escaped = query.replace(/[(),]/g, " ").trim();
  return supabaseRequest<Row[]>("information", {
    query: {
      select: "id,title,summary,content,confidence_score,validation_status,source_id,subtopic_id,obtained_at",
      or: `(title.ilike.*${escaped}*,summary.ilike.*${escaped}*,content.ilike.*${escaped}*)`,
      limit: String(limit),
      order: "obtained_at.desc",
    },
  });
}
