// Direct Google Gemini API helper (server-only).
// Replaces the Lovable AI Gateway for interview + translator features.

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}`;

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type GeminiContent = { role: "user" | "model"; parts: { text: string }[] };

function toGeminiContents(messages: ChatMessage[]) {
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

export async function geminiGenerate(opts: GeminiOptions): Promise<{
  ok: boolean;
  status: number;
  text: string;
}> {
  const key = getKey();
  if (!key) return { ok: false, status: 500, text: "API Key not found on server" };

  try {
    const res = await fetch(`${GEMINI_BASE}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(opts)),
    });

    if (!res.ok) {
      // INI BAGIAN PENTING: Menangkap pesan error asli dari Google
      const errorText = await res.text();
      console.error("Gemini API Error:", errorText);
      // Mengirimkan error ke frontend agar bisa kita baca di Inspect Element
      return { ok: false, status: res.status, text: `GOOGLE_ERROR: ${errorText}` };
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return { ok: true, status: 200, text };
  } catch (e: any) {
    return { ok: false, status: 500, text: `SERVER_ERROR: ${e.message}` };
  }
}

/**
 * Streams Gemini output. Returns the raw upstream Response (SSE) plus a helper
 * to extract the text delta from a parsed event JSON.
 */
export async function geminiStream(opts: GeminiOptions): Promise<{
  ok: boolean;
  status: number;
  response: Response | null;
}> {
  const key = getKey();
  if (!key) return { ok: false, status: 500, response: null };

  const res = await fetch(`${GEMINI_BASE}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildBody(opts)),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Gemini Stream Error:", errorText);
    return {
      ok: false,
      status: res.status,
      response: new Response(`GOOGLE_ERROR: ${errorText}`, { status: res.status }),
    };
  }
  return { ok: true, status: 200, response: res };
}

export function extractDeltaText(ev: unknown): string {
  const e = ev as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return e?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}
