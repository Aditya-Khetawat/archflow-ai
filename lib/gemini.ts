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
 * The Gemini model to use for all generation requests.
 * Hardcoded to gemini-flash-latest — the stable, high-quota alias for the
 * current recommended Flash model. No dynamic discovery needed.
 */
export const GEMINI_MODEL = "gemini-flash-latest";

/**
 * No-op kept for call-site compatibility. Previously performed dynamic model
 * discovery; now simply logs the hardcoded model and returns immediately.
 */
export async function initializeGemini(_runHealthCheck = false): Promise<string> {
  if (!apiKey) {
    console.warn("[Gemini] No API key found in environment.");
  }
  console.log(`[Gemini] Using model: ${GEMINI_MODEL}`);
  return GEMINI_MODEL;
}

/**
 * Helper to fetch standard Retry-After header from various error formats.
 */
function getRetryAfterHeader(error: any): string | null {
  const headers = error?.headers || error?.response?.headers;
  if (!headers) return null;
  
  if (typeof headers.get === "function") {
    return headers.get("retry-after") || headers.get("Retry-After") || null;
  }
  
  return headers["retry-after"] || headers["Retry-After"] || null;
}

/**
 * Parses HTTP Retry-After header value (either seconds or an HTTP Date).
 */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  
  // If numeric (seconds), parse and convert to ms
  if (/^\d+$/.test(value)) {
    const seconds = parseInt(value, 10);
    return seconds * 1000;
  }
  
  // Try parsing as an HTTP date
  const ms = Date.parse(value);
  if (!isNaN(ms)) {
    const delay = ms - Date.now();
    return delay > 0 ? delay : 0;
  }
  
  return null;
}

/**
 * Parses Google's custom error response messages for "retry in Xs" text.
 */
function parseGoogleRetryMessage(message: string): number | null {
  const retryMatch = message.match(/retry in (\d+(?:\.\d+)?)\s*(?:s|second)/i);
  if (retryMatch) {
    const seconds = parseFloat(retryMatch[1]);
    return seconds * 1000;
  }
  return null;
}

/**
 * Executes a function with retry logic that correctly handles HTTP 429
 * rate-limit responses from the Google Gemini API.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const backoffSequence = [2000, 5000, 10000, 20000]; // 2s, 5s, 10s, 20s
  const maxFallbackDelay = 30000; // Cap backoff at 30s

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const message: string = error?.message || String(error);

      const isRateLimit =
        status === 429 ||
        message.toLowerCase().includes("rate limit") ||
        message.toLowerCase().includes("quota");

      const isTransient =
        isRateLimit ||
        status === 500 ||
        status === 503 ||
        message.toLowerCase().includes("fetch failed") ||
        message.toLowerCase().includes("timeout") ||
        message.toLowerCase().includes("aborted") ||
        error?.name === "AbortError";

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      let delayMs: number;

      if (isRateLimit) {
        // 1. Try Retry-After header
        const retryAfterVal = getRetryAfterHeader(error);
        const retryAfterDelay = parseRetryAfter(retryAfterVal);

        if (retryAfterDelay !== null) {
          delayMs = retryAfterDelay + 1000; // Add 1s safety buffer
          console.warn(
            `[Gemini] Rate limit hit (attempt ${attempt}/${maxRetries}). ` +
            `Waiting ${Math.round(delayMs / 1000)}s based on Retry-After header...`
          );
        } else {
          // 2. Try Google's "retry in Xs" text
          const googleSuggestedDelay = parseGoogleRetryMessage(message);
          if (googleSuggestedDelay !== null) {
            delayMs = googleSuggestedDelay + 2000; // Add 2s safety buffer
            console.warn(
              `[Gemini] Rate limit hit (attempt ${attempt}/${maxRetries}). ` +
              `Waiting ${Math.round(delayMs / 1000)}s based on Google retry hint...`
            );
          } else {
            // 3. Fall back to exponential backoff with jitter
            const baseDelay = backoffSequence[attempt - 1] ?? maxFallbackDelay;
            const jitter = Math.random() * 1000;
            delayMs = Math.min(baseDelay + jitter, maxFallbackDelay);
            console.warn(
              `[Gemini] Rate limit hit (attempt ${attempt}/${maxRetries}) with no retry headers or messages. ` +
              `Falling back to backoff delay of ${Math.round(delayMs / 1000)}s...`
            );
          }
        }
      } else {
        // For non-rate-limit transient errors, fall back to backoff sequence with jitter
        const baseDelay = backoffSequence[attempt - 1] ?? maxFallbackDelay;
        const jitter = Math.random() * 1000;
        delayMs = Math.min(baseDelay + jitter, maxFallbackDelay);
        console.warn(
          `[Gemini] Transient error (attempt ${attempt}/${maxRetries}): ${message}. Retrying in ${Math.round(delayMs / 1000)}s...`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unreachable");
}
