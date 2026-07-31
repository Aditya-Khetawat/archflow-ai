import { createGoogleGenerativeAI } from "@ai-sdk/google";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  console.warn(
    "[Gemini] Warning: Neither GOOGLE_GENERATIVE_AI_API_KEY nor GOOGLE_AI_API_KEY is defined in environment variables."
  );
} else {
  const maskedKey = `***${apiKey.slice(-6)}`;
  console.log(`[Gemini] Initializing client. Loaded key: ${maskedKey}`);
}

export const google = createGoogleGenerativeAI({
  apiKey: apiKey || "dummy-key-to-prevent-immediate-crash",
});

/**
 * Priority-ordered list of Gemini models to attempt.
 * withGeminiFallback() always starts from index 0 and advances on 429 failures.
 */
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
] as const;

/**
 * Primary model alias — kept for logging and call-site compatibility.
 * All actual generation goes through withGeminiFallback().
 */
export const GEMINI_MODEL = GEMINI_FALLBACK_MODELS[0];

/**
 * No-op kept for call-site compatibility.
 */
export async function initializeGemini(_runHealthCheck = false): Promise<string> {
  if (!apiKey) {
    console.warn("[Gemini] No API key found in environment.");
  }
  console.log(`[Gemini] Primary model: ${GEMINI_MODEL}. Fallback chain: ${GEMINI_FALLBACK_MODELS.join(" → ")}`);
  return GEMINI_MODEL;
}

// ─── Internal helpers ──────────────────────────────────────────────────────

function getRetryAfterHeader(error: any): string | null {
  const headers = error?.headers || error?.response?.headers;
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get("retry-after") || headers.get("Retry-After") || null;
  }
  return headers["retry-after"] || headers["Retry-After"] || null;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10) * 1000;
  const ms = Date.parse(value);
  if (!isNaN(ms)) {
    const delay = ms - Date.now();
    return delay > 0 ? delay : 0;
  }
  return null;
}

function parseGoogleRetryMessage(message: string): number | null {
  const m = message.match(/retry in (\d+(?:\.\d+)?)\s*(?:s|second)/i);
  return m ? parseFloat(m[1]) * 1000 : null;
}

/**
 * Resolves the correct wait duration for a 429 error.
 * Priority: Retry-After header → Google message hint → 45s default.
 */
function computeRateLimitDelay(error: any, message: string): number {
  const retryAfterDelay = parseRetryAfter(getRetryAfterHeader(error));
  if (retryAfterDelay !== null) return retryAfterDelay + 1000;
  const googleDelay = parseGoogleRetryMessage(message);
  if (googleDelay !== null) return googleDelay + 2000;
  return 45000; // 45s default
}

function isRateLimitError(status: number | undefined, message: string): boolean {
  return (
    status === 429 ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("quota")
  );
}

function isTransientError(
  status: number | undefined,
  message: string,
  errorName: string | undefined
): boolean {
  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("quota") ||
    message.toLowerCase().includes("fetch failed") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("aborted") ||
    errorName === "AbortError"
  );
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Executes a Gemini generation function with automatic model fallback on
 * HTTP 429 quota / rate-limit errors.
 *
 * Algorithm for each model in GEMINI_FALLBACK_MODELS:
 *   1. Call fn(model).
 *   2. On 429 (attempt 1): read Google's suggested retry delay, wait, retry once.
 *   3. On 429 (attempt 2): advance to the next model.
 *   4. On other transient errors (500, 503, timeout): advance to the next model immediately.
 *   5. On non-transient errors: throw immediately — no fallback will help.
 *
 * @param fn    A factory that receives the resolved model name and returns a Promise.
 * @param label Short label used in log messages (e.g. "generate-spec").
 */
export async function withGeminiFallback<T>(
  fn: (model: string) => Promise<T>,
  label = "gemini"
): Promise<T> {
  for (let mi = 0; mi < GEMINI_FALLBACK_MODELS.length; mi++) {
    const model = GEMINI_FALLBACK_MODELS[mi];
    const nextModel = GEMINI_FALLBACK_MODELS[mi + 1];

    console.log(
      `[Gemini:${label}] Attempt with model ${mi + 1}/${GEMINI_FALLBACK_MODELS.length}: ${model}`
    );

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await fn(model);
        if (mi > 0 || attempt > 1) {
          console.log(
            `[Gemini:${label}] SUCCESS — model: ${model}, model attempt: ${mi + 1}, request attempt: ${attempt}`
          );
        }
        return result;
      } catch (err: any) {
        const status: number | undefined = err?.status || err?.statusCode;
        const message: string = err?.message || String(err);
        const rateLimit = isRateLimitError(status, message);
        const transient = isTransientError(status, message, err?.name);

        if (!transient) {
          // Permanent error — no model switch will help
          console.error(
            `[Gemini:${label}] Non-transient error on ${model}: ${message.slice(0, 200)}`
          );
          throw err;
        }

        if (rateLimit && attempt === 1) {
          // First 429 on this model: wait the suggested delay and retry once
          const delayMs = computeRateLimitDelay(err, message);
          console.warn(
            `[Gemini:${label}] Rate limit on ${model} (attempt 1). ` +
            `Waiting ${Math.round(delayMs / 1000)}s before retry same model...`
          );
          await new Promise((r) => setTimeout(r, delayMs));
          // continue inner loop → attempt 2
        } else {
          // Either: 429 persists after retry, or other transient error
          if (rateLimit) {
            console.warn(
              `[Gemini:${label}] Rate limit on ${model} persists after retry. ` +
              (nextModel ? `Falling back to ${nextModel}...` : "All models exhausted.")
            );
          } else {
            console.warn(
              `[Gemini:${label}] Transient error on ${model}: ${message.slice(0, 150)}. ` +
              (nextModel ? `Falling back to ${nextModel}...` : "All models exhausted.")
            );
          }
          break; // advance to next model
        }
      }
    }
  }

  throw new Error(
    `[Gemini:${label}] All models exhausted (${GEMINI_FALLBACK_MODELS.join(" → ")}). No successful response.`
  );
}

/**
 * Generic retry helper — kept for backward compatibility.
 * For Gemini calls, prefer withGeminiFallback() which also handles model rotation.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const backoffSequence = [2000, 5000, 10000, 20000];
  const maxFallbackDelay = 30000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status: number | undefined = error?.status || error?.statusCode;
      const message: string = error?.message || String(error);
      const rateLimit = isRateLimitError(status, message);
      const transient = isTransientError(status, message, error?.name);

      if (!transient || attempt === maxRetries) throw error;

      let delayMs: number;
      if (rateLimit) {
        delayMs = computeRateLimitDelay(error, message);
        console.warn(
          `[Gemini] Rate limit (attempt ${attempt}/${maxRetries}). ` +
          `Waiting ${Math.round(delayMs / 1000)}s...`
        );
      } else {
        const base = backoffSequence[attempt - 1] ?? maxFallbackDelay;
        delayMs = Math.min(base + Math.random() * 1000, maxFallbackDelay);
        console.warn(
          `[Gemini] Transient error (attempt ${attempt}/${maxRetries}): ${message}. ` +
          `Retrying in ${Math.round(delayMs / 1000)}s...`
        );
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("Unreachable");
}
