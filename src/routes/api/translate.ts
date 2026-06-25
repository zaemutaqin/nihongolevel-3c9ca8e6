import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cleanJapanese } from "@/lib/translate.functions";
import {
  audit,
  clientIp,
  countEventsForIp,
  countEventsForUser,
  hoursAgoIso,
  isInappropriate,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  redactPersonalData,
  sanitizeInput,
  securityHeaders,
} from "@/lib/security.server";

// Limit diubah menjadi 100.000 agar bebas tanpa batas
const GUEST_DAY_MAX = 100000;
const FREE_DAY_MAX = 100000;
const PRO_DAY_MAX = 100000;
const IP_HOUR_BLOCK = 100000;
const USER_DAY_FLAG = 500;

const JAPANESE_RE = /[\u3000-\u9fff\u3400-\u4dbf\u30a0-\u30ff\u3040-\u309f]/;

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
  lang: z.enum(["id", "en"]).optional().default("id"),
});

const STYLE_KEYS = ["dasar", "sehari_hari", "ekspresif", "mendekati_native"] as const;

function findBalanced(buf: string, startIdx: number): number {
  const open = buf[startIdx];
  if (open !== "{" && open !== "[") return -1;
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = startIdx; i < buf.length; i++) {
    const c = buf[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
    } else {
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

function tryExtract(buf: string, key: string, expectArray = false): { value: unknown } | null {
  const re = new RegExp(`"${key}"\\s*:\\s*`);
  const m = re.exec(buf);
  if (!m) return null;
  const start = m.index + m[0].length;
  if (start >= buf.length) return null;
  const expectedOpen = expectArray ? "[" : "{";
  if (buf[start] !== expectedOpen) return null;
  const end = findBalanced(buf, start);
  if (end < 0) return null;
  try {
    return { value: JSON.parse(buf.slice(start, end + 1)) };
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(pickAllowedOrigin(request)),
      POST: async ({ request }) => {
        const allowedOrigin = pickAllowedOrigin(request);
        if (!allowedOrigin) return jsonResponse({ error: "forbidden_origin" }, 403, null);
        const ip = clientIp(request);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        const sane = sanitizeInput(parsed.data.sentence);
        if (!sane.ok) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
        let userId: string | null = null;
        let isPro = false;
        if (token) {
          const { data: udata } = await supabaseAdmin.auth.getUser(token);
          if (udata?.user) {
            userId = udata.user.id;
            const { data: prof } = await supabaseAdmin.from("profiles").select("is_pro").eq("id", userId).maybeSingle();
            isPro = !!prof?.is_pro;
          }
        }

        // Logic limit dinaikkan ke 100.000 agar tidak pernah kena blokir
        const dayAgo = hoursAgoIso(24);
        let dayCount = userId
          ? await countEventsForUser(userId, ["translate_success"], dayAgo)
          : await countEventsForIp(ip, ["translate_success"], dayAgo);
        if (dayCount > GUEST_DAY_MAX) return jsonResponse({ error: "limit_reached" }, 429, allowedOrigin);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "server_misconfigured" }, 500, allowedOrigin);

        const { lang } = parsed.data;
        const explLang = lang === "en" ? "en" : "id";
        const explLangFull = lang === "en" ? "English" : "Indonesian";

        const prompt = `Japanese communication coach. Return ONLY raw JSON, no markdown.
Input: "${sane.value}"
Mood: ${parsed.data.mood || "auto"}

{
  "intent": { "type": "casual_conversation", "explanation": "Short ${explLang} explanation" },
  "social_analysis": { "relationship": "${explLang}", "emotion": "${explLang}", "communication_goal": "${explLang}", "wrong_context_risk": "Short ${explLang} warning" },
  "most_natural": { "japanese": "...", "romaji": "...", "reason": "Short ${explLang} reason", "native_note": "Short ${explLang} note" },
  "styles": {
    "dasar": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N4" },
    "sehari_hari": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N3" },
    "ekspresif": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N2" },
    "mendekati_native": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N1" }
  },
  "alternatives": [
    { "rank": 1, "role_label": "Paling Umum Digunakan", "japanese": "...", "romaji": "...", "explanation": "Short ${explLang}" },
    { "rank": 2, "role_label": "Lebih Sopan", "japanese": "...", "romaji": "...", "explanation": "Short ${explLang}" },
    { "rank": 3, "role_label": "Untuk Situasi Formal", "japanese": "...", "romaji": "...", "explanation": "Short ${explLang}" }
  ]
}

Rules:
- Write all ${explLang} fields in ${explLangFull} (MAX 10 words).
- DO NOT generate actual data for 'styles' object content. Use placeholders '-' and empty arrays '[]'.
- Focus ONLY on 'most_natural' and 'alternatives'.`;

        const { geminiStream, extractDeltaText } = await import("@/lib/gemini.server");
        const streamRes = await geminiStream({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          maxOutputTokens: 8192,
          json: true,
        });

        if (!streamRes.ok || !streamRes.response) return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);

        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            const reader = streamRes.response!.body!.getReader();
            let textBuf = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              textBuf += extractDeltaText(JSON.parse(new TextDecoder().decode(value).split("data: ")[1] || "{}"));
            }
            controller.enqueue(enc.encode(textBuf));
            controller.close();
          },
        });

        return new Response(stream, {
          headers: { "Content-Type": "application/json", ...securityHeaders(allowedOrigin) },
        });
      },
    },
  },
});
