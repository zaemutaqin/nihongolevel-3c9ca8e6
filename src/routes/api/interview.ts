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

        const { scenarioId, messages, mode, lang, langMode, answerMode, questionJp, sessionId } = parsed.data;
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
          (mode === "chat" || mode === "options_only") &&
          ((mode === "options_only" && userTurnCount <= 3) ||
            (mode === "chat" && userTurnCount > 0 && userTurnCount <= 3));

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


        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return jsonResponse({ error: "SERVER_MISCONFIGURED" }, 500, allowedOrigin);

        const explLang = lang === "en" ? "English" : "Indonesian";

        if (mode === "chat" || mode === "options_only") {
          const wantRomaji = langMode === "romaji" || mode === "options_only";
          const wantTranslation = langMode === "translate";
          const wantOptions = answerMode === "mcq" || mode === "options_only";

          // Build the JSON schema-style template inside the prompt.
          const extras: string[] = [`"japanese": "<Japanese question, hiragana/katakana/kanji only>"`];
          if (wantRomaji) extras.push(`"romaji": "<Hepburn romaji of japanese, lowercase>"`);
          if (wantTranslation) extras.push(`"translation": "<${explLang} translation of japanese>"`);
          if (wantOptions) {
            extras.push(
              `"options": [{"text":"<Japanese candidate answer #1 (the MOST natural / correct one)>","romaji":"<romaji>","feedback":"<short ${explLang} note on why this answer fits>"}, {"text":"...","romaji":"...","feedback":"..."}, {"text":"...","romaji":"...","feedback":"..."}, {"text":"...","romaji":"...","feedback":"..."}]`,
              `"correct_index": 0`,
            );
          }
          const jsonTemplate = `{\n  ${extras.join(",\n  ")}\n}`;

          let systemPrompt: string;
          let modelMessages: { role: string; content: string }[];

          if (mode === "options_only") {
            if (!questionJp) {
              return jsonResponse({ error: "INVALID_INPUT" }, 400, allowedOrigin);
            }
            systemPrompt = `You generate 4 candidate Japanese reply options for a learner who is being interviewed in the scenario below.

Scenario: ${scenario.title_en}
Role: ${scenario.role_en}
Persona context: ${scenario.persona}

The interviewer just asked the candidate:
「${questionJp}」

Return ONLY raw JSON (no markdown) matching this exact shape:
${jsonTemplate}

Rules:
- All 4 option "text" fields must be in Japanese (hiragana / katakana / kanji). No romaji, no English.
- Option index 0 MUST be the most natural / appropriate answer. The other 3 are plausible but each has a small problem (too casual, wrong particle, off-topic, etc.).
- "feedback" is a short ${explLang} note explaining why that specific option is/isn't ideal (max 20 words).
- "correct_index" must always be 0.
- Keep each option to ONE short sentence (under 60 Japanese characters).`;
            modelMessages = [{ role: "user", content: systemPrompt }];
          } else {
            systemPrompt = `You are an AI roleplaying as a Japanese interviewer.

Scenario: ${scenario.title_en}
Role: ${scenario.role_en}
Persona: ${scenario.persona}

CRITICAL RULES:
- The "japanese" field must contain ONLY Japanese (hiragana / katakana / kanji). Never romaji or English in that field.
- Stay in character throughout. Keep the japanese question to 1-3 short sentences. Ask one question at a time.
- If the user types in romaji or another language, in your japanese question politely ask them in Japanese to answer in Japanese (「日本語でお願いします」 style).

OUTPUT FORMAT:
Return ONLY raw JSON (no markdown, no commentary) matching this exact shape:
${jsonTemplate}

${
  wantOptions
    ? `Rules for "options":
- 4 candidate Japanese replies a learner could give to YOUR japanese question.
- Index 0 MUST be the most natural / appropriate answer. The other 3 are plausible but each has a small problem.
- "feedback" is a short ${explLang} note (max 20 words). "correct_index" must always be 0.
- One short Japanese sentence per option (under 60 chars).`
    : ""
}`;
            modelMessages = [
              { role: "system", content: systemPrompt },
              ...messages,
            ];
          }

          const { geminiGenerate } = await import("@/lib/gemini.server");
          const upstream = await geminiGenerate({
            messages: modelMessages as { role: "system" | "user" | "assistant"; content: string }[],
            temperature: mode === "options_only" ? 0.6 : 0.8,
            maxOutputTokens: wantOptions ? 700 : 320,
            json: true,
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
            // MODIFIKASI: Menambahkan pesan asli Google di sini!
            return jsonResponse({ error: code, google_detail: upstream.text }, upstream.status, allowedOrigin);
          }
          const raw = upstream.text.trim();
          const cleaned = raw
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*
```$/i, "")
            .trim();

          let parsedReply: {
            japanese?: string;
            romaji?: string;
            translation?: string;
            options?: { text: string; romaji?: string; feedback?: string }[];
            correct_index?: number;
          };
          try {
            parsedReply = JSON.parse(cleaned);
          } catch {
            // Fallback: treat the raw output as the japanese question.
            parsedReply = { japanese: raw };
          }
          const japanese = (parsedReply.japanese ?? "").trim();
          if (!japanese && mode !== "options_only") {
            return jsonResponse({ error: "INVALID_RESPONSE" }, 502, allowedOrigin);
          }

          await audit({
            event_type: "interview_message",
            ip_address: ip,
            user_id: userId,
            success: true,
            metadata: { scenarioId, turn: messages.length, mode, answerMode },
          });

          return jsonResponse(
            {
              // Back-compat: top-level `reply` is the japanese string.
              reply: japanese,
              structured: {
                japanese,
                romaji: parsedReply.romaji ?? null,
                translation: parsedReply.translation ?? null,
                options: Array.isArray(parsedReply.options) ? parsedReply.options.slice(0, 4) : null,
                correct_index:
                  typeof parsedReply.correct_index === "number" ? parsedReply.correct_index : 0,
              },
            },
            200,
            allowedOrigin,
          );
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

        const { geminiGenerate: geminiGenerateFb } = await import("@/lib/gemini.server");
        const upstream = await geminiGenerateFb({
          messages: [{ role: "user", content: feedbackPrompt }],
          temperature: 0.3,
          maxOutputTokens: 1200,
          json: true,
        });
        if (!upstream.ok) {
          const code =
            upstream.status === 429
              ? "RATE_LIMITED"
              : upstream.status === 402
                ? "CREDITS_EXHAUSTED"
                : "AI_UNAVAILABLE";
          // MODIFIKASI: Menambahkan pesan asli Google di sini juga!
          return jsonResponse({ error: code, google_detail: upstream.text }, upstream.status, allowedOrigin);
        }
        const raw = upstream.text.trim();
        const cleaned = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*
```$/i, "")
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