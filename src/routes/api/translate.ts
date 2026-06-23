// /api/translate — Gemini-backed Japanese translation endpoint.
//
// The client (src/routes/translate.tsx) expects a newline-delimited JSON
// stream with these event types:
//   {type:"section", key:"intent"|"social_analysis"|"most_natural"|"alternatives", value:...}
//   {type:"style", styleKey:"dasar"|"sehari_hari"|"ekspresif"|"mendekati_native", value:...}
//   {type:"done", full:{...}}
//   {type:"error", error:"CODE"}
//
// We make one Gemini call that returns the full structured result, then emit
// each event sequentially so the existing streaming UI keeps working.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  audit,
  clientIp,
  hoursAgoIso,
  countEventsForUser,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  sanitizeInput,
  isInappropriate,
  redactPersonalData,
  securityHeaders,
} from "@/lib/security.server";
import {
  checkGuestLimit,
  deriveGuestKey,
  incrementGuestLimit,
} from "@/lib/guest-rate-limit.server";
import { FREE_TRANSLATE_CAP } from "@/lib/usage.functions";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(40).optional(),
  mood: z.string().trim().max(40).optional(),
  lang: z.enum(["id", "en"]).optional().default("id"),
  guestFingerprint: z.string().trim().max(64).optional(),
});

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

const STYLE_KEYS = ["dasar", "sehari_hari", "ekspresif", "mendekati_native"] as const;

function buildPrompt(sentence: string, listener: string | undefined, mood: string | undefined, lang: "id" | "en"): string {
  const explLang = lang === "en" ? "English" : "Indonesian";
  const ctx: string[] = [];
  if (listener) ctx.push(`Listener: ${listener}`);
  if (mood) ctx.push(`Mood: ${mood}`);
  const ctxBlock = ctx.length > 0 ? `Context:\n${ctx.join("\n")}\n\n` : "";

  return `You are a Japanese language coach for ${explLang}-speaking learners. Translate the user's sentence into natural Japanese across four politeness/style registers and analyze the social context.

User sentence (${explLang}): "${sentence}"

${ctxBlock}Reply ONLY with raw JSON, no markdown, matching this exact schema:

{
  "intent": {
    "type": "monolog" | "asking_others" | "casual_conversation" | "professional_formal" | "joking_relaxed",
    "explanation": "${explLang} 1-sentence explanation of the speaker's intent"
  },
  "social_analysis": {
    "relationship": "${explLang} short description of the speaker-listener relationship",
    "emotion": "${explLang} short description of the emotional tone",
    "communication_goal": "${explLang} short description of the communicative goal",
    "wrong_context_risk": "${explLang} short note about misuse risk"
  },
  "most_natural": {
    "japanese": "the single most natural Japanese expression here",
    "romaji": "romaji",
    "level": "N5" | "N4" | "N3" | "N2" | "N1",
    "reason": "${explLang} 1-sentence reason",
    "native_note": "${explLang} optional native-speaker insight"
  },
  "styles": {
    "dasar": ${styleSchema(explLang, "N4", "textbook beginner level")},
    "sehari_hari": ${styleSchema(explLang, "N3", "everyday natural speech")},
    "ekspresif": ${styleSchema(explLang, "N2", "expressive / nuanced")},
    "mendekati_native": ${styleSchema(explLang, "N1", "near-native, idiomatic")}
  },
  "alternatives": [
    {
      "rank": 1,
      "role_label": "Paling Umum Digunakan" | "Lebih Sopan" | "Untuk Monolog" | "Untuk Situasi Formal" | "Pilihan Kasual" | "Paling Natural",
      "context_label": "${explLang} short label for when to use this",
      "japanese": "alternative phrasing",
      "romaji": "romaji",
      "style": "dasar" | "sehari_hari" | "ekspresif" | "mendekati_native",
      "explanation": "${explLang} short reason"
    }
  ]
}

Rules:
- Provide all four styles, even if some feel similar. Differentiate them clearly.
- Each style's "kanji" array lists at most 3 kanji actually appearing in that style's japanese sentence (skip if none).
- Each style's "grammar" array lists at most 2 key grammar patterns used.
- "alternatives" must have 3 to 5 entries with distinct role_label values.
- Romaji uses Hepburn with macrons or doubled vowels; never include Korean/Chinese romanization.
- All explanation/note fields MUST be written in ${explLang}.`;
}

function styleSchema(explLang: string, jlpt: string, hint: string): string {
  return `{
      "japanese": "Japanese sentence (${hint})",
      "romaji": "romaji",
      "naturalness": "native" | "stiff" | "textbook",
      "naturalness_note": "${explLang} 1-sentence note on naturalness",
      "when_to_use": "${explLang} short when-to-use",
      "suitable_for": "${explLang} who/what context this fits",
      "impression": "${explLang} short impression the listener gets",
      "why_this_style": "${explLang} 1-sentence reason this style fits the request",
      "grammar": [
        {"pattern": "grammar pattern", "explanation": "${explLang} short explanation"}
      ],
      "kanji": [
        {"char": "漢", "reading": "kan", "meaning": "${explLang} meaning", "examples": "${explLang} example", "jlpt": "${jlpt}"}
      ],
      "jlpt_reference": "${jlpt}"
    }`;
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("SERVER_MISCONFIGURED");
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMITED");
    if (res.status === 402 || res.status === 403) throw new Error("CREDITS_EXHAUSTED");
    throw new Error("AI_UNAVAILABLE");
  }
  const data = (await res.json()) as GeminiResponse;
  if (data.error) throw new Error("AI_UNAVAILABLE");
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) throw new Error("INVALID_RESPONSE");
  return text;
}

function parseJson<T = unknown>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function streamingResponse(
  full: Record<string, unknown>,
  allowedOrigin: string | null,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      const styles = (full.styles ?? {}) as Record<string, unknown>;
      const alternatives = (full.alternatives ?? []) as unknown[];

      write({ type: "section", key: "intent", value: full.intent });
      write({ type: "section", key: "social_analysis", value: full.social_analysis });
      write({ type: "section", key: "most_natural", value: full.most_natural });
      for (const sk of STYLE_KEYS) {
        if (styles[sk]) {
          write({ type: "style", styleKey: sk, value: styles[sk] });
        }
      }
      write({ type: "section", key: "alternatives", value: alternatives });
      write({ type: "done", full });
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson",
      ...securityHeaders(allowedOrigin),
    },
  });
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(pickAllowedOrigin(request)),

      POST: async ({ request }) => {
        const allowedOrigin = pickAllowedOrigin(request);
        if (!allowedOrigin) return jsonResponse({ error: "FORBIDDEN_ORIGIN" }, 403, null);
        const ip = clientIp(request);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);

        const { sentence, listener, mood, lang, guestFingerprint } = parsed.data;

        const san = sanitizeInput(sentence);
        if (!san.ok) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
        if (isInappropriate(san.value)) {
          return jsonResponse({ error: "INAPPROPRIATE" }, 400, allowedOrigin);
        }
        const { value: cleanedSentence } = redactPersonalData(san.value);

        // Identify caller (optional bearer token).
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        let userId: string | null = null;
        let isPro = false;
        if (token) {
          const { data: udata } = await supabaseAdmin.auth.getUser(token);
          if (udata?.user) {
            userId = udata.user.id;
            const { data: prof } = await supabaseAdmin
              .from("profiles")
              .select("is_pro")
              .eq("id", userId)
              .maybeSingle();
            isPro = !!prof?.is_pro;
          }
        }

        // Rate-limit.
        if (!userId) {
          const key = deriveGuestKey(ip, guestFingerprint ?? null);
          const limit = await checkGuestLimit("tr", key, 5);
          if (!limit.ok) {
            return jsonResponse(
              { error: "RATE_LIMITED", used: limit.used, cap: limit.cap },
              429,
              allowedOrigin,
            );
          }
        } else if (!isPro) {
          const used = await countEventsForUser(
            userId,
            ["translate_success", "translate_fail"],
            hoursAgoIso(24),
          );
          if (used >= FREE_TRANSLATE_CAP) {
            return jsonResponse({ error: "RATE_LIMITED" }, 429, allowedOrigin);
          }
        }

        try {
          const prompt = buildPrompt(cleanedSentence, listener, mood, lang);
          const raw = await callGemini(prompt);
          const obj = parseJson<Record<string, unknown>>(raw);
          if (!obj || !obj.intent || !obj.styles || !obj.most_natural) {
            throw new Error("INVALID_RESPONSE");
          }

          if (!userId) {
            await incrementGuestLimit("tr", deriveGuestKey(ip, guestFingerprint ?? null));
          }
          await audit({
            event_type: "translate_success",
            ip_address: ip,
            user_id: userId,
            input_length: cleanedSentence.length,
            success: true,
          });

          return streamingResponse(obj, allowedOrigin);
        } catch (e) {
          const code = e instanceof Error ? e.message : "AI_UNAVAILABLE";
          const known = new Set([
            "RATE_LIMITED",
            "CREDITS_EXHAUSTED",
            "AI_UNAVAILABLE",
            "INVALID_RESPONSE",
            "SERVER_MISCONFIGURED",
          ]);
          await audit({
            event_type: "translate_fail",
            ip_address: ip,
            user_id: userId,
            input_length: cleanedSentence.length,
            success: false,
            error_code: known.has(code) ? code : "AI_UNAVAILABLE",
          });
          return jsonResponse(
            { error: known.has(code) ? code : "AI_UNAVAILABLE" },
            code === "SERVER_MISCONFIGURED" ? 500 : 502,
            allowedOrigin,
          );
        }
      },
    },
  },
});
