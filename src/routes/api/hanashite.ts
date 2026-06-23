import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  audit,
  clientIp,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  sanitizeInput,
  isInappropriate,
} from "@/lib/security.server";
import { getScenario } from "@/lib/hanashite-scenarios";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(800),
});

const InputSchema = z.object({
  scenarioId: z.string().trim().min(1).max(40),
  messages: z.array(MessageSchema).min(0).max(40),
  mode: z.enum(["chat", "feedback"]).default("chat"),
  lang: z.enum(["id", "en"]).optional().default("id"),
});

export const Route = createFileRoute("/api/hanashite")({
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

        const { scenarioId, messages, mode, lang } = parsed.data;
        const scenario = getScenario(scenarioId);
        if (!scenario) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);

        // Sanitize all user messages
        for (const m of messages) {
          const s = sanitizeInput(m.content);
          if (!s.ok || isInappropriate(s.value)) {
            return jsonResponse({ error: "INAPPROPRIATE" }, 400, allowedOrigin);
          }
          m.content = s.value;
        }

        // Auth resolution + pro gating for locked scenarios.
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
        if (!userId) {
          return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
        }
        if (!scenario.free && !isPro) {
          return jsonResponse({ error: "PRO_REQUIRED" }, 403, allowedOrigin);
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return jsonResponse({ error: "SERVER_MISCONFIGURED" }, 500, allowedOrigin);

        const explLang = lang === "en" ? "English" : "Indonesian";

        if (mode === "chat") {
          const systemPrompt = `You are roleplaying in a Japanese conversation practice app.

Scenario: ${scenario.title_en}
Situation: ${scenario.situation_en}
Persona: ${scenario.persona}

CRITICAL RULES:
- Reply ONLY in Japanese (hiragana, katakana, kanji). No translation.
- Keep replies short and natural (1-3 sentences).
- Stay in character as ${scenario.role_en}.
- Never break the fourth wall. Never explain in English/Indonesian.
- If the user types something unrelated, gently redirect back to the scenario in Japanese.
- Always include furigana-free, natural spoken Japanese (avoid overly literary forms).`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages,
              ],
              temperature: 0.8,
              max_tokens: 200,
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
              event_type: "hanashite_fail",
              ip_address: ip,
              user_id: userId,
              success: false,
              error_code: code,
            });
            return jsonResponse({ error: code }, upstream.status, allowedOrigin);
          }
          const data = await upstream.json();
          const reply = data?.choices?.[0]?.message?.content?.trim() ?? "";
          if (!reply) return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);

          // Also produce romaji (small extra call would be heavy; ask gateway to produce it next time inline)
          // To minimize cost, return only Japanese; client can synthesize speech.
          await audit({
            event_type: "hanashite_success",
            ip_address: ip,
            user_id: userId,
            success: true,
            metadata: { scenarioId, turn: messages.length },
          });
          return jsonResponse({ reply }, 200, allowedOrigin);
        }

        // mode === "feedback"
        if (messages.length === 0) {
          return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
        }
        const transcript = messages
          .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
          .join("\n");

        const feedbackPrompt = `You are a Japanese language tutor analyzing a roleplay conversation.

Scenario: ${scenario.title_en} (${scenario.tone_en})
Target politeness: ${scenario.tone_en}

Conversation transcript:
${transcript}

Analyze the USER's Japanese only (ignore the AI's lines). Return ONLY raw JSON, no markdown:
{
  "politeness_score": 0-100,
  "politeness_note": "${explLang} explanation (1-2 sentences) of whether user matched the target politeness level",
  "grammar": [
    {"issue": "user's phrase that has an issue", "correction": "corrected Japanese", "explanation": "${explLang} explanation"}
  ],
  "strengths": ["${explLang} short positive note", "..."],
  "next_step": "${explLang} 1-sentence suggestion for what to practice next"
}

Rules: Write all explanation fields in ${explLang}. If user has no real Japanese (only romaji/Indonesian), set politeness_score: 0 and explain in ${explLang}. Keep grammar list to max 3 items. Keep strengths to max 3 items.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: feedbackPrompt }],
            temperature: 0.3,
            max_tokens: 800,
          }),
        });
        if (!upstream.ok) {
          const code =
            upstream.status === 429
              ? "RATE_LIMITED"
              : upstream.status === 402
                ? "CREDITS_EXHAUSTED"
                : "AI_UNAVAILABLE";
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
          return jsonResponse({ feedback: obj }, 200, allowedOrigin);
        } catch {
          return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);
        }
      },
    },
  },
});
