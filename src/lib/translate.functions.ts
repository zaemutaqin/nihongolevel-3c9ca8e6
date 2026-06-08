import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  sentence: z.string().trim().min(1).max(500),
  listener: z.string().trim().max(100).optional(),
  mood: z.string().trim().max(100).optional(),
});

export interface KanjiExampleWord {
  word: string;
  reading: string;
  meaning: string;
}

export type KanjiFrequency = "sangat_umum" | "umum" | "khusus";

export interface KanjiInfo {
  char: string;
  reading: string;
  meaning: string;
  examples: string;
  jlpt: string;
  example_words?: KanjiExampleWord[];
  frequency?: KanjiFrequency;
}


export interface GrammarInfo {
  pattern: string;
  explanation: string;
}

export type Naturalness = "native" | "stiff" | "textbook";
export type StyleKey = "dasar" | "sehari_hari" | "ekspresif" | "mendekati_native";

export interface StyleBlock {
  japanese: string;
  romaji: string;
  naturalness: Naturalness;
  naturalness_note: string;
  when_to_use: string;
  suitable_for: string;
  impression: string;
  why_this_style: string;
  grammar: GrammarInfo[];
  kanji: KanjiInfo[];
  jlpt_reference: string; // "N4" | "N3" | "N2" | "N1"
}

// Back-compat: existing LevelBlock shape used by storage/UI; we keep producing it.
export interface LevelBlock {
  japanese: string;
  romaji: string;
  nuance: string;
  naturalness: Naturalness;
  naturalness_note: string;
  why_this_level: string;
  grammar: GrammarInfo[];
  kanji: KanjiInfo[];
  // new optional style fields
  when_to_use?: string;
  suitable_for?: string;
  impression?: string;
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
  native_note?: string;
}

export type AlternativeRoleLabel =
  | "Paling Umum Digunakan"
  | "Lebih Sopan"
  | "Untuk Monolog"
  | "Untuk Situasi Formal"
  | "Pilihan Kasual"
  | "Paling Natural";

export interface AlternativeExpression {
  rank?: number;
  role_label?: string;
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

interface RawStyleBlock extends Omit<StyleBlock, "jlpt_reference"> {
  jlpt_reference?: string;
}

interface RawResult {
  intent: IntentInfo;
  social_analysis: SocialAnalysis;
  most_natural: MostNatural;
  styles: Record<StyleKey, RawStyleBlock>;
  alternatives: (Omit<AlternativeExpression, "level"> & { style?: StyleKey; level?: string })[];
}

const STYLE_TO_LEVEL: Record<StyleKey, "N4" | "N3" | "N2" | "N1"> = {
  dasar: "N4",
  sehari_hari: "N3",
  ekspresif: "N2",
  mendekati_native: "N1",
};

export function cleanJapanese(text: string | undefined | null): string {
  if (!text) return "";
  return String(text)
    .split("/")[0]
    .replace(/\(monolog\)/gi, "")
    .replace(/（[^）]*）/g, "")
    .trim();
}

function jlptToFrequency(jlpt: string | undefined): KanjiFrequency {
  const j = (jlpt || "").toUpperCase();
  if (j === "N5" || j === "N4") return "sangat_umum";
  if (j === "N3") return "umum";
  return "khusus";
}

function normalizeKanji(k: KanjiInfo): KanjiInfo {
  return {
    ...k,
    frequency: k.frequency ?? jlptToFrequency(k.jlpt),
    example_words: k.example_words ?? [],
  };
}

function styleToLevelBlock(s: RawStyleBlock): LevelBlock {
  return {
    japanese: cleanJapanese(s.japanese),
    romaji: s.romaji,
    naturalness: s.naturalness,
    naturalness_note: s.naturalness_note,
    nuance: s.impression ?? "",
    why_this_level: s.why_this_style ?? "",
    grammar: s.grammar ?? [],
    kanji: (s.kanji ?? []).map(normalizeKanji),
    when_to_use: s.when_to_use,
    suitable_for: s.suitable_for,
    impression: s.impression,
  };
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

    const prompt = `You are a Japanese communication coach, not just a translator. Help the user understand HOW Japanese people actually communicate.

Input sentence (Indonesian): ${data.sentence}
Target listener: ${listener}
Situation mood: ${mood}

Return ONLY raw JSON, no markdown, no backticks:

{
  "intent": { "type": "monolog|asking_others|casual_conversation|professional_formal|joking_relaxed", "explanation": "in Indonesian" },
  "social_analysis": { "relationship": "in Indonesian", "emotion": "in Indonesian", "communication_goal": "in Indonesian", "wrong_context_risk": "in Indonesian" },
  "most_natural": { "japanese": "...", "romaji": "...", "reason": "in Indonesian", "native_note": "in Indonesian" },
  "styles": {
    "dasar": { "japanese": "...", "romaji": "...", "naturalness": "native|stiff|textbook", "naturalness_note": "in Indonesian", "when_to_use": "in Indonesian", "suitable_for": "in Indonesian", "impression": "in Indonesian", "why_this_style": "in Indonesian", "grammar": [{"pattern": "...", "explanation": "in Indonesian"}], "kanji": [{"char": "...", "reading": "on: ... / kun: ...", "meaning": "in Indonesian", "examples": "...", "jlpt": "N4", "frequency": "sangat_umum|umum|khusus", "example_words": [{"word": "...", "reading": "...", "meaning": "in Indonesian"}]}], "jlpt_reference": "N4" },
    "sehari_hari": { same structure, jlpt_reference: "N3" },
    "ekspresif": { same structure, jlpt_reference: "N2" },
    "mendekati_native": { same structure, jlpt_reference: "N1" }
  },
  "alternatives": [
    {"rank": 1, "role_label": "Paling Umum Digunakan", "context_label": "cocok untuk teman dekat", "japanese": "...", "romaji": "...", "style": "sehari_hari", "explanation": "in Indonesian"},
    {"rank": 2, "role_label": "Lebih Sopan", "context_label": "cocok untuk rekan kerja", "japanese": "...", "romaji": "...", "style": "ekspresif", "explanation": "in Indonesian"},
    {"rank": 3, "role_label": "Untuk Situasi Formal", "context_label": "cocok untuk atasan / klien", "japanese": "...", "romaji": "...", "style": "mendekati_native", "explanation": "in Indonesian"}
  ]
}

Rules:
- most_natural = what a real Japanese person would naturally say
- Each Japanese field must contain EXACTLY ONE expression. Never include alternatives separated by "/", "(monolog)/", or parentheses. Pick one.
- impression = real social/emotional reaction, not just "sounds polite"
- For monolog: always use 〜かな、〜ようかな, never 〜ですか
- Be honest about naturalness — most textbook sentences are stiff
- kanji array: only kanji that actually appear in the sentence, max 4, can be empty []
- kanji.example_words: 2 common compound words using this kanji (NOT necessarily in the input sentence)
- kanji.frequency: derive from jlpt — N5/N4 → sangat_umum, N3 → umum, N2/N1 → khusus
- For alternatives: rank 1 is the MOST commonly used in real daily life. role_label MUST be one of: "Paling Umum Digunakan" / "Lebih Sopan" / "Untuk Monolog" / "Untuk Situasi Formal" / "Pilihan Kasual" / "Paling Natural". context_label is a short Indonesian sub-label (e.g., "cocok untuk teman dekat").
- ROMAJI RULE: Never use Arabic numerals (1,2,3...) in any romaji field. Always write numbers in full romaji. Examples: 3時に会います → "san-ji ni aimasu" NOT "3-ji ni aimasu"; 2人 → "futari"; 8時半 → "hachi-ji han". Apply to EVERY romaji field (most_natural.romaji, styles.*.romaji, alternatives[].romaji).`;


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

    let raw: RawResult;
    try {
      raw = JSON.parse(cleaned) as RawResult;
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", cleaned);
      throw new Error("Format respons tidak valid dari AI");
    }

    const styles = raw.styles ?? ({} as Record<StyleKey, RawStyleBlock>);

    // Pick "level" for most_natural by matching its japanese to a style block, default N3
    let mostLevel = "N3";
    for (const k of Object.keys(STYLE_TO_LEVEL) as StyleKey[]) {
      if (styles[k]?.japanese && styles[k].japanese === raw.most_natural?.japanese) {
        mostLevel = STYLE_TO_LEVEL[k];
        break;
      }
    }

    const alternatives: AlternativeExpression[] = (raw.alternatives ?? []).map((a) => ({
      context_label: a.context_label,
      japanese: a.japanese,
      romaji: a.romaji,
      explanation: a.explanation,
      level: a.style ? STYLE_TO_LEVEL[a.style] : a.level ?? "N3",
    }));

    return {
      intent: raw.intent,
      social_analysis: raw.social_analysis,
      most_natural: { ...raw.most_natural, level: raw.most_natural.level ?? mostLevel },
      alternatives,
      n4: styleToLevelBlock(styles.dasar),
      n3: styleToLevelBlock(styles.sehari_hari),
      n2: styleToLevelBlock(styles.ekspresif),
      n1: styleToLevelBlock(styles.mendekati_native),
    };
  });
