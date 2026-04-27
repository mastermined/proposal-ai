// Generic OpenAI-compatible endpoint (LM Studio, Together AI, Fireworks, etc.)
import OpenAI from "openai";
import type { LLMMessage, LLMOptions, LLMProvider } from "../types";

export class OpenAICompatibleProvider implements LLMProvider {
  readonly id = "openai_compatible";
  readonly name: string;
  readonly model: string;
  private client: OpenAI;

  constructor(baseUrl: string, model: string, apiKey?: string, name?: string) {
    this.model = model;
    this.name = name ?? "Custom (OpenAI-compatible)";
    this.client = new OpenAI({
      apiKey: apiKey ?? "none",
      baseURL: baseUrl,
    });
  }

  async complete(messages: LLMMessage[], opts?: LLMOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 4096,
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async *stream(messages: LLMMessage[], opts?: LLMOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts?.temperature ?? 0.7,
      max_tokens: opts?.maxTokens ?? 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
