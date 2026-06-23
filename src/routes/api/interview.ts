// /api/interview — Gemini-backed interview simulator endpoint.
// Modes: "chat" (assistant reply with optional MCQ), "options_only" (generate
// MCQ for an existing opener), "feedback" (full evaluation at the end).
//
// Auth model:
//   - Guests may use mode "chat" up to 5 times per day per IP+fingerprint.
//   - Logged-in users follow FREE_INTERVIEW_CAP (free) or unlimited (Pro).
//   - mode "feedback" requires login (it's the post-session evaluation).

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
} from "@/lib/security.server";
import {
  checkGuestLimit,
  deriveGuestKey,
  incrementGuestLimit,
} from "@/lib/guest-rate-limit.server";
import { getScenario } from "@/lib/interview-scenarios";
import { FREE_INTERVIEW_CAP } from "@/lib/usage.functions";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(800),
});

const InputSchema = z.object({
  scenarioId: z.string().trim().min(1).max(40),
  mode: z.enum(["chat", "options_only", "feedback"]).default("chat"),
  lang: z.enum(["id", "en"]).optional().default("id"),
  langMode: z.enum(["jp_only", "jp_romaji", "jp_translation"]).optional().default("jp_romaji"),
  answerMode: z.enum(["free", "mcq"]).optional().default("free"),
  messages: z.array(MessageSchema).min(0).max(40),
  questionJp: z.string().trim().max(800).optional(),
  guestFingerprint: z.string().trim().max(64).optional(),
});

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

async function callGemini(prompt: string, temperature = 0.7): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("SERVER_MISCONFIGURED");
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
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
    // Try to extract the first {...} block.
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

export const Route = createFileRoute("/api/interview")({
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

        const {
          scenarioId,
          mode,
          lang,
          langMode,
          answerMode,
          messages,
          questionJp,
          guestFingerprint,
        } = parsed.data;

        const scenario = getScenario(scenarioId);
        if (!scenario) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);

        // Sanitize all user message content.
        for (const m of messages) {
          const s = sanitizeInput(m.content);
          if (!s.ok || isInappropriate(s.value)) {
            return jsonResponse({ error: "INAPPROPRIATE" }, 400, allowedOrigin);
          }
          m.content = s.value;
        }
        if (questionJp) {
          const s = sanitizeInput(questionJp);
          if (!s.ok) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
        }

        // Identify caller.
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

        // Pro/free gating + rate limit.
        if (!userId) {
          // Guest path.
          if (mode === "feedback") {
            return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
          }
          if (!scenario.free) {
            return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
          }
          if (mode === "chat") {
            const key = deriveGuestKey(ip, guestFingerprint ?? null);
            const limit = await checkGuestLimit("iv", key, 5);
            if (!limit.ok) {
              return jsonResponse(
                { error: "GUEST_LIMIT_REACHED", used: limit.used, cap: limit.cap },
                429,
                allowedOrigin,
              );
            }
          }
        } else if (!isPro && mode === "chat") {
          const used = await countEventsForUser(
            userId,
            ["interview_message"],
            hoursAgoIso(24),
          );
          if (used >= FREE_INTERVIEW_CAP * 10) {
            // Free chat cap (10x feedback cap for chat turns). Adjust as needed.
            return jsonResponse({ error: "RATE_LIMITED" }, 429, allowedOrigin);
          }
        }

        // Build prompts.
        const explLang = lang === "en" ? "English" : "Indonesian";
        const includeRomaji = langMode !== "jp_only";
        const includeTranslation = langMode === "jp_translation";

        try {
          if (mode === "chat") {
            const history = messages
              .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
              .join("\n");

            const prompt = `You are roleplaying as a Japanese job interviewer in a practice app.

Scenario: ${scenario.title_en}
Persona: ${scenario.persona}
Politeness target: keigo / business Japanese.

Conversation so far:
${history || "(no messages yet — start with a fresh question)"}

Reply ONLY with raw JSON matching this schema, no markdown:
{
  "japanese": "natural spoken Japanese reply, 1–3 sentences, ending with exactly ONE question",
  "romaji": ${includeRomaji ? `"romaji of the Japanese above"` : `null`},
  "translation": ${includeTranslation ? `"${explLang} translation of the Japanese above"` : `null`}${
              answerMode === "mcq"
                ? `,
  "options": [
    {"text": "natural Japanese answer option A", "romaji": "...", "translation": "${explLang} ..."},
    {"text": "Japanese answer option B", "romaji": "...", "translation": "${explLang} ..."},
    {"text": "Japanese answer option C", "romaji": "...", "translation": "${explLang} ..."}
  ],
  "correct_index": 0`
                : `,
  "options": null,
  "correct_index": 0`
            }
}

Rules:
- Stay strictly in character as ${scenario.role_en}.
- Keep Japanese short, natural, and conversational.
- Never break the fourth wall, never explain.
- If the candidate just sent a greeting, respond appropriately and ask one new question.`;

            const raw = await callGemini(prompt, 0.7);
            const obj = parseJson<{
              japanese?: string;
              romaji?: string | null;
              translation?: string | null;
              options?: { text: string; romaji?: string | null; translation?: string | null }[] | null;
              correct_index?: number;
            }>(raw);
            if (!obj || !obj.japanese) {
              throw new Error("INVALID_RESPONSE");
            }
            const structured = {
              japanese: obj.japanese,
              romaji: obj.romaji ?? null,
              translation: obj.translation ?? null,
              options: obj.options ?? null,
              correct_index: typeof obj.correct_index === "number" ? obj.correct_index : 0,
            };

            // Audit + increment guest counter on success.
            if (!userId) {
              await incrementGuestLimit(
                "iv",
                deriveGuestKey(ip, guestFingerprint ?? null),
              );
            }
            await audit({
              event_type: "interview_message",
              ip_address: ip,
              user_id: userId,
              success: true,
              metadata: { scenarioId, mode },
            });
            return jsonResponse({ structured, reply: obj.japanese }, 200, allowedOrigin);
          }

          if (mode === "options_only") {
            if (!questionJp) {
              return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
            }
            const prompt = `You are a Japanese interview-coach generating multiple-choice answer options.

Scenario: ${scenario.title_en}
Persona: ${scenario.persona}
Interviewer's question (Japanese): ${questionJp}

Reply ONLY with raw JSON, no markdown:
{
  "options": [
    {"text": "first natural Japanese candidate reply", "romaji": "...", "translation": "${explLang} ..."},
    {"text": "second Japanese candidate reply", "romaji": "...", "translation": "${explLang} ..."},
    {"text": "third Japanese candidate reply", "romaji": "...", "translation": "${explLang} ..."}
  ],
  "correct_index": 0
}

Rules: keep each option to 1–2 sentences; use keigo. Make all 3 plausible, but mark the most polite/contextually fitting one as correct_index.`;
            const raw = await callGemini(prompt, 0.6);
            const obj = parseJson<{
              options?: { text: string; romaji?: string | null; translation?: string | null }[];
              correct_index?: number;
            }>(raw);
            if (!obj || !Array.isArray(obj.options) || obj.options.length === 0) {
              throw new Error("INVALID_RESPONSE");
            }
            return jsonResponse(
              {
                structured: {
                  japanese: "",
                  romaji: null,
                  translation: null,
                  options: obj.options,
                  correct_index: obj.correct_index ?? 0,
                },
              },
              200,
              allowedOrigin,
            );
          }

          // mode === "feedback"
          if (messages.length === 0) {
            return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
          }
          const transcript = messages
            .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
            .join("\n");
          const fbPrompt = `You are a Japanese-interview evaluator. Analyze the CANDIDATE's Japanese only (ignore the interviewer's lines). Reply ONLY with raw JSON, no markdown:

{
  "grammar_score": 0-100,
  "naturalness_score": 0-100,
  "confidence_score": 0-100,
  "summary": "${explLang} 2-3 sentence overall summary",
  "strengths": ["${explLang} short positive", "..."],
  "improvements": [
    {"issue": "candidate's phrase", "suggestion": "improved Japanese", "explanation": "${explLang}"}
  ],
  "next_step": "${explLang} one short tip for the next session"
}

Scenario: ${scenario.title_en}
Persona: ${scenario.persona}

Transcript:
${transcript}

Keep strengths to max 3, improvements to max 3. If candidate did not really speak Japanese, set all scores to 0 and explain in ${explLang}.`;
          const raw = await callGemini(fbPrompt, 0.3);
          const evaluation = parseJson(raw);
          if (!evaluation) throw new Error("INVALID_RESPONSE");
          await audit({
            event_type: "interview_feedback",
            ip_address: ip,
            user_id: userId,
            success: true,
            metadata: { scenarioId },
          });
          return jsonResponse({ evaluation }, 200, allowedOrigin);
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
            event_type: "interview_fail",
            ip_address: ip,
            user_id: userId,
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
