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

export interface LevelBlock {
  japanese: string;
  romaji: string;
  nuance: string;
  grammar: GrammarInfo[];
  kanji: KanjiInfo[];
}

export interface TranslationResult {
  n4: LevelBlock;
  n3: LevelBlock;
  n2: LevelBlock;
  n1: LevelBlock;
}

export const translateSentence = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<TranslationResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a Japanese language expert. Translate this Indonesian sentence into Japanese at 4 JLPT levels. Return ONLY raw JSON, no markdown, no backticks, no explanation outside the JSON.

Input: ${data.sentence}

Format:
{
  "n4": {
    "japanese": "...",
    "romaji": "...",
    "nuance": "1 sentence in Indonesian about when this level is used",
    "grammar": [{"pattern": "...", "explanation": "... in Indonesian"}],
    "kanji": [{"char": "...", "reading": "on: ... / kun: ...", "meaning": "... in Indonesian", "examples": "...", "jlpt": "N4"}]
  },
  "n3": { ... },
  "n2": { ... },
  "n1": { ... }
}

Rules:
- N4: simple desu/masu, basic vocabulary
- N3: natural intermediate, varied vocabulary
- N2: semi-formal, complex grammar patterns
- N1: full keigo if formal context, or highly natural if casual context
- Handle ALL input types: formal, casual, everyday conversation (including questions like 'hari ini makan apa ya?')
- kanji array: only kanji that actually appear in the sentence, max 4, can be empty []`;

    const MAX_RETRIES = 3;
    let res: Response | null = null;
    let lastErrText = "";
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
        },
      );

      if (res.ok) break;

      lastErrText = await res.text();
      console.error("Gemini error:", res.status, lastErrText);

      if (res.status === 429 && attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      if (res.status === 429) {
        throw new Error(
          "Batas permintaan Gemini API terlampaui. Coba lagi dalam beberapa saat.",
        );
      }
      throw new Error(`Gemini API error (${res.status})`);
    }

    if (!res || !res.ok) {
      throw new Error("Gemini API tidak tersedia. Coba lagi nanti.");
    }

    const json = await res.json();
    const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    // Strip markdown fences if present
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
