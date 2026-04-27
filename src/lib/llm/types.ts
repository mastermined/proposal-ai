export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  model: string;
  /** Single completion — returns full response text */
  complete(messages: LLMMessage[], opts?: LLMOptions): Promise<string>;
  /** Streaming — yields text chunks as they arrive */
  stream(
    messages: LLMMessage[],
    opts?: LLMOptions
  ): AsyncIterable<string>;
}

export type ProviderType =
  | "anthropic"
  | "openai"
  | "ollama"
  | "grok"
  | "groq"
  | "openai_compatible";

export interface ProviderConfig {
  id: string;
  name: string;
  provider: ProviderType;
  baseUrl?: string | null;
  model: string;
  apiKey?: string | null;
}
