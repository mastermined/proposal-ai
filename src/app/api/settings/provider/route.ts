import { NextRequest, NextResponse } from "next/server";
import { db, llmProviders } from "@/lib/db";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/utils/crypto";
import { buildProvider } from "@/lib/llm/router";
import { z } from "zod";

export const runtime = "nodejs";

const ProviderSchema = z.object({
  name: z.string().min(1),
  provider: z.enum(["anthropic", "openai", "ollama", "grok", "groq", "openai_compatible"]),
  baseUrl: z.string().optional().nullable(),
  model: z.string().min(1),
  apiKey: z.string().optional().nullable(),
});

// GET — return active provider (masked)
export async function GET() {
  try {
    const active = await db.query.llmProviders.findFirst({
      where: eq(llmProviders.isActive, true),
    });

    if (!active) return NextResponse.json({ active: null });

    return NextResponse.json({
      active: {
        id: active.id,
        name: active.name,
        provider: active.provider,
        model: active.model,
        baseUrl: active.baseUrl,
        hasApiKey: !!active.apiKeyEncrypted,
      },
    });
  } catch (err) {
    console.error("[settings/provider GET]", err);
    // DB may not be migrated yet — return null gracefully
    return NextResponse.json({ active: null });
  }
}

// POST — save + activate a provider
export async function POST(req: NextRequest) {
  try {
    const body = ProviderSchema.parse(await req.json());

    // Test the connection before saving
    try {
      const testProvider = buildProvider({
        id: "test",
        name: body.name,
        provider: body.provider,
        baseUrl: body.baseUrl,
        model: body.model,
        apiKey: body.apiKey ? encrypt(body.apiKey) : null,
      });

      const start = Date.now();
      const result = await testProvider.complete(
        [{ role: "user", content: 'Reply with exactly the word "OK" and nothing else.' }],
        { temperature: 0, maxTokens: 10 }
      );
      const latencyMs = Date.now() - start;

      if (!result) throw new Error("Empty response from provider");

      // Deactivate all existing providers
      await db
        .update(llmProviders)
        .set({ isActive: false })
        .where(eq(llmProviders.isActive, true));

      // Save the new provider
      const [saved] = await db
        .insert(llmProviders)
        .values({
          name: body.name,
          provider: body.provider,
          baseUrl: body.baseUrl ?? null,
          model: body.model,
          apiKeyEncrypted: body.apiKey ? encrypt(body.apiKey) : null,
          isActive: true,
        })
        .returning();

      return NextResponse.json({
        ok: true,
        provider: {
          id: saved.id,
          name: saved.name,
          model: saved.model,
          provider: saved.provider,
        },
        latencyMs,
        testResponse: result.trim().slice(0, 50),
      });
    } catch (testErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `Connection test failed: ${String(testErr)}`,
        },
        { status: 422 }
      );
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[settings/provider POST]", msg);
    return NextResponse.json(
      { ok: false, error: `Server error: ${msg}` },
      { status: 500 }
    );
  }
}
