import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  audit,
  clientIp,
  countEventsForIp,
  hoursAgoIso,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  sanitizeInput,
  isInappropriate,
} from "@/lib/security.server";

const IP_DAY_MAX = 15;

const InputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  lang: z.enum(["id", "en"]).optional().default("id"),
});

export const Route = createFileRoute("/api/nama-jepang")({
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

        const sName = sanitizeInput(parsed.data.name);
        if (!sName.ok || isInappropriate(sName.value)) {
          return jsonResponse({ error: "INAPPROPRIATE" }, 400, allowedOrigin);
        }
        const name = sName.value;
        const lang = parsed.data.lang;
        const explLang = lang === "en" ? "English" : "Indonesian";

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return jsonResponse({ error: "SERVER_MISCONFIGURED" }, 500, allowedOrigin);

        const prompt = `You convert foreign names into Japanese.

Name: "${name}"

Return ONLY raw JSON (no markdown, no backticks):
{
  "katakana": "the name transliterated into Katakana",
  "romaji": "how the Katakana reads in romaji",
  "ateji": [
    {"kanji": "2-3 character Kanji combination (Ateji) that sounds similar", "reading": "kanji reading in romaji", "meaning": "${explLang} meaning of the Kanji combo, 1 short sentence"}
  ],
  "fun_fact": "${explLang} one short, friendly sentence about the name in Japanese context"
}

Rules:
- Katakana must be a faithful phonetic transliteration.
- Provide exactly 3 Ateji suggestions with positive/neutral meanings.
- Each Ateji's reading should sound close to the original name.
- Never use kanji with negative/dark meanings (death, evil, ugly).
- Keep all text fields short.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 400,
          }),
        });

        if (!upstream.ok) {
          const code =
            upstream.status === 429
              ? "RATE_LIMITED"
              : upstream.status === 402
                ? "CREDITS_EXHAUSTED"
                : "AI_UNAVAILABLE";
          await audit({
            event_type: "name_gen_fail",
            ip_address: ip,
            success: false,
            error_code: code,
          });
          return jsonResponse({ error: code }, upstream.status, allowedOrigin);
        }

        const data = await upstream.json();
        const raw = data?.choices?.[0]?.message?.content?.trim() ?? "";
        const cleaned = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        try {
          const obj = JSON.parse(cleaned);
          await audit({
            event_type: "name_gen_success",
            ip_address: ip,
            success: true,
            metadata: { name_length: name.length },
          });
          return jsonResponse({ result: obj }, 200, allowedOrigin);
        } catch {
          return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);
        }
      },
    },
  },
});
