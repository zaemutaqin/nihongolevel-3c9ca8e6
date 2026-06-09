import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { cleanJapanese } from "@/lib/translate.functions";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
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

function errorResponse(code: string, status: number) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Same-origin guard
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");
        const host = request.headers.get("host");
        const source = origin ?? referer ?? "";
        let okOrigin = false;
        if (source && host) {
          try {
            okOrigin = new URL(source).host === host;
          } catch {
            okOrigin = false;
          }
        }
        if (!okOrigin) return errorResponse("FORBIDDEN_ORIGIN", 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return errorResponse("INVALID_RESPONSE", 400);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return errorResponse("INVALID_RESPONSE", 400);

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          console.error("LOVABLE_API_KEY missing");
          return errorResponse("SERVER_MISCONFIGURED", 500);
        }

        const { sentence, listener, mood } = parsed.data;

        // Compact prompt — schema-only, minimal prose, to reduce both input
        // and output tokens.
        const prompt = `Japanese communication coach. Return ONLY raw JSON, no markdown.

Input: "${sentence}"
Listener: ${listener || "auto"}
Mood: ${mood || "auto"}

{"intent":{"type":"monolog|asking_others|casual_conversation|professional_formal|joking_relaxed","explanation":"id"},
"social_analysis":{"relationship":"id","emotion":"id","communication_goal":"id","wrong_context_risk":"id"},
"most_natural":{"japanese":"...","romaji":"...","reason":"id","native_note":"id"},
"styles":{
"dasar":{"japanese":"...","romaji":"...","naturalness":"native|stiff|textbook","naturalness_note":"id","when_to_use":"id","suitable_for":"id","impression":"id","why_this_style":"id","grammar":[{"pattern":"...","explanation":"id"}],"kanji":[{"char":"...","reading":"on:.../kun:...","meaning":"id","examples":"...","jlpt":"N4","frequency":"sangat_umum|umum|khusus","example_words":[{"word":"...","reading":"...","meaning":"id"}]}],"jlpt_reference":"N4"},
"sehari_hari":{...same,"jlpt_reference":"N3"},
"ekspresif":{...same,"jlpt_reference":"N2"},
"mendekati_native":{...same,"jlpt_reference":"N1"}},
"alternatives":[{"rank":1,"role_label":"Paling Umum Digunakan","context_label":"id","japanese":"...","romaji":"...","style":"sehari_hari","explanation":"id"},{"rank":2,"role_label":"Lebih Sopan","context_label":"id","japanese":"...","romaji":"...","style":"ekspresif","explanation":"id"},{"rank":3,"role_label":"Untuk Situasi Formal","context_label":"id","japanese":"...","romaji":"...","style":"mendekati_native","explanation":"id"}]}

Rules: id = Indonesian. Exactly ONE expression per japanese field (no "/", no parens). Romaji numbers in full romaji ("san-ji" not "3-ji"). Max 4 kanji, only those appearing in the sentence. role_label ∈ {Paling Umum Digunakan, Lebih Sopan, Untuk Monolog, Untuk Situasi Formal, Pilihan Kasual, Paling Natural}. For monolog use 〜かな, never 〜ですか.`;

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
            max_tokens: 1800,
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
          return errorResponse(code, upstream.status);
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
              try {
                const full = JSON.parse(cleaned);
                emit({ type: "done", full });
              } catch (e) {
                console.error("Failed to parse final JSON", e);
                emit({ type: "error", code: "INVALID_RESPONSE" });
              }
            } catch (e) {
              console.error("Stream error", e);
              emit({ type: "error", code: "AI_UNAVAILABLE" });
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
          },
        });
      },
    },
  },
});
