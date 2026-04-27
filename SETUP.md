# FPT Proposal AI — Setup Guide

## Prerequisites
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- At least one LLM provider (Claude / OpenAI / Grok / Ollama)

---

## 1. Install dependencies

```bash
cd proposal-ai
npm install
```

---

## 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `DATABASE_URL` — your Neon connection string
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` for local dev
- `API_KEY_ENCRYPTION_SECRET` — generate with: `openssl rand -hex 16`

Optionally add fallback LLM keys (you can also configure via the UI):
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`
- `OLLAMA_BASE_URL`

---

## 3. Set up the database

**Option A — via Drizzle push (recommended for dev):**
```bash
npm run db:push
```

**Option B — via Neon SQL editor:**
Paste the contents of `drizzle/0001_initial.sql` into your Neon SQL editor and run it.

---

## 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 5. Configure your LLM provider

Go to **Settings** (top-right nav) and configure your LLM provider:

| Provider | What you need |
|---|---|
| Anthropic (Claude) | API key from console.anthropic.com |
| OpenAI (ChatGPT) | API key from platform.openai.com |
| Grok (xAI) | API key from console.x.ai |
| Ollama (local) | Ollama running locally (`ollama serve`) + a pulled model |
| Custom | Any OpenAI-compatible endpoint URL |

Click **Test & Save Provider** — it pings the model before saving.

---

## 6. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in your Vercel project settings.

---

## Project structure

```
src/
├── app/                    Next.js App Router pages + API routes
│   ├── page.tsx            Upload / landing page
│   ├── settings/           LLM provider configuration
│   └── proposals/[id]/     Proposal dashboard + section editor
├── lib/
│   ├── llm/                LLM abstraction layer
│   │   ├── router.ts       getLLMProvider() — picks active provider
│   │   └── providers/      Anthropic, OpenAI, Grok, Ollama, Compatible
│   ├── agents/
│   │   ├── clawbot.ts      Execution agent (extract, generate, revise)
│   │   └── hermes.ts       Learning agent (analyze feedback, improve prompts)
│   ├── db/                 Drizzle ORM schema + client
│   └── prompts/            Section prompt templates
└── components/             UI components
```

---

## Switching LLM providers

Visit `/settings` any time to switch providers. Each proposal is pinned to the provider active at creation time — switching won't affect in-progress proposals.

To use Ollama locally:
1. Install Ollama: https://ollama.com
2. Pull a model: `ollama pull llama3`
3. In Settings, select Ollama, set URL to `http://localhost:11434`, model to `llama3`
