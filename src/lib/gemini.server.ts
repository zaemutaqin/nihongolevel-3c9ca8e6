// Direct Google Gemini API helper (server-only).
// Primary: gemini-2.5-flash | Fallback: gemini-2.5-flash-lite (auto on 429)

const MODELS = {
  primary: "gemini-2.5-flash",
  fallback: "gemini-2.5-flash-lite",
} as const;

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

function toGeminiContents(messages: ChatMessage[]): {
  contents: GeminiContent[];
  systemInstruction?: { parts: { text: string }[] };
} {
  const systems: string[] = [];
  const contents: GeminiContent[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systems.push(m.content);
    } else {
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      });
    }
  }
  return {
    contents,
    systemInstruction: systems.length ? { parts: [{ text: systems.join("\n\n") }] } : undefined,
  };
}

export interface GeminiOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  json?: boolean;
}

function buildBody(opts: GeminiOptions) {
  const { contents, systemInstruction } = toGeminiContents(opts.messages);
  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };
  if (systemInstruction) body.systemInstruction = systemInstruction;
  return body;
}

function getKey(): string | null {
  return process.env.GEMINI_API_KEY?.trim() ?? null;
}

// --- Non-streaming (with auto fallback) ---
export async function geminiGenerate(opts: GeminiOptions): Promise<{
  ok: boolean;
  status: number;
  text: string;
  model?: string;
}> {
  const key = getKey();
  if (!key) return { ok: false, status: 500, text: "API Key is empty or missing" };

  // Try primary model first, fallback to lite on rate limit (429) or overload (503)
  for (const model of [MODELS.primary, MODELS.fallback]) {
    const res = await fetch(`${BASE}/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(opts)),
    });

    // On rate limit or overload, try fallback model
    if ((res.status === 429 || res.status === 503) && model === MODELS.primary) {
      console.warn(`[gemini] ${model} returned ${res.status}, falling back to ${MODELS.fallback}`);
      continue;
    }

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, status: res.status, text: errText, model };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { ok: true, status: 200, text, model };
  }

  // Both models failed
  return { ok: false, status: 429, text: "Rate limit reached on all models. Please try again shortly." };
}

// --- Streaming (with auto fallback) ---
export async function geminiStream(opts: GeminiOptions): Promise<{
  ok: boolean;
  status: number;
  response: Response | null;
  model?: string;
}> {
  const key = getKey();
  if (!key) return { ok: false, status: 500, response: null };

  for (const model of [MODELS.primary, MODELS.fallback]) {
    const res = await fetch(`${BASE}/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(opts)),
    });

    if ((res.status === 429 || res.status === 503) && model === MODELS.primary) {
      console.warn(`[gemini] stream ${model} returned ${res.status}, falling back to ${MODELS.fallback}`);
      continue;
    }

    if (!res.ok || !res.body) {
      return { ok: false, status: res.status, response: null, model };
    }

    return { ok: true, status: 200, response: res, model };
  }

  return { ok: false, status: 429, response: null };
}

export function extractDeltaText(ev: unknown): string {
  const e = ev as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return e?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}
