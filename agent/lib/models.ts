import { google } from "@ai-sdk/google";

export const MODELS = {
  primary: google("gemini-3.5-flash-lite"),
  fallback: google("gemini-3.1-flash-lite"),
} as const;

const models = [MODELS.primary, MODELS.fallback];
const unavailableUntil = new Map<string, number>();

function errorText(error: unknown) {
  const text = JSON.stringify(error).toLowerCase();
  return text;
}

function retryDelay(error: unknown) {
  const text = errorText(error);
  if (text.includes("high demand") || text.includes("spikes in demand")) return 5_000;
  if (["429", "resource_exhausted", "quota", "rate limit", "too many requests"].some((v) => text.includes(v))) return 60_000;
  if (["503", "500", "temporarily unavailable"].some((v) => text.includes(v))) return 10_000;
  return 0;
}

async function withFallback(operation: "doGenerate" | "doStream", options: unknown) {
  let lastError: unknown;
  let tried = false;
  for (let index = 0; index < models.length; index++) {
    const model = models[index];
    const id = model.modelId ?? `gemini-${index}`;
    if ((unavailableUntil.get(id) ?? 0) > Date.now()) continue;
    tried = true;
    try { return await (model as any)[operation](options); }
    catch (error) {
      lastError = error;
      const delay = retryDelay(error);
      if (!delay) throw error;
      unavailableUntil.set(id, Date.now() + delay);
    }
  }
  if (!tried) throw new Error("Gemini está temporalmente ocupado. Espera unos segundos y vuelve a intentarlo.");
  throw lastError;
}

export const novaModel = new Proxy(MODELS.primary as any, {
  get(target, property, receiver) {
    if (property === "doGenerate" || property === "doStream") return (options: unknown) => withFallback(property, options);
    return Reflect.get(target, property, receiver);
  },
});
