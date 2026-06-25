import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
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

// Limit dinaikkan 100.000 agar tidak kena blokir
const GUEST_DAY_MAX = 100000;
const FREE_DAY_MAX = 100000;
const PRO_DAY_MAX = 100000;

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
        try { body = await request.json(); } catch { return jsonResponse({ error: "bad_json" }, 400, allowedOrigin); }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        
        const sane = sanitizeInput(parsed.data.sentence);
        if (!sane.ok) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        // API Key Check
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "no_key" }, 500, allowedOrigin);

        // Content
        const { lang } = parsed.data;
        const explLang = lang === "en" ? "English" : "Indonesian";
        const prompt = `Japanese communication coach. Return ONLY valid JSON (no markdown).
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
    { "rank": 1, "role_label": "Paling Umum", "japanese": "...", "romaji": "...", "explanation": "..." },
    { "rank": 2, "role_label": "Lebih Sopan", "japanese": "...", "romaji": "...", "explanation": "..." },
    { "rank": 3, "role_label": "Formal", "japanese": "...", "romaji": "...", "explanation": "..." }
  ]
}

Rules: Keep JSON compact. Use placeholders for 'styles'.`;

        // Direct fetch to Gemini API (Stable, no streaming)
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              }),
            }
          );

          const result = await response.json();
          
          if (!response.ok) {
            console.error("Gemini Error:", JSON.stringify(result));
            return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
          }

          const rawText = result.candidates[0].content.parts[0].text;
          const cleanedText = rawText.replace(/```json/g, "").replace(/
```/g, "").trim();
          const finalData = JSON.parse(cleanedText);

          return new Response(JSON.stringify(finalData), {
            headers: { "Content-Type": "application/json", ...securityHeaders(allowedOrigin) },
          });

        } catch (e) {
          console.error("Fetch/Parse Error:", e);
          return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
        }
      },
    },
  },
});