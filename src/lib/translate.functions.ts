import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
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

export interface MostNatural {
  japanese: string;
  romaji: string;
  level: string;
  reason: string;
}

export interface TranslationResult {
  intent: IntentInfo;
  most_natural: MostNatural;
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

    const prompt = `You are a Japanese language expert who understands not just grammar but how Japanese people actually speak in real life.

First, analyze the intent of this Indonesian input: ${data.sentence}

Detect one of these intents: monolog (thinking to themselves), asking_others (asking someone else), casual_conversation, professional_formal, joking_relaxed.

Then provide translations at 4 JLPT levels that are appropriate for the detected intent — not just grammatically correct, but truly natural for that context.

Return ONLY raw JSON, no markdown, no backticks:

{
  "intent": {
    "type": "monolog|asking_others|casual_conversation|professional_formal|joking_relaxed",
    "explanation": "1 sentence in Indonesian explaining why this intent was detected"
  },
  "most_natural": {
    "japanese": "...",
    "romaji": "...",
    "level": "N3",
    "reason": "1 sentence in Indonesian explaining why this is the most natural expression"
  },
  "n4": {
    "japanese": "...",
    "romaji": "...",
    "nuance": "1 sentence in Indonesian about when this level is used",
    "naturalness": "native|stiff|textbook",
    "naturalness_note": "1 sentence in Indonesian explaining the naturalness rating",
    "why_this_level": "1-2 sentences in Indonesian explaining what grammar/vocab makes this N4 and difference vs lower level",
    "grammar": [{"pattern": "...", "explanation": "... in Indonesian"}],
    "kanji": [{"char": "...", "reading": "on: ... / kun: ...", "meaning": "... in Indonesian", "examples": "...", "jlpt": "N4"}]
  },
  "n3": { ... same structure, why_this_level compares vs N4 ... },
  "n2": { ... same structure, why_this_level compares vs N3 ... },
  "n1": { ... same structure, why_this_level compares vs N2 ... }
}

Critical rules:
- For monolog intent: use 〜かな、〜よな、〜ようかな forms, NOT 〜ですか or 〜か question forms
- For asking_others: use appropriate question forms based on formality
- Naturalness must be honest — most textbook translations are 'stiff', not 'native-like'
- Handle all Indonesian input types: formal, casual, slang, questions, statements
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
