const baseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseConfigured() {
  return Boolean(baseUrl && serviceKey);
}

export async function supabaseRequest<T>(table: string, init: RequestInit = {}, query = "") {
  if (!baseUrl || !serviceKey) throw new Error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  const response = await fetch(`${baseUrl}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.status === 204 ? null as T : await response.json() as T;
}

export function enc(value: string) { return encodeURIComponent(value); }

export async function findOrCreate<T extends Record<string, any>>(table: string, query: Record<string, string>, values: Record<string, unknown>) {
  const params = new URLSearchParams(query).toString();
  const found = await supabaseRequest<T[]>(table, { method: "GET" }, params);
  if (found[0]) return found[0];
  const created = await supabaseRequest<T[]>(table, { method: "POST", body: JSON.stringify(values) });
  if (!created[0]) throw new Error(`Supabase no creó el registro en ${table}.`);
  return created[0];
}
