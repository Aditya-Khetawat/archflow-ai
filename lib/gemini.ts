import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

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

// Exported dynamic GEMINI_MODEL variable
export let GEMINI_MODEL = "gemini-1.5-flash"; 

interface GoogleModel {
  name: string;
  supportedGenerationMethods: string[];
  displayName: string;
}

let isInitialized = false;

/**
  * Dynamically queries the Google Models API, chooses the newest stable Flash model,
  * and executes a health check to verify model and API key availability.
  */
export async function initializeGemini(runHealthCheck = false): Promise<string> {
  if (isInitialized && !runHealthCheck) {
    return GEMINI_MODEL;
  }

  if (!apiKey) {
    console.warn("[Gemini] No API key, skipping initialization.");
    return GEMINI_MODEL;
  }

  console.log("[Gemini] Fetching available models from Google Models API...");
  let models: GoogleModel[] = [];
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Models API HTTP error ${res.status}: ${errText}`);
    }
    const data = await res.json() as { models?: GoogleModel[] };
    models = data.models || [];
  } catch (err: any) {
    console.error("[Gemini] Failed to fetch available models:", err.message || err);
    throw new Error(`Failed to query Google Models API: ${err.message || err}`);
  }

  // Filter for Flash models that support generateContent and are stable
  const flashModels = models.filter((m) => {
    const nameLower = m.name.toLowerCase();
    const isFlash = nameLower.includes("flash");
    const supportsGen = Array.isArray(m.supportedGenerationMethods) && 
                         m.supportedGenerationMethods.includes("generateContent");
    
    // Stable filter: exclude experimental (exp), preview, tuning, experimental, latest
    const isStable = !nameLower.includes("exp") && 
                     !nameLower.includes("preview") && 
                     !nameLower.includes("tuning") &&
                     !nameLower.includes("experimental") &&
                     !nameLower.includes("latest");
    
    return isFlash && supportsGen && isStable;
  });

  let selectedModelName = "";
  if (flashModels.length === 0) {
    console.warn("[Gemini] No stable Flash models found. Trying experimental/preview Flash models...");
    const allFlash = models.filter((m) => 
      m.name.toLowerCase().includes("flash") && 
      Array.isArray(m.supportedGenerationMethods) && 
      m.supportedGenerationMethods.includes("generateContent")
    );
    if (allFlash.length > 0) {
      selectedModelName = allFlash[0].name;
    } else {
      console.error("[Gemini] Available models returned by API:", models.map((m) => m.name));
      throw new Error("No Gemini Flash models supporting generateContent were returned by the API.");
    }
  } else {
    // Parse versions and sort descending to get the newest
    flashModels.sort((a, b) => {
      const getVersion = (name: string) => {
        const match = name.match(/gemini-(\d+\.\d+|\d+)/i);
        return match ? parseFloat(match[1]) : 0;
      };
      return getVersion(b.name) - getVersion(a.name);
    });
    selectedModelName = flashModels[0].name;
  }

  // Strip "models/" prefix if present, as the SDK usually expects just "gemini-1.5-flash"
  GEMINI_MODEL = selectedModelName.replace(/^models\//, "");
  console.log(`[Gemini] Automatically selected newest Flash model: ${GEMINI_MODEL}`);

  if (runHealthCheck) {
    console.log(`[Gemini] Running health check on model "${GEMINI_MODEL}"...`);
    try {
      const result = await generateText({
        model: google(GEMINI_MODEL),
        prompt: "Reply only with OK.",
        abortSignal: AbortSignal.timeout(10000), // 10 second timeout for health check
      });
      const reply = result.text.trim();
      if (!reply.includes("OK")) {
        throw new Error(`Unexpected health check reply: expected "OK", got "${reply}"`);
      }
      console.log("[Gemini] Health check passed successfully!");
    } catch (healthError: any) {
      console.error("=========================================");
      console.error("[Gemini] CRITICAL: Health check failed!");
      console.error("[Gemini] Exact Google error:", healthError.message || healthError);
      console.error("[Gemini] Available models returned by API:");
      console.error(JSON.stringify(models.map((m) => m.name), null, 2));
      console.error("=========================================");
      throw new Error(`Gemini health check failed: ${healthError.message || healthError}`);
    }
  }

  isInitialized = true;
  return GEMINI_MODEL;
}

/**
 * Executes a function with exponential backoff retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 10000;
  const factor = options.factor ?? 2;

  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.statusCode;
      const isTransient =
        status === 429 || // Rate limit
        status === 500 || // Internal server error
        status === 503 || // Service unavailable
        error?.message?.toLowerCase().includes("fetch failed") ||
        error?.message?.toLowerCase().includes("timeout") ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.message?.toLowerCase().includes("quota") ||
        error?.name === "AbortError";

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      console.warn(
        `[Gemini] Transient error encountered (attempt ${attempt}/${maxRetries}): ${error.message || error}. Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * factor, maxDelay);
    }
  }
  throw new Error("Unreachable");
}
