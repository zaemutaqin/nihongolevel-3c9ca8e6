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

// Per-tier daily caps. Hourly anomaly cap is a hard block above any tier.
// Translator is open: guests get a generous IP-based daily cap to deter
// automated abuse; logged-in users (free or Pro) are effectively unlimited.
const GUEST_DAY_MAX = 20;
const FREE_DAY_MAX = 100000;
const PRO_DAY_MAX = 100000;
const IP_HOUR_BLOCK = 60;        // > this in 1h → 24h block
const USER_DAY_FLAG = 500;       // > this in 24h → flag (still allow)

const JAPANESE_RE = /[\u3000-\u9fff\u3400-\u4dbf\u30a0-\u30ff\u3040-\u309f]/;


const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
  lang: z.enum(["id", "en"]).optional().default("id"),
});

const STYLE_KEYS = ["dasar", "sehari_hari", "ekspresif", "mendekati_native"] as const;
const STYLE_TO_LEVEL: Record<(typeof STYLE_KEYS)[number], "N4" | "N3" | "N2" | "N1"> = {
  dasar: "N4",
  sehari_hari: "N3",
  ekspresif: "N2",
  mendekati_native: "N1",
};

// Find the index of the matching close brace/bracket for the open at startIdx.
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

// Try to extract a complete JSON value at `"key":` inside buf.
function tryExtract(
  buf: string,
  key: string,
  expectArray = false,
): { value: unknown } | null {
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
        if (!allowedOrigin) {
          return jsonResponse({ error: "forbidden_origin" }, 403, null);
        }
        const ip = clientIp(request);

        // ---- Body + input sanitization ----
        let body: unknown;
        try { body = await request.json(); } catch {
          await audit({ event_type: "translate_invalid_input", ip_address: ip, success: false, error_code: "bad_json" });
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) {
          await audit({ event_type: "translate_invalid_input", ip_address: ip, success: false, error_code: "schema" });
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }
        const sane = sanitizeInput(parsed.data.sentence);
        if (!sane.ok) {
          await audit({ event_type: "translate_invalid_input", ip_address: ip, success: false, error_code: "sanitize" });
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }

        // ---- Auth resolution ----
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim() : "";
        let userId: string | null = null;
        let isPro = false;
        if (token) {
          const { data: udata, error: uerr } = await supabaseAdmin.auth.getUser(token);
          if (uerr || !udata.user) {
            await audit({ event_type: "auth_failure", ip_address: ip, success: false, error_code: "invalid_token", metadata: { route: "translate" } });
            return jsonResponse({ error: "unauthorized" }, 401, allowedOrigin);
          }
          userId = udata.user.id;
          const { data: prof } = await supabaseAdmin.from("profiles").select("is_pro").eq("id", userId).maybeSingle();
          isPro = !!prof?.is_pro;
        }

        // ---- Hourly IP anomaly block (applies to everyone, even logged-in) ----
        const ipHour = await countEventsForIp(ip, ["translate_success", "translate_fail"], hoursAgoIso(1));
        if (ipHour > IP_HOUR_BLOCK) {
          await audit({ event_type: "translate_anomaly", ip_address: ip, user_id: userId, success: false, error_code: "ip_hourly", metadata: { count: ipHour } });
          return jsonResponse({ error: "rate_limit_exceeded", retry_after: 86400 }, 429, allowedOrigin, { "Retry-After": "86400" });
        }

        // ---- Per-tier daily caps ----
        const dayAgo = hoursAgoIso(24);
        let dayCount = 0;
        let cap = GUEST_DAY_MAX;
        if (userId) {
          dayCount = await countEventsForUser(userId, ["translate_success", "translate_fail"], dayAgo);
          cap = isPro ? PRO_DAY_MAX : FREE_DAY_MAX;
        } else {
          dayCount = await countEventsForIp(ip, ["translate_success", "translate_fail"], dayAgo);
        }
        if (dayCount >= cap) {
          await audit({ event_type: "translate_rate_limited", ip_address: ip, user_id: userId, success: false, error_code: userId ? "user_daily" : "guest_daily", metadata: { count: dayCount, cap } });
          return jsonResponse({ error: userId ? "rate_limit_exceeded" : "limit_reached", retry_after: 86400 }, 429, allowedOrigin, { "Retry-After": "86400" });
        }
        if (userId && dayCount > USER_DAY_FLAG) {
          // Flag (log) but continue.
          await audit({ event_type: "translate_anomaly", ip_address: ip, user_id: userId, success: true, error_code: "user_high_volume", metadata: { count: dayCount } });
        }

        // ---- Content moderation: redact PII, block obvious abuse ----
        if (isInappropriate(sane.value)) {
          await audit({ event_type: "translate_inappropriate", ip_address: ip, user_id: userId, input_length: sane.value.length, success: false });
          return jsonResponse({ error: "inappropriate_content" }, 400, allowedOrigin);
        }
        const { value: cleanedInput, redacted } = redactPersonalData(sane.value);
        if (redacted) {
          await audit({ event_type: "translate_personal_data_redacted", ip_address: ip, user_id: userId, input_length: sane.value.length, success: true });
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("LOVABLE_API_KEY missing");
          return jsonResponse({ error: "server_misconfigured" }, 500, allowedOrigin);
        }

        const { lang } = parsed.data;
        // Sanitize listener/mood the same way as `sentence` to prevent prompt injection.
        const sanitizeOptional = (raw: string | undefined): string | undefined => {
          if (!raw) return undefined;
          const s = sanitizeInput(raw);
          if (!s.ok) return undefined;
          if (isInappropriate(s.value)) return undefined;
          // Strip characters commonly used in prompt-injection attempts.
          return s.value.replace(/[\r\n`{}<>]/g, " ").slice(0, 100).trim() || undefined;
        };
        const listener = sanitizeOptional(parsed.data.listener);
        const mood = sanitizeOptional(parsed.data.mood);
        const sentence = cleanedInput;
        const inputLength = sane.value.length;
        const isEn = lang === "en";
        const inputLangLabel = isEn ? "English" : "Indonesian";
        const explLang = isEn ? "en" : "id";

        const explLangFull = isEn ? "English" : "Indonesian";

        const englishNote = isEn
          ? `The user is writing in English. Translate and analyze the English input into Japanese expressions. Return all explanation fields in English.\n`
          : "";

        // Compact prompt — schema-only, minimal prose, to reduce both input
        // and output tokens.
        const prompt = `Japanese communication coach. Return ONLY raw JSON, no markdown.
${englishNote}
Input sentence (${inputLangLabel}): "${sentence}"
Listener: ${listener || "auto"}
Mood: ${mood || "auto"}

{"intent":{"type":"monolog|asking_others|casual_conversation|professional_formal|joking_relaxed","explanation":"${explLang}"},
"social_analysis":{"relationship":"${explLang}","emotion":"${explLang}","communication_goal":"${explLang}","wrong_context_risk":"${explLang}"},
"most_natural":{"japanese":"...","romaji":"...","reason":"${explLang}","native_note":"${explLang}"},
"styles":{
"dasar":{"japanese":"...","romaji":"...","naturalness":"native|stiff|textbook","naturalness_note":"${explLang}","when_to_use":"${explLang}","suitable_for":"${explLang}","impression":"${explLang}","why_this_style":"${explLang}","grammar":[{"pattern":"...","explanation":"${explLang}"}],"kanji":[{"char":"...","reading":"on:.../kun:...","meaning":"${explLang}","examples":"...","jlpt":"N4","frequency":"sangat_umum|umum|khusus","example_words":[{"word":"...","reading":"...","meaning":"${explLang}"}]}],"jlpt_reference":"N4"},
"sehari_hari":{...same,"jlpt_reference":"N3"},
"ekspresif":{...same,"jlpt_reference":"N2"},
"mendekati_native":{...same,"jlpt_reference":"N1"}},
"alternatives":[{"rank":1,"role_label":"Paling Umum Digunakan","context_label":"${explLang}","japanese":"...","romaji":"...","style":"sehari_hari","explanation":"${explLang}"},{"rank":2,"role_label":"Lebih Sopan","context_label":"${explLang}","japanese":"...","romaji":"...","style":"ekspresif","explanation":"${explLang}"},{"rank":3,"role_label":"Untuk Situasi Formal","context_label":"${explLang}","japanese":"...","romaji":"...","style":"mendekati_native","explanation":"${explLang}"}]}

Rules: ${explLang} = ${explLangFull} (write every "${explLang}" field in ${explLangFull}). Exactly ONE expression per japanese field (no "/", no parens). Romaji numbers in full romaji ("san-ji" not "3-ji"). Max 4 kanji, only those appearing in the Japanese output. role_label values stay in Indonesian exactly as listed: ∈ {Paling Umum Digunakan, Lebih Sopan, Untuk Monolog, Untuk Situasi Formal, Pilihan Kasual, Paling Natural}. For monolog use 〜かな, never 〜ですか.`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            stream: true,
            max_tokens: 3200,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const code =
            upstream.status === 429
              ? "RATE_LIMITED"
              : upstream.status === 402
                ? "CREDITS_EXHAUSTED"
                : "AI_UNAVAILABLE";
          console.error("AI gateway error", upstream.status);
          await audit({ event_type: "translate_fail", ip_address: ip, user_id: userId, input_length: inputLength, success: false, error_code: code });
          return jsonResponse({ error: code }, upstream.status, allowedOrigin);
        }


        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const enc = new TextEncoder();
            const dec = new TextDecoder();
            const reader = upstream.body!.getReader();
            let sseBuf = "";
            let textBuf = "";
            const emittedTop = new Set<string>();
            const emittedStyle = new Set<string>();

            const emit = (obj: Record<string, unknown>) => {
              controller.enqueue(enc.encode(JSON.stringify(obj) + "\n"));
            };

            const tryEmit = () => {
              for (const key of ["intent", "social_analysis", "most_natural"]) {
                if (emittedTop.has(key)) continue;
                const r = tryExtract(textBuf, key);
                if (!r) continue;
                emittedTop.add(key);
                let value = r.value as Record<string, unknown>;
                if (key === "most_natural" && value) {
                  value = { ...value, japanese: cleanJapanese(value.japanese as string) };
                }
                emit({ type: "section", key, value });
              }

              const stylesMatch = /"styles"\s*:\s*\{/.exec(textBuf);
              if (stylesMatch) {
                // Include the opening "{" so nested key extraction works on a
                // balanced substring.
                const inner = textBuf.slice(stylesMatch.index + stylesMatch[0].length - 1);
                for (const sk of STYLE_KEYS) {
                  if (emittedStyle.has(sk)) continue;
                  const r = tryExtract(inner, sk);
                  if (!r) continue;
                  emittedStyle.add(sk);
                  const block = (r.value ?? {}) as Record<string, unknown>;
                  emit({
                    type: "style",
                    styleKey: sk,
                    level: STYLE_TO_LEVEL[sk],
                    value: { ...block, japanese: cleanJapanese(block.japanese as string) },
                  });
                }
              }

              if (!emittedTop.has("alternatives")) {
                const r = tryExtract(textBuf, "alternatives", true);
                if (r) {
                  emittedTop.add("alternatives");
                  emit({ type: "section", key: "alternatives", value: r.value });
                }
              }
            };

            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                sseBuf += dec.decode(value, { stream: true });
                let nl: number;
                while ((nl = sseBuf.indexOf("\n")) !== -1) {
                  const line = sseBuf.slice(0, nl).trim();
                  sseBuf = sseBuf.slice(nl + 1);
                  if (!line.startsWith("data:")) continue;
                  const data = line.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const ev = JSON.parse(data);
                    const delta = ev?.choices?.[0]?.delta?.content;
                    if (typeof delta === "string") {
                      textBuf += delta;
                      tryEmit();
                    }
                  } catch {
                    /* ignore parse errors on individual SSE frames */
                  }
                }
              }

              const cleaned = textBuf
                .trim()
                .replace(/^```(?:json)?\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();

              const validate = (full: Record<string, unknown> | null): full is Record<string, unknown> => {
                if (!full || typeof full !== "object") return false;
                if (!full.intent || !full.social_analysis || !full.most_natural || !full.styles) return false;
                const mn = full.most_natural as { japanese?: unknown };
                if (typeof mn.japanese !== "string" || !JAPANESE_RE.test(mn.japanese)) return false;
                return true;
              };

              let finalFull: Record<string, unknown> | null = null;
              try {
                finalFull = JSON.parse(cleaned);
              } catch {
                // Fallback: reassemble from extracted pieces (handles truncation).
                const intent = tryExtract(textBuf, "intent")?.value;
                const social = tryExtract(textBuf, "social_analysis")?.value;
                const most = tryExtract(textBuf, "most_natural")?.value;
                const alts = tryExtract(textBuf, "alternatives", true)?.value;
                const stylesMatch = /"styles"\s*:\s*\{/.exec(textBuf);
                const styles: Record<string, unknown> = {};
                if (stylesMatch) {
                  const inner = textBuf.slice(stylesMatch.index + stylesMatch[0].length - 1);
                  for (const sk of STYLE_KEYS) {
                    const r = tryExtract(inner, sk);
                    if (r) styles[sk] = r.value;
                  }
                }
                if (intent && social && most && Object.keys(styles).length === 4) {
                  finalFull = {
                    intent,
                    social_analysis: social,
                    most_natural: most,
                    styles,
                    alternatives: alts ?? [],
                  };
                }
              }

              if (validate(finalFull)) {
                emit({ type: "done", full: finalFull });
                await audit({ event_type: "translate_success", ip_address: ip, user_id: userId, input_length: inputLength, success: true, metadata: { lang } });
              } else {
                console.error("Failed to validate final JSON, RAW:", cleaned);
                emit({ type: "error", code: "INVALID_RESPONSE" });
                await audit({ event_type: "translate_fail", ip_address: ip, user_id: userId, input_length: inputLength, success: false, error_code: "invalid_response" });
              }
            } catch (e) {
              console.error("Stream error", e);
              emit({ type: "error", code: "AI_UNAVAILABLE" });
              await audit({ event_type: "translate_fail", ip_address: ip, user_id: userId, input_length: inputLength, success: false, error_code: "stream_error" });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            ...securityHeaders(allowedOrigin),
          },
        });

      },
    },
  },
});
