import Anthropic from "@anthropic-ai/sdk";
import type { LLMMessage, LLMOptions, LLMProvider } from "../types";

export class AnthropicProvider implements LLMProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic (Claude)";
  readonly model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string) {
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async complete(messages: LLMMessage[], opts?: LLMOptions): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.7,
      system: systemMsg?.content,
      messages: userMsgs,
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  async *stream(messages: LLMMessage[], opts?: LLMOptions): AsyncIterable<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const stream = await this.client.messages.stream({
      model: this.model,
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.7,
      system: systemMsg?.content,
      messages: userMsgs,
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield chunk.delta.text;
      }
    }
  }
}
