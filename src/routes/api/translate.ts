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

// Limit dinaikkan agar bebas
const GUEST_DAY_MAX = 100000;
const FREE_DAY_MAX = 100000;
const PRO_DAY_MAX = 100000;
const IP_HOUR_BLOCK = 100000;

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
  lang: z.enum(["id", "en"]).optional().default("id"),
});

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(pickAllowedOrigin(request)),
      POST: async ({ request }) => {
        const allowedOrigin = pickAllowedOrigin(request);
        if (!allowedOrigin) return jsonResponse({ error: "forbidden" }, 403, null);
        const ip = clientIp(request);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "bad_json" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "no_key" }, 500, allowedOrigin);

        const prompt = `Japanese communication coach. Return ONLY raw JSON (no markdown).
Input sentence: "${parsed.data.sentence}"
Listener: ${parsed.data.listener || "auto"}
Mood: ${parsed.data.mood || "auto"}

{
  "intent": { "type": "casual", "explanation": "Short explanation" },
  "social_analysis": { "relationship": "...", "emotion": "...", "communication_goal": "...", "wrong_context_risk": "..." },
  "most_natural": { "japanese": "...", "romaji": "...", "reason": "...", "native_note": "..." },
  "styles": {
    "dasar": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N4" },
    "sehari_hari": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N3" },
    "ekspresif": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N2" },
    "mendekati_native": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "when_to_use": "-", "suitable_for": "-", "impression": "-", "why_this_style": "-", "grammar": [], "kanji": [], "jlpt_reference": "N1" }
  },
  "alternatives": [
    { "rank": 1, "role_label": "Paling Umum", "japanese": "...", "romaji": "...", "explanation": "..." },
    { "rank": 2, "role_label": "Lebih Sopan", "japanese": "...", "romaji": "...", "explanation": "..." },
    { "rank": 3, "role_label": "Formal", "japanese": "...", "romaji": "...", "explanation": "..." }
  ]
}

Rules: Keep ALL explanations extremely concise (MAX 10 words). DO NOT generate content for 'styles' object content (use placeholders).`;

        const { geminiStream } = await import("@/lib/gemini.server");
        const streamRes = await geminiStream({
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          maxOutputTokens: 8192,
          json: true,
        });

        if (!streamRes.ok || !streamRes.response || !streamRes.response.body) {
          console.error("Gemini stream error", streamRes.status);
          return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
        }

        const reader = streamRes.response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Cukup ambil teksnya saja tanpa memproses JSON yang rumit untuk sekarang
            fullText += chunk;
          }
        } catch (e) {
          console.error("Stream read error", e);
        }

        // Pembersihan string yang aman (tanpa RegExp rumit)
        let cleaned = fullText.replace(/data: /g, "").replace(/\[DONE\]/g, "");
        cleaned = cleaned.split("```json").join("").split("```").join("").trim();

        try {
          const finalData = JSON.parse(cleaned);
          return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json", ...securityHeaders(allowedOrigin) },
          });
        } catch (e) {
          console.error("JSON Parse Error. Raw output:", cleaned);
          return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);
        }
      },
    },
  },
});
