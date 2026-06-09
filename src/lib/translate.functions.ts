// Safe, user-facing error codes. The client maps these to Indonesian
// messages; raw server details (config, gateway internals) never leak.
export const TRANSLATE_ERROR_CODES = {
  FORBIDDEN_ORIGIN: "FORBIDDEN_ORIGIN",
  RATE_LIMITED: "RATE_LIMITED",
  CREDITS_EXHAUSTED: "CREDITS_EXHAUSTED",
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  SERVER_MISCONFIGURED: "SERVER_MISCONFIGURED",
} as const;
export type TranslateErrorCode =
  (typeof TRANSLATE_ERROR_CODES)[keyof typeof TRANSLATE_ERROR_CODES];

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
  alternatives: (Omit<AlternativeExpression, "level"> & {
    style?: StyleKey;
    level?: string;
    rank?: number;
    role_label?: string;
  })[];
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

export function jlptToFrequency(jlpt: string | undefined): KanjiFrequency {
  const j = (jlpt || "").toUpperCase();
  if (j === "N5" || j === "N4") return "sangat_umum";
  if (j === "N3") return "umum";
  return "khusus";
}

export function normalizeKanji(k: KanjiInfo): KanjiInfo {
  return {
    ...k,
    frequency: k.frequency ?? jlptToFrequency(k.jlpt),
    example_words: k.example_words ?? [],
  };
}

export const STYLE_KEY_TO_LEVEL = STYLE_TO_LEVEL;
export type { RawStyleBlock };

// Convert a raw style block (as emitted by the AI) into the legacy LevelBlock
// shape used by UI components and storage.
export function styleBlockToLevelBlock(s: RawStyleBlock | undefined | null): LevelBlock {
  const src = s ?? ({} as RawStyleBlock);
  return {
    japanese: cleanJapanese(src.japanese),
    romaji: src.romaji ?? "",
    naturalness: src.naturalness ?? "stiff",
    naturalness_note: src.naturalness_note ?? "",
    nuance: src.impression ?? "",
    why_this_level: src.why_this_style ?? "",
    grammar: src.grammar ?? [],
    kanji: (src.kanji ?? []).map(normalizeKanji),
    when_to_use: src.when_to_use,
    suitable_for: src.suitable_for,
    impression: src.impression,
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


// NOTE: The previous `translateSentence` createServerFn has been removed.
// All translation calls now go through the hardened `/api/translate` route
// (src/routes/api/translate.ts) which enforces rate limiting, audit logging,
// content moderation, and auth-aware controls. This file now only exports
// types and pure utility helpers — no server endpoints.

