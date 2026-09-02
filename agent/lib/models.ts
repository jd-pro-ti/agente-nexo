import { google } from "@ai-sdk/google";
import type { LanguageModelV4 } from "@ai-sdk/provider";

export const MODELS = {
  primary: google("gemini-3.5-flash-lite"),
  fallback: google("gemini-3.1-flash-lite"),
} as const;

const FALLBACK_MODELS = [MODELS.primary, MODELS.fallback];

// Se mantiene durante la vida del proceso. Si un modelo agotó su cuota,
// volver a probarlo en cada turno solo genera latencia y otro error 429.
const unavailableModels = new Set<string>();
const temporaryUnavailableUntil = new Map<string, number>();
const TEMPORARY_ERROR_COOLDOWN_MS = 60_000;

function modelId(model: LanguageModelV4, index: number) {
  return model.modelId ?? `model-${index}`;
}

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") return {};

  const value = error as Record<string, any>;
  const response = value.response;

  return {
    code: value.code,
    status: value.status ?? value.statusCode ?? response?.status,
    body: value.responseBody ?? response?.body,
    message: value.message,
  };
}

function isQuotaError(error: unknown) {
  const details = errorDetails(error);
  const text = JSON.stringify({
    ...details,
    cause: error instanceof Error ? error.cause : undefined,
    error,
  }).toLowerCase();

  const status = Number(details.status);

  return (
    status === 429 ||
    details.code === "RESOURCE_EXHAUSTED" ||
    text.includes("resource_exhausted") ||
    text.includes("quotaexceeded") ||
    text.includes("ratelimitexceeded") ||
    text.includes("rate limit") ||
    text.includes("too many requests")
  );
}

function isTemporaryProviderError(error: unknown) {
  const details = errorDetails(error);
  const text = JSON.stringify({ ...details, error }).toLowerCase();
  const status = Number(details.status);

  return (
    isQuotaError(error) ||
    [500, 502, 503, 504].includes(status) ||
    text.includes("high demand") ||
    text.includes("temporarily unavailable") ||
    text.includes("service unavailable")
  );
}

async function callWithFallback<T>(
  operation: "doGenerate" | "doStream",
  options: any,
): Promise<T> {
  let lastError: unknown;
  let attemptedModel = false;

  for (let index = 0; index < FALLBACK_MODELS.length; index += 1) {
    const model = FALLBACK_MODELS[index];
    const id = modelId(model, index);

    if (unavailableModels.has(id)) continue;
    const unavailableUntil = temporaryUnavailableUntil.get(id);
    if (unavailableUntil && unavailableUntil > Date.now()) continue;
    if (unavailableUntil) temporaryUnavailableUntil.delete(id);
    attemptedModel = true;

    try {
      return await (model as any)[operation](options);
    } catch (error) {
      lastError = error;

      if (!isTemporaryProviderError(error)) throw error;

      if (isQuotaError(error)) {
        unavailableModels.add(id);
        console.log(`[Gemini] ${id} agotó cuota; pasando al siguiente modelo.`);
      } else {
        temporaryUnavailableUntil.set(id, Date.now() + TEMPORARY_ERROR_COOLDOWN_MS);
        console.log(`[Gemini] ${id} no disponible temporalmente; reintentable en 60 segundos.`);
      }
    }
  }

  if (!attemptedModel) {
    throw new Error("Todos los modelos configurados están sin cuota o disponibilidad.");
  }

  throw lastError;
}

export const novaModel = new Proxy(MODELS.primary as LanguageModelV4, {
  get(target, property, receiver) {
    if (property === "doGenerate") {
      return (options: any) => callWithFallback("doGenerate", options);
    }

    if (property === "doStream") {
      return (options: any) => callWithFallback("doStream", options);
    }

    return Reflect.get(target, property, receiver);
  },
});
