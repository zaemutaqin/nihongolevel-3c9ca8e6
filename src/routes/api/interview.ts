import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  audit,
  clientIp,
  countEventsForUser,
  hoursAgoIso,
  isInappropriate,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  sanitizeInput,
} from "@/lib/security.server";
import { getInterviewScenario } from "@/lib/interview-scenarios";

// Free plan: 2 interview sessions per day. Pro: unlimited.
const FREE_DAY_SESSIONS = 2;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(1200),
});

const InputSchema = z.object({
  scenarioId: z.string().trim().min(1).max(40),
  messages: z.array(MessageSchema).min(0).max(60),
  mode: z.enum(["chat", "feedback", "options_only"]).default("chat"),
  lang: z.enum(["id", "en"]).optional().default("id"),
  // langMode controls what extras (romaji / translation) the API computes for the next question.
  langMode: z.enum(["translate", "romaji", "fullJp"]).optional().default("translate"),
  // answerMode === "mcq" → API also generates 4 candidate options + correct_index for the new question.
  answerMode: z.enum(["mcq", "mic", "type"]).optional().default("type"),
  // For mode === "options_only": question to generate options for.
  questionJp: z.string().trim().max(800).optional(),
  sessionId: z.string().uuid().optional(),
});

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

        const { scenarioId, messages, mode, lang, sessionId } = parsed.data;
        const scenario = getInterviewScenario(scenarioId);
        if (!scenario) return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);

        // Sanitize all user messages
        for (const m of messages) {
          const s = sanitizeInput(m.content);
          if (!s.ok || isInappropriate(s.value)) {
            return jsonResponse({ error: "INAPPROPRIATE" }, 400, allowedOrigin);
          }
          m.content = s.value;
        }

        // Auth — usually required, but allow guest demo for iv_kaigo (chat mode, max 3 user turns)
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        const userTurnCount = messages.filter((m) => m.role === "user").length;
        const isGuestDemo =
          !token &&
          scenarioId === "iv_kaigo" &&
          mode === "chat" &&
          userTurnCount > 0 &&
          userTurnCount <= 3;

        let userId: string | null = null;
        let isPro = false;
        if (!isGuestDemo) {
          if (!token) return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
          const { data: udata } = await supabaseAdmin.auth.getUser(token);
          if (!udata?.user) return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
          userId = udata.user.id;
          const { data: prof } = await supabaseAdmin
            .from("profiles")
            .select("is_pro")
            .eq("id", userId)
            .maybeSingle();
          isPro = !!prof?.is_pro;
        }

        // Daily session cap for free users — counted by feedback events (= completed sessions).
        if (userId && !isPro && mode === "feedback") {
          const dayAgo = hoursAgoIso(24);
          const used = await countEventsForUser(userId, ["interview_feedback"], dayAgo);
          if (used >= FREE_DAY_SESSIONS) {
            return jsonResponse(
              { error: "DAILY_LIMIT", retry_after: 86400 },
              429,
              allowedOrigin,
              { "Retry-After": "86400" },
            );
          }
        }


        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return jsonResponse({ error: "SERVER_MISCONFIGURED" }, 500, allowedOrigin);

        const explLang = lang === "en" ? "English" : "Indonesian";

        if (mode === "chat") {
          const systemPrompt = `You are an AI roleplaying as a Japanese interviewer.

Scenario: ${scenario.title_en}
Role: ${scenario.role_en}
Persona: ${scenario.persona}

CRITICAL RULES:
- Reply ONLY in Japanese (hiragana / katakana / kanji). Never translate.
- Stay in character throughout.
- Keep replies short (1-3 sentences).
- Ask one question at a time.
- If the user types in romaji or another language, ask them politely in Japanese to answer in Japanese.`;

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
              max_tokens: 220,
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
              event_type: "interview_fail",
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

          await audit({
            event_type: "interview_message",
            ip_address: ip,
            user_id: userId,
            success: true,
            metadata: { scenarioId, turn: messages.length },
          });
          return jsonResponse({ reply }, 200, allowedOrigin);
        }

        // mode === "feedback" — generate evaluation + save session (auth required, guarded above)
        if (!userId) return jsonResponse({ error: "AUTH_REQUIRED" }, 401, allowedOrigin);
        if (messages.length === 0) {
          return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
        }

        const transcript = messages
          .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
          .join("\n");

        const feedbackPrompt = `You are a Japanese language coach evaluating a candidate's performance in a Japanese job interview roleplay.

Scenario: ${scenario.title_en} (${scenario.role_en})

Full transcript:
${transcript}

Analyze ONLY the CANDIDATE's Japanese. Return ONLY raw JSON, no markdown:
{
  "grammar_score": 0-100,
  "naturalness_score": 0-100,
  "confidence_score": 0-100,
  "vocabulary_level": "N5" | "N4" | "N3" | "N2" | "N1",
  "summary": "${explLang} 2-3 sentence overall summary",
  "suggestions": [
    {"point": "${explLang} short title", "detail": "${explLang} 1-2 sentence explanation with a Japanese example if useful"}
  ]
}

Rules:
- Write summary and suggestion text in ${explLang}.
- Provide 3 to 5 suggestions.
- grammar_score reflects correctness of particles, conjugation, politeness.
- naturalness_score reflects whether phrasing sounds like a real Japanese speaker.
- confidence_score reflects clarity, completeness, and willingness to elaborate.
- If the candidate barely used Japanese (mostly romaji / English / Indonesian), set all scores low (0-30) and explain in ${explLang}.`;

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
            max_tokens: 1200,
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

        let evalObj: {
          grammar_score: number;
          naturalness_score: number;
          confidence_score: number;
          vocabulary_level: string;
          summary: string;
          suggestions: { point: string; detail: string }[];
        };
        try {
          evalObj = JSON.parse(cleaned);
        } catch {
          return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);
        }

        // Persist session
        const row = {
          user_id: userId,
          scenario_id: scenario.id,
          scenario_title: scenario.title_en,
          transcript: messages,
          grammar_score: clampScore(evalObj.grammar_score),
          naturalness_score: clampScore(evalObj.naturalness_score),
          confidence_score: clampScore(evalObj.confidence_score),
          vocabulary_level: evalObj.vocabulary_level ?? null,
          suggestions: evalObj.suggestions ?? [],
          summary: evalObj.summary ?? null,
          completed: true,
        };
        let savedId: string | null = null;
        if (sessionId) {
          const { data: upd, error: uerr } = await supabaseAdmin
            .from("interview_sessions")
            .update(row)
            .eq("id", sessionId)
            .eq("user_id", userId)
            .select("id")
            .maybeSingle();
          if (!uerr && upd) savedId = upd.id;
        }
        if (!savedId) {
          const { data: ins, error: ierr } = await supabaseAdmin
            .from("interview_sessions")
            .insert(row)
            .select("id")
            .maybeSingle();
          if (!ierr && ins) savedId = ins.id;
        }

        await audit({
          event_type: "interview_feedback",
          ip_address: ip,
          user_id: userId,
          success: true,
          metadata: { scenarioId, turns: messages.length },
        });

        return jsonResponse(
          { evaluation: evalObj, sessionId: savedId },
          200,
          allowedOrigin,
        );
      },
    },
  },
});

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}
