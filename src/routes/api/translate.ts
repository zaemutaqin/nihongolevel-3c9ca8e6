import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, pickAllowedOrigin, sanitizeInput } from "@/lib/security.server";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
});

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const allowedOrigin = pickAllowedOrigin(request);
        if (!allowedOrigin) return jsonResponse({ error: "forbidden" }, 403, null);

        let body;
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "bad_json" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        const sane = sanitizeInput(parsed.data.sentence);
        if (!sane.ok) return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "no_key" }, 500, allowedOrigin);

        const prompt = `Japanese communication coach. Return ONLY valid JSON (no markdown).
Input: "${sane.value}"
Mood: ${parsed.data.mood || "auto"}

{
  "intent": { "type": "casual_conversation", "explanation": "Singkat saja." },
  "social_analysis": { "relationship": "Singkat", "emotion": "Singkat", "communication_goal": "Singkat", "wrong_context_risk": "Singkat" },
  "most_natural": { "japanese": "...", "romaji": "...", "reason": "Singkat", "native_note": "Singkat" },
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

Rules:
- Jangan buat data untuk 'styles', gunakan placeholder '-' dan array kosong [].
- Berikan penjelasan sesingkat mungkin.
- Fokus pada 'most_natural' dan 'alternatives'.`;

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" },
              }),
            },
          );

          const result = await response.json();
          if (!response.ok) throw new Error("Gemini API error");

          const rawText = result.candidates[0].content.parts[0].text;
          const cleanedText = rawText
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          return new Response(cleanedText, {
            headers: {
              "Content-Type": "application/json",
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        } catch (e) {
          console.error("Translation failed:", e);
          return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
        }
      },
    },
  },
});
