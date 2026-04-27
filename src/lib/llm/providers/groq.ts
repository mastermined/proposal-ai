// Groq uses an OpenAI-compatible API at api.groq.com
// Free tier available at console.groq.com — no credit card required
import OpenAI from "openai";
import type { LLMMessage, LLMOptions, LLMProvider } from "../types";

export class GroqProvider implements LLMProvider {
  readonly id = "groq";
  readonly name = "Groq";
  readonly model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string) {
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
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
