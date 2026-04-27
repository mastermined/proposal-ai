import { db, llmProviders } from "@/lib/db";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/utils/crypto";
import { AnthropicProvider } from "./providers/anthropic";
import { OpenAIProvider } from "./providers/openai";
import { GrokProvider } from "./providers/grok";
import { GroqProvider } from "./providers/groq";
import { OllamaProvider } from "./providers/ollama";
import { OpenAICompatibleProvider } from "./providers/openai_compatible";
import type { LLMProvider, ProviderConfig } from "./types";

/**
 * Builds a provider instance from a config object.
 * Decrypts the API key if present.
 */
export function buildProvider(config: ProviderConfig): LLMProvider {
  const apiKey = config.apiKey ? decrypt(config.apiKey) : undefined;

  switch (config.provider) {
    case "anthropic":
      return new AnthropicProvider(
        apiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
        config.model
      );

    case "openai":
      return new OpenAIProvider(
        apiKey ?? process.env.OPENAI_API_KEY ?? "",
        config.model
      );

    case "grok":
      return new GrokProvider(
        apiKey ?? process.env.XAI_API_KEY ?? "",
        config.model
      );

    case "groq":
      return new GroqProvider(
        apiKey ?? process.env.GROQ_API_KEY ?? "",
        config.model
      );

    case "ollama":
      return new OllamaProvider(
        config.model,
        config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
      );

    case "openai_compatible":
      return new OpenAICompatibleProvider(
        config.baseUrl ?? "",
        config.model,
        apiKey,
        config.name
      );

    default:
      throw new Error(`Unknown provider type: ${config.provider}`);
  }
}

/**
 * Returns the active LLM provider from DB.
 * Falls back to Anthropic env var if nothing is configured.
 */
export async function getLLMProvider(): Promise<LLMProvider> {
  const active = await db.query.llmProviders.findFirst({
    where: eq(llmProviders.isActive, true),
  });

  if (active) {
    return buildProvider({
      id: active.id,
      name: active.name,
      provider: active.provider,
      baseUrl: active.baseUrl,
      model: active.model,
      apiKey: active.apiKeyEncrypted,
    });
  }

  // Fallback: check environment variables
  if (process.env.ANTHROPIC_API_KEY) {
    return new AnthropicProvider(
      process.env.ANTHROPIC_API_KEY,
      "claude-sonnet-4-6"
    );
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(process.env.OPENAI_API_KEY, "gpt-4o");
  }
  if (process.env.OLLAMA_BASE_URL) {
    return new OllamaProvider("llama3", process.env.OLLAMA_BASE_URL);
  }

  throw new Error(
    "No LLM provider configured. Visit /settings to set one up."
  );
}

/**
 * Returns the active provider config row (without decrypting keys).
 * Used by the UI to show what's currently active.
 */
export async function getActiveProviderInfo() {
  return db.query.llmProviders.findFirst({
    where: eq(llmProviders.isActive, true),
  });
}
