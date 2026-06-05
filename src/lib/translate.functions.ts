import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
});

export interface KanjiInfo {
  char: string;
  reading: string;
  meaning: string;
  examples: string;
  jlpt: string;
}

export interface GrammarInfo {
  pattern: string;
  explanation: string;
}

export type Naturalness = "native" | "stiff" | "textbook";

export interface LevelBlock {
  japanese: string;
  romaji: string;
  nuance: string;
  naturalness: Naturalness;
  naturalness_note: string;
  why_this_level: string;
  grammar: GrammarInfo[];
  kanji: KanjiInfo[];
}

export type IntentType =
  | "monolog"
  | "asking_others"
  | "casual_conversation"
  | "professional_formal"
  | "joking_relaxed";

export interface IntentInfo {
  type: IntentType;
  explanation: string;
}

export interface SocialAnalysis {
  relationship: string;
  emotion: string;
  communication_goal: string;
  wrong_context_risk: string;
}

export interface MostNatural {
  japanese: string;
  romaji: string;
  level: string;
  reason: string;
}

export interface AlternativeExpression {
  context_label: string;
  japanese: string;
  romaji: string;
  level: string;
  explanation: string;
}

export interface TranslationResult {
  intent: IntentInfo;
  social_analysis: SocialAnalysis;
  most_natural: MostNatural;
  alternatives: AlternativeExpression[];
  n4: LevelBlock;
  n3: LevelBlock;
  n2: LevelBlock;
  n1: LevelBlock;
}

export const translateSentence = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<TranslationResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const listener = data.listener && data.listener.length > 0 ? data.listener : "auto-detect";
    const mood = data.mood && data.mood.length > 0 ? data.mood : "auto-detect";

    const prompt = `You are an expert in Japanese sociolinguistics — you understand not just grammar but how social relationships, emotions, and context shape how Japanese people actually speak.

Analyze this input:
- Indonesian sentence: ${data.sentence}
- Target listener: ${listener}
- Situation mood: ${mood}

Return ONLY raw JSON, no markdown, no backticks:

{
  "intent": {
    "type": "monolog|asking_others|casual_conversation|professional_formal|joking_relaxed",
    "explanation": "1 sentence in Indonesian"
  },
  "social_analysis": {
    "relationship": "detected social relationship in Indonesian",
    "emotion": "detected emotion/tone in Indonesian",
    "communication_goal": "what speaker wants to achieve in Indonesian",
    "wrong_context_risk": "what goes wrong if wrong form is used in Indonesian"
  },
  "most_natural": {
    "japanese": "...",
    "romaji": "...",
    "level": "N3",
    "reason": "1 sentence in Indonesian"
  },
  "alternatives": [
    {"context_label": "Kalau bilang ke teman dekat", "japanese": "...", "romaji": "...", "level": "N3", "explanation": "in Indonesian"},
    {"context_label": "Kalau tanya ke rekan kerja", "japanese": "...", "romaji": "...", "level": "N2", "explanation": "in Indonesian"},
    {"context_label": "Kalau tanya ke atasan", "japanese": "...", "romaji": "...", "level": "N1", "explanation": "in Indonesian"}
  ],
  "n4": {
    "japanese": "...",
    "romaji": "...",
    "nuance": "1 sentence in Indonesian",
    "naturalness": "native|stiff|textbook",
    "naturalness_note": "1 sentence in Indonesian",
    "why_this_level": "1-2 sentences in Indonesian",
    "grammar": [{"pattern": "...", "explanation": "in Indonesian"}],
    "kanji": [{"char": "...", "reading": "on: ... / kun: ...", "meaning": "in Indonesian", "examples": "...", "jlpt": "N4"}]
  },
  "n3": { same structure, why_this_level compares vs N4 },
  "n2": { same structure, why_this_level compares vs N3 },
  "n1": { same structure, why_this_level compares vs N2 }
}

Critical rules:
- social_analysis must be specific and insightful, not generic
- alternatives must genuinely differ by social context, not just formality level
- wrong_context_risk must explain a real mistake Japanese learners commonly make
- For monolog intent: always use 〜かな、〜ようかな、〜よな, never 〜ですか
- For asking_others: use appropriate question forms based on formality
- Naturalness must be honest — most textbook translations are 'stiff', not 'native-like'
- kanji array: only kanji that actually appear in the sentence, max 4, can be empty []`;

    const MAX_RETRIES = 3;
    let res: Response | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });

      if (res.ok) break;

      const errText = await res.text();
      console.error("AI Gateway error:", res.status, errText);

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (res.status === 429) {
        throw new Error("Terlalu banyak permintaan. Coba lagi dalam beberapa saat.");
      }
      if (res.status === 402) {
        throw new Error("Kredit AI habis. Silakan tambahkan kredit di workspace settings.");
      }
      throw new Error(`AI Gateway error (${res.status})`);
    }

    if (!res || !res.ok) {
      throw new Error("AI Gateway tidak tersedia. Coba lagi nanti.");
    }

    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Empty response from AI Gateway");
    }

    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleaned) as TranslationResult;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", cleaned);
      throw new Error("Format respons tidak valid dari AI");
    }
  });
