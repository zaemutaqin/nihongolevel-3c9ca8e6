import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, pickAllowedOrigin } from "@/lib/security.server";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "server_misconfigured" }, 500, allowedOrigin);

        const prompt = `Japanese communication coach. Return ONLY valid JSON (no markdown).
        Translate: "${parsed.data.sentence}"
        
        {
          "intent": { "type": "casual", "explanation": "..." },
          "social_analysis": { "relationship": "...", "emotion": "...", "communication_goal": "...", "wrong_context_risk": "..." },
          "most_natural": { "japanese": "...", "romaji": "...", "reason": "...", "native_note": "..." },
          "styles": {
            "dasar": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "grammar": [], "kanji": [], "jlpt_reference": "N4" },
            "sehari_hari": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "grammar": [], "kanji": [], "jlpt_reference": "N3" },
            "ekspresif": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "grammar": [], "kanji": [], "jlpt_reference": "N2" },
            "mendekati_native": { "japanese": "-", "romaji": "-", "naturalness": "stiff", "grammar": [], "kanji": [], "jlpt_reference": "N1" }
          },
          "alternatives": [
            { "role_label": "Paling Umum", "japanese": "...", "romaji": "...", "explanation": "..." },
            { "role_label": "Sopan", "japanese": "...", "romaji": "...", "explanation": "..." },
            { "role_label": "Formal", "japanese": "...", "romaji": "...", "explanation": "..." }
          ]
        }`;

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
          const finalData = JSON.parse(result.candidates[0].content.parts[0].text);

          return new Response(JSON.stringify(finalData), {
            headers: {
              "Content-Type": "application/json",
              ...(allowedOrigin ? { "Access-Control-Allow-Origin": allowedOrigin } : {}),
            },
          });
        } catch (e) {
          console.error("Translate error:", e);
          return jsonResponse({ error: "AI_UNAVAILABLE" }, 502, allowedOrigin);
        }
      },
    },
  },
});
