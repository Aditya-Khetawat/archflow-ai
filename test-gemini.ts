import "dotenv/config";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
});

async function main() {
  try {
    const result = await generateText({
      model: google("gemini-flash-latest"),
      prompt: "Reply with only: OK",
    });

    console.log("SUCCESS:", result.text);
  } catch (err) {
    console.error("ERROR:", err);
  }
}

main();