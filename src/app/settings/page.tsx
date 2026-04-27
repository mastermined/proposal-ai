"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, AlertCircle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProviderType = "anthropic" | "openai" | "ollama" | "grok" | "groq" | "openai_compatible";

interface ActiveProvider {
  id: string;
  name: string;
  provider: ProviderType;
  model: string;
  baseUrl?: string | null;
  hasApiKey: boolean;
}

const PROVIDER_OPTIONS: { value: ProviderType; label: string; needsKey: boolean; needsUrl: boolean }[] = [
  { value: "anthropic", label: "Anthropic (Claude)", needsKey: true, needsUrl: false },
  { value: "openai", label: "OpenAI (ChatGPT)", needsKey: true, needsUrl: false },
  { value: "grok", label: "Grok (xAI)", needsKey: true, needsUrl: false },
  { value: "groq", label: "Groq (Fast LPU — free tier)", needsKey: true, needsUrl: false },
  { value: "ollama", label: "Ollama (local)", needsKey: false, needsUrl: true },
  { value: "openai_compatible", label: "Custom (OpenAI-compatible)", needsKey: false, needsUrl: true },
];

const DEFAULT_MODELS: Record<ProviderType, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-4o",
  grok: "grok-3",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3",
  openai_compatible: "your-model-name",
};

const DEFAULT_URLS: Partial<Record<ProviderType, string>> = {
  ollama: "http://localhost:11434",
};

export default function SettingsPage() {
  const [active, setActive] = useState<ActiveProvider | null>(null);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState<ProviderType>("anthropic");
  const [name, setName] = useState("My Provider");
  const [model, setModel] = useState(DEFAULT_MODELS.anthropic);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);

  useEffect(() => {
    fetch("/api/settings/provider")
      .then((r) => r.json())
      .then(({ active }) => {
        setActive(active);
        if (active) {
          setProvider(active.provider);
          setModel(active.model);
          setName(active.name);
          setBaseUrl(active.baseUrl ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const providerConfig = PROVIDER_OPTIONS.find((p) => p.value === provider)!;

  const handleProviderChange = (p: ProviderType) => {
    setProvider(p);
    setModel(DEFAULT_MODELS[p]);
    setBaseUrl(DEFAULT_URLS[p] ?? "");
    setResult(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/settings/provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          provider,
          model,
          apiKey: apiKey || null,
          baseUrl: baseUrl || null,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, message: `Connected! Response: "${data.testResponse}"`, latencyMs: data.latencyMs });
        setActive({ id: data.provider.id, name, provider, model, baseUrl, hasApiKey: !!apiKey });
      } else {
        setResult({ ok: false, message: data.error });
      }
    } catch (e) {
      setResult({ ok: false, message: String(e) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-1">LLM Provider Settings</h1>
      <p className="mb-8 text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure which AI model powers Clawbot and Hermes. Switch providers any time — existing proposals keep their original provider.
      </p>

      {/* Current active provider */}
      {!loading && active && (
        <div className="mb-8 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Currently active: {active.name}</p>
            <p className="text-xs text-green-600">{active.provider} · {active.model}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl p-6 space-y-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        {/* Provider type */}
        <div>
          <label className="block text-sm font-medium mb-2">Provider</label>
          <div className="grid grid-cols-1 gap-2">
            {PROVIDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleProviderChange(opt.value)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all text-sm",
                  provider === opt.value
                    ? "border-fpt bg-fpt-muted font-medium"
                    : ""
                )}
                style={provider === opt.value
                  ? { color: "var(--accent)" }
                  : { borderColor: "var(--border)", color: "var(--fg)" }
                }
              >
                <Cpu size={16} style={{ color: provider === opt.value ? "var(--accent)" : "var(--fg-muted)" }} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Work Claude"
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fpt"
            style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fpt"
            style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
            {provider === "ollama" ? "Must be a model you have pulled locally (e.g. llama3, mistral, phi3)" :
             provider === "anthropic" ? "e.g. claude-sonnet-4-6, claude-opus-4-6, claude-haiku-4-5-20251001" :
             provider === "openai" ? "e.g. gpt-4o, gpt-4-turbo, gpt-3.5-turbo" :
             provider === "grok" ? "e.g. grok-3, grok-3-mini" :
             provider === "groq" ? "e.g. llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768" :
             "The model name accepted by your endpoint"}
          </p>
        </div>

        {/* Base URL (Ollama / custom) */}
        {providerConfig.needsUrl && (
          <div>
            <label className="block text-sm font-medium mb-1.5">Base URL</label>
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULT_URLS[provider] ?? "https://your-endpoint.com/v1"}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fpt"
              style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
            />
            {provider === "ollama" && (
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                Default: http://localhost:11434 — change for LAN-hosted Ollama
              </p>
            )}
          </div>
        )}

        {/* API key */}
        {providerConfig.needsKey && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              API Key {active?.hasApiKey && <span className="text-green-600 font-normal">(saved — leave blank to keep)</span>}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={active?.hasApiKey ? "••••••••••••••••" : "sk-..."}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fpt"
              style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              Encrypted with AES-256 before storage. Never returned to the browser.
            </p>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-fpt hover:bg-fpt-hover text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Testing connection…
            </>
          ) : (
            "Test & Save Provider"
          )}
        </button>

        {/* Result */}
        {result && (
          <div
            className={cn(
              "flex items-start gap-2 rounded-lg px-4 py-3 text-sm",
              result.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <div>
              <p>{result.message}</p>
              {result.latencyMs && <p className="text-xs opacity-70 mt-0.5">Latency: {result.latencyMs}ms</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
