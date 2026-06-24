/**
 * curriculum.functions.ts
 *
 * Server function untuk data kurikulum.
 * Sementara menggunakan data hardcoded supaya langsung jalan
 * tanpa perlu Supabase terisi dulu.
 *
 * Lokasi file: src/lib/curriculum.functions.ts
 * EDIT file yang sudah ada — JANGAN buat file baru.
 */

import { createServerFn } from "@tanstack/react-start";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionOverview {
  id: string;
  title: string;
  order_index: number;
  completed: boolean;
  best_score: number | null;
}

export interface UnitOverview {
  id: string;
  name: string;
  order_index: number;
  sessions: SessionOverview[];
}

export interface LevelOverview {
  id: string;
  name: string;
  order_index: number;
  progress_pct: number;
  unlock_threshold_pct: number;
  status: "available" | "locked" | "completed" | "current";
  units: UnitOverview[];
}

// Alias yang dipakai komponen dashboard
export type LevelNode = LevelOverview;

export interface SessionRef {
  session_id: string;
  session_title: string;
  unit_name: string;
  level_name: string;
  unit_progress_pct: number;
}

export interface CurriculumOverview {
  levels: LevelOverview[];
  full_name?: string | null;
  next_session?: SessionRef | null;
  last_session?: SessionRef | null;
  items_learned?: number;
}

// ─── Data kurikulum hardcoded (tidak butuh Supabase) ─────────────────────────

const CURRICULUM_DATA: LevelOverview[] = [
  {
    id: "level-0",
    name: "Level 0 — Fondasi Mutlak",
    order_index: 0,
    progress_pct: 0,
    unlock_threshold_pct: 80,
    status: "current",
    units: [
      {
        id: "level-0-unit-1",
        name: "Hiragana",
        order_index: 0,
        sessions: [
          { id: "level-0-unit-1-sesi-1", title: "Hiragana baris あ (a-i-u-e-o)", order_index: 0, completed: false, best_score: null },
          { id: "level-0-unit-1-sesi-2", title: "Hiragana baris か・さ", order_index: 1, completed: false, best_score: null },
          { id: "level-0-unit-1-sesi-3", title: "Hiragana baris た・な", order_index: 2, completed: false, best_score: null },
          { id: "level-0-unit-1-sesi-4", title: "Hiragana baris は・ら・わをん", order_index: 3, completed: false, best_score: null },
          { id: "level-0-unit-1-sesi-5", title: "Review hiragana — baca kata nyata", order_index: 4, completed: false, best_score: null },
        ],
      },
      {
        id: "level-0-unit-2",
        name: "Katakana",
        order_index: 1,
        sessions: [
          { id: "level-0-unit-2-sesi-1", title: "Katakana dasar — kata kerja penting", order_index: 0, completed: false, best_score: null },
          { id: "level-0-unit-2-sesi-2", title: "Katakana — baca label konbini", order_index: 1, completed: false, best_score: null },
        ],
      },
      {
        id: "level-0-unit-3",
        name: "Angka, Waktu & Tanggal",
        order_index: 2,
        sessions: [
          { id: "level-0-unit-3-sesi-1", title: "Angka 1–10 dan pola ratusan", order_index: 0, completed: false, best_score: null },
          { id: "level-0-unit-3-sesi-2", title: "Jam & jadwal shift", order_index: 1, completed: false, best_score: null },
        ],
      },
      {
        id: "level-0-unit-4",
        name: "Salam & Perkenalan Diri",
        order_index: 3,
        sessions: [
          { id: "level-0-unit-4-sesi-1", title: "6 salam penting di tempat kerja", order_index: 0, completed: false, best_score: null },
          { id: "level-0-unit-4-sesi-2", title: "Memperkenalkan diri — jikoshoukai", order_index: 1, completed: false, best_score: null },
          { id: "level-0-unit-4-sesi-3", title: "Minta tolong & minta maaf", order_index: 2, completed: false, best_score: null },
        ],
      },
    ],
  },
  {
    id: "level-1",
    name: "Level 1 — Kehidupan Sehari-hari",
    order_index: 1,
    progress_pct: 0,
    unlock_threshold_pct: 80,
    status: "locked",
    units: [
      {
        id: "level-1-unit-1",
        name: "Transportasi & Arah",
        order_index: 0,
        sessions: [
          { id: "level-1-unit-1-sesi-1", title: "Naik kereta & bus", order_index: 0, completed: false, best_score: null },
          { id: "level-1-unit-1-sesi-2", title: "Tanya arah", order_index: 1, completed: false, best_score: null },
        ],
      },
      {
        id: "level-1-unit-2",
        name: "Belanja & Transaksi",
        order_index: 1,
        sessions: [
          { id: "level-1-unit-2-sesi-1", title: "Di konbini", order_index: 0, completed: false, best_score: null },
          { id: "level-1-unit-2-sesi-2", title: "Tanya harga & kembalian", order_index: 1, completed: false, best_score: null },
        ],
      },
    ],
  },
  {
    id: "level-2",
    name: "Level 2 — Bahasa Tempat Kerja",
    order_index: 2,
    progress_pct: 0,
    unlock_threshold_pct: 80,
    status: "locked",
    units: [
      {
        id: "level-2-unit-1",
        name: "Komunikasi Tempat Kerja",
        order_index: 0,
        sessions: [
          { id: "level-2-unit-1-sesi-1", title: "Instruksi kerja dasar", order_index: 0, completed: false, best_score: null },
          { id: "level-2-unit-1-sesi-2", title: "Lapor masalah singkat", order_index: 1, completed: false, best_score: null },
        ],
      },
      {
        id: "level-2-unit-2",
        name: "Sopan Santun Profesional",
        order_index: 1,
        sessions: [
          { id: "level-2-unit-2-sesi-1", title: "Minta izin dan konfirmasi", order_index: 0, completed: false, best_score: null },
          { id: "level-2-unit-2-sesi-2", title: "Ucapan sebelum dan sesudah kerja", order_index: 1, completed: false, best_score: null },
        ],
      },
    ],
  },
];

const EN_LEVEL_NAMES: Record<string, string> = {
  "level-0": "Level 0 — Absolute Foundation",
  "level-1": "Level 1 — Daily Life",
  "level-2": "Level 2 — Workplace Japanese",
};

const EN_UNIT_NAMES: Record<string, string> = {
  "level-0-unit-1": "Hiragana",
  "level-0-unit-2": "Katakana",
  "level-0-unit-3": "Numbers, Time & Dates",
  "level-0-unit-4": "Greetings & Self-introduction",
  "level-1-unit-1": "Transportation & Directions",
  "level-1-unit-2": "Shopping & Transactions",
  "level-2-unit-1": "Workplace Communication",
  "level-2-unit-2": "Professional Manners",
};

const EN_SESSION_TITLES: Record<string, string> = {
  "level-0-unit-1-sesi-1": "Hiragana row: a-i-u-e-o",
  "level-0-unit-1-sesi-2": "Hiragana rows: ka and sa",
  "level-0-unit-1-sesi-3": "Hiragana rows: ta and na",
  "level-0-unit-1-sesi-4": "Hiragana rows: ha, ra, wa, wo, n",
  "level-0-unit-1-sesi-5": "Hiragana review — read real words",
  "level-0-unit-2-sesi-1": "Basic katakana — key work words",
  "level-0-unit-2-sesi-2": "Katakana — convenience store labels",
  "level-0-unit-3-sesi-1": "Numbers 1–10 and hundreds",
  "level-0-unit-3-sesi-2": "Time & shift schedule",
  "level-0-unit-4-sesi-1": "6 essential workplace greetings",
  "level-0-unit-4-sesi-2": "Self-introduction — jikoshoukai",
  "level-0-unit-4-sesi-3": "Asking for help & apologizing",
  "level-1-unit-1-sesi-1": "Taking trains & buses",
  "level-1-unit-1-sesi-2": "Asking for directions",
  "level-1-unit-2-sesi-1": "At the convenience store",
  "level-1-unit-2-sesi-2": "Asking prices & change",
  "level-2-unit-1-sesi-1": "Basic work instructions",
  "level-2-unit-1-sesi-2": "Reporting a small problem",
  "level-2-unit-2-sesi-1": "Asking permission & confirming",
  "level-2-unit-2-sesi-2": "Phrases before and after work",
};

export function localizeCurriculumOverview(
  overview: CurriculumOverview | undefined,
  lang: "id" | "en",
): CurriculumOverview | undefined {
  if (!overview || lang !== "en") return overview;
  return {
    ...overview,
    levels: overview.levels.map((level) => ({
      ...level,
      name: EN_LEVEL_NAMES[level.id] ?? level.name,
      units: level.units.map((unit) => ({
        ...unit,
        name: EN_UNIT_NAMES[unit.id] ?? unit.name,
        sessions: unit.sessions.map((session) => ({
          ...session,
          title: EN_SESSION_TITLES[session.id] ?? session.title,
        })),
      })),
    })),
    next_session: overview.next_session
      ? {
          ...overview.next_session,
          session_title: EN_SESSION_TITLES[overview.next_session.session_id] ?? overview.next_session.session_title,
          unit_name: Object.entries(EN_UNIT_NAMES).find(([unitId]) =>
            overview.next_session?.session_id.startsWith(unitId),
          )?.[1] ?? overview.next_session.unit_name,
          level_name: Object.entries(EN_LEVEL_NAMES).find(([levelId]) =>
            overview.next_session?.session_id.startsWith(levelId),
          )?.[1] ?? overview.next_session.level_name,
        }
      : overview.next_session,
    last_session: overview.last_session
      ? {
          ...overview.last_session,
          session_title: EN_SESSION_TITLES[overview.last_session.session_id] ?? overview.last_session.session_title,
          unit_name: Object.entries(EN_UNIT_NAMES).find(([unitId]) =>
            overview.last_session?.session_id.startsWith(unitId),
          )?.[1] ?? overview.last_session.unit_name,
          level_name: Object.entries(EN_LEVEL_NAMES).find(([levelId]) =>
            overview.last_session?.session_id.startsWith(levelId),
          )?.[1] ?? overview.last_session.level_name,
        }
      : overview.last_session,
  };
}

// ─── Server function ──────────────────────────────────────────────────────────
// Mengembalikan data kurikulum.
// Saat ini menggunakan data hardcoded.
// Untuk menambahkan progress pengguna dari Supabase nanti,
// tambahkan query di dalam fungsi ini setelah Supabase terkonfigurasi.

export const getCurriculumOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurriculumOverview> => {
    // Data hardcoded adalah sumber kebenaran saat ini.
    // Progress dari Supabase bisa di-merge nanti ketika tabel session_attempts terisi.
    const levels = CURRICULUM_DATA;

    // Cari sesi pertama yang belum selesai pada level "current"
    let nextSession: SessionRef | null = null;
    const currentLevel = levels.find((l) => l.status === "current") ?? levels[0];
    if (currentLevel) {
      outer: for (const unit of currentLevel.units) {
        for (const s of unit.sessions) {
          if (!s.completed) {
            nextSession = {
              session_id: s.id,
              session_title: s.title,
              unit_name: unit.name,
              level_name: currentLevel.name,
              unit_progress_pct: 0,
            };
            break outer;
          }
        }
      }
    }

    return {
      levels,
      next_session: nextSession,
      last_session: null,
      items_learned: 0,
    };
  }
);

// ─── Helper: ambil data sesi untuk halaman belajar ────────────────────────────

export interface SessionItem {
  id: string;
  type: "hiragana" | "katakana" | "number" | "phrase" | "sentence";
  content_jp: string;
  content_romaji: string;
  content_meaning: string;
  content_meaning_en: string;
}

export interface SessionDetail {
  id: string;
  title: string;
  title_en: string;
  level_id: string;
  unit_id: string;
  items: SessionItem[];
}

// Data item per sesi — dipakai oleh belajar.$sessionId.tsx
const SESSION_ITEMS: Record<string, SessionDetail> = {
  "level-0-unit-1-sesi-1": {
    id: "level-0-unit-1-sesi-1",
    title: "Hiragana baris あ",
    title_en: "Hiragana row: a",
    level_id: "level-0",
    unit_id: "level-0-unit-1",
    items: [
      { id: "h-a", type: "hiragana", content_jp: "あ", content_romaji: "a", content_meaning: "seperti 'a' dalam 'anak'", content_meaning_en: "like 'a' in 'art'" },
      { id: "h-i", type: "hiragana", content_jp: "い", content_romaji: "i", content_meaning: "seperti 'i' dalam 'ibu'", content_meaning_en: "like 'ee' in 'feet'" },
      { id: "h-u", type: "hiragana", content_jp: "う", content_romaji: "u", content_meaning: "seperti 'u' dalam 'udang'", content_meaning_en: "like 'oo' in 'food'" },
      { id: "h-e", type: "hiragana", content_jp: "え", content_romaji: "e", content_meaning: "seperti 'e' dalam 'ekor'", content_meaning_en: "like 'e' in 'set'" },
      { id: "h-o", type: "hiragana", content_jp: "お", content_romaji: "o", content_meaning: "seperti 'o' dalam 'obat'", content_meaning_en: "like 'o' in 'old'" },
    ],
  },
  "level-0-unit-1-sesi-2": {
    id: "level-0-unit-1-sesi-2",
    title: "Hiragana baris か・さ",
    title_en: "Hiragana rows: ka, sa",
    level_id: "level-0",
    unit_id: "level-0-unit-1",
    items: [
      { id: "h-ka", type: "hiragana", content_jp: "か", content_romaji: "ka", content_meaning: "ka", content_meaning_en: "ka" },
      { id: "h-ki", type: "hiragana", content_jp: "き", content_romaji: "ki", content_meaning: "ki", content_meaning_en: "ki" },
      { id: "h-ku", type: "hiragana", content_jp: "く", content_romaji: "ku", content_meaning: "ku", content_meaning_en: "ku" },
      { id: "h-ke", type: "hiragana", content_jp: "け", content_romaji: "ke", content_meaning: "ke", content_meaning_en: "ke" },
      { id: "h-ko", type: "hiragana", content_jp: "こ", content_romaji: "ko", content_meaning: "ko", content_meaning_en: "ko" },
      { id: "h-sa", type: "hiragana", content_jp: "さ", content_romaji: "sa", content_meaning: "sa", content_meaning_en: "sa" },
      { id: "h-shi", type: "hiragana", content_jp: "し", content_romaji: "shi", content_meaning: "shi — bukan 'si'", content_meaning_en: "shi — not 'si'" },
      { id: "h-su", type: "hiragana", content_jp: "す", content_romaji: "su", content_meaning: "su", content_meaning_en: "su" },
      { id: "h-se", type: "hiragana", content_jp: "せ", content_romaji: "se", content_meaning: "se", content_meaning_en: "se" },
      { id: "h-so", type: "hiragana", content_jp: "そ", content_romaji: "so", content_meaning: "so", content_meaning_en: "so" },
    ],
  },
  "level-0-unit-1-sesi-3": {
    id: "level-0-unit-1-sesi-3",
    title: "Hiragana baris た・な",
    title_en: "Hiragana rows: ta, na",
    level_id: "level-0",
    unit_id: "level-0-unit-1",
    items: [
      { id: "h-ta", type: "hiragana", content_jp: "た", content_romaji: "ta", content_meaning: "ta", content_meaning_en: "ta" },
      { id: "h-chi", type: "hiragana", content_jp: "ち", content_romaji: "chi", content_meaning: "chi — bukan 'ti'", content_meaning_en: "chi — not 'ti'" },
      { id: "h-tsu", type: "hiragana", content_jp: "つ", content_romaji: "tsu", content_meaning: "tsu — bukan 'tu'", content_meaning_en: "tsu — not 'tu'" },
      { id: "h-te", type: "hiragana", content_jp: "て", content_romaji: "te", content_meaning: "te", content_meaning_en: "te" },
      { id: "h-to", type: "hiragana", content_jp: "と", content_romaji: "to", content_meaning: "to", content_meaning_en: "to" },
      { id: "h-na", type: "hiragana", content_jp: "な", content_romaji: "na", content_meaning: "na", content_meaning_en: "na" },
      { id: "h-ni", type: "hiragana", content_jp: "に", content_romaji: "ni", content_meaning: "ni", content_meaning_en: "ni" },
      { id: "h-nu", type: "hiragana", content_jp: "ぬ", content_romaji: "nu", content_meaning: "nu", content_meaning_en: "nu" },
      { id: "h-ne", type: "hiragana", content_jp: "ね", content_romaji: "ne", content_meaning: "ne", content_meaning_en: "ne" },
      { id: "h-no", type: "hiragana", content_jp: "の", content_romaji: "no", content_meaning: "no", content_meaning_en: "no" },
    ],
  },
  "level-0-unit-1-sesi-4": {
    id: "level-0-unit-1-sesi-4",
    title: "Hiragana baris は・ら・わをん",
    title_en: "Hiragana rows: ha, ra, wa",
    level_id: "level-0",
    unit_id: "level-0-unit-1",
    items: [
      { id: "h-ha", type: "hiragana", content_jp: "は", content_romaji: "ha", content_meaning: "ha", content_meaning_en: "ha" },
      { id: "h-hi", type: "hiragana", content_jp: "ひ", content_romaji: "hi", content_meaning: "hi", content_meaning_en: "hi" },
      { id: "h-fu", type: "hiragana", content_jp: "ふ", content_romaji: "fu", content_meaning: "fu", content_meaning_en: "fu" },
      { id: "h-he", type: "hiragana", content_jp: "へ", content_romaji: "he", content_meaning: "he", content_meaning_en: "he" },
      { id: "h-ho", type: "hiragana", content_jp: "ほ", content_romaji: "ho", content_meaning: "ho", content_meaning_en: "ho" },
      { id: "h-ra", type: "hiragana", content_jp: "ら", content_romaji: "ra", content_meaning: "ra", content_meaning_en: "ra" },
      { id: "h-ri", type: "hiragana", content_jp: "り", content_romaji: "ri", content_meaning: "ri", content_meaning_en: "ri" },
      { id: "h-ru", type: "hiragana", content_jp: "る", content_romaji: "ru", content_meaning: "ru", content_meaning_en: "ru" },
      { id: "h-re", type: "hiragana", content_jp: "れ", content_romaji: "re", content_meaning: "re", content_meaning_en: "re" },
      { id: "h-ro", type: "hiragana", content_jp: "ろ", content_romaji: "ro", content_meaning: "ro", content_meaning_en: "ro" },
      { id: "h-wa", type: "hiragana", content_jp: "わ", content_romaji: "wa", content_meaning: "wa", content_meaning_en: "wa" },
      { id: "h-wo", type: "hiragana", content_jp: "を", content_romaji: "wo", content_meaning: "partikel objek (wo)", content_meaning_en: "object particle (wo)" },
      { id: "h-n", type: "hiragana", content_jp: "ん", content_romaji: "n", content_meaning: "n — suku kata tersendiri", content_meaning_en: "n — standalone syllable" },
    ],
  },
  "level-0-unit-1-sesi-5": {
    id: "level-0-unit-1-sesi-5",
    title: "Review hiragana — baca kata nyata",
    title_en: "Hiragana review — real words",
    level_id: "level-0",
    unit_id: "level-0-unit-1",
    items: [
      { id: "w-mizu", type: "phrase", content_jp: "みず", content_romaji: "mizu", content_meaning: "air", content_meaning_en: "water" },
      { id: "w-neko", type: "phrase", content_jp: "ねこ", content_romaji: "neko", content_meaning: "kucing", content_meaning_en: "cat" },
      { id: "w-inu", type: "phrase", content_jp: "いぬ", content_romaji: "inu", content_meaning: "anjing", content_meaning_en: "dog" },
      { id: "w-hana", type: "phrase", content_jp: "はな", content_romaji: "hana", content_meaning: "bunga / hidung", content_meaning_en: "flower / nose" },
      { id: "w-sora", type: "phrase", content_jp: "そら", content_romaji: "sora", content_meaning: "langit", content_meaning_en: "sky" },
      { id: "w-kasa", type: "phrase", content_jp: "かさ", content_romaji: "kasa", content_meaning: "payung", content_meaning_en: "umbrella" },
      { id: "w-tori", type: "phrase", content_jp: "とり", content_romaji: "tori", content_meaning: "burung / ayam", content_meaning_en: "bird / chicken" },
    ],
  },
  "level-0-unit-2-sesi-1": {
    id: "level-0-unit-2-sesi-1",
    title: "Katakana dasar — kata kerja penting",
    title_en: "Basic katakana — key work words",
    level_id: "level-0",
    unit_id: "level-0-unit-2",
    items: [
      { id: "k-miiting", type: "katakana", content_jp: "ミーティング", content_romaji: "miitingu", content_meaning: "meeting / rapat", content_meaning_en: "meeting" },
      { id: "k-shifuto", type: "katakana", content_jp: "シフト", content_romaji: "shifuto", content_meaning: "shift kerja", content_meaning_en: "work shift" },
      { id: "k-masuku", type: "katakana", content_jp: "マスク", content_romaji: "masuku", content_meaning: "masker", content_meaning_en: "face mask" },
      { id: "k-baito", type: "katakana", content_jp: "バイト", content_romaji: "baito", content_meaning: "kerja paruh waktu", content_meaning_en: "part-time job" },
      { id: "k-neemukaado", type: "katakana", content_jp: "ネームカード", content_romaji: "neemukaado", content_meaning: "kartu nama", content_meaning_en: "name card" },
    ],
  },
  "level-0-unit-2-sesi-2": {
    id: "level-0-unit-2-sesi-2",
    title: "Katakana — baca label konbini",
    title_en: "Katakana — convenience store labels",
    level_id: "level-0",
    unit_id: "level-0-unit-2",
    items: [
      { id: "k-petobo", type: "katakana", content_jp: "ペットボトル", content_romaji: "petto botoru", content_meaning: "botol plastik", content_meaning_en: "plastic bottle" },
      { id: "k-aruko", type: "katakana", content_jp: "アルコール", content_romaji: "arukōru", content_meaning: "alkohol / hand sanitizer", content_meaning_en: "alcohol / sanitizer" },
      { id: "k-reji", type: "katakana", content_jp: "レジ", content_romaji: "reji", content_meaning: "kasir", content_meaning_en: "cashier / register" },
      { id: "k-benchi", type: "katakana", content_jp: "ベンチ", content_romaji: "benchi", content_meaning: "bangku", content_meaning_en: "bench" },
      { id: "k-hotdo", type: "katakana", content_jp: "ホットドッグ", content_romaji: "hotto doggu", content_meaning: "hot dog", content_meaning_en: "hot dog" },
    ],
  },
  "level-0-unit-3-sesi-1": {
    id: "level-0-unit-3-sesi-1",
    title: "Angka 1–10 dan pola ratusan",
    title_en: "Numbers 1–10 and hundreds",
    level_id: "level-0",
    unit_id: "level-0-unit-3",
    items: [
      { id: "n-1", type: "number", content_jp: "一 (いち)", content_romaji: "ichi", content_meaning: "1", content_meaning_en: "1" },
      { id: "n-2", type: "number", content_jp: "二 (に)", content_romaji: "ni", content_meaning: "2", content_meaning_en: "2" },
      { id: "n-3", type: "number", content_jp: "三 (さん)", content_romaji: "san", content_meaning: "3", content_meaning_en: "3" },
      { id: "n-4", type: "number", content_jp: "四 (し/よん)", content_romaji: "shi / yon", content_meaning: "4", content_meaning_en: "4" },
      { id: "n-5", type: "number", content_jp: "五 (ご)", content_romaji: "go", content_meaning: "5", content_meaning_en: "5" },
      { id: "n-6", type: "number", content_jp: "六 (ろく)", content_romaji: "roku", content_meaning: "6", content_meaning_en: "6" },
      { id: "n-7", type: "number", content_jp: "七 (なな)", content_romaji: "nana / shichi", content_meaning: "7", content_meaning_en: "7" },
      { id: "n-8", type: "number", content_jp: "八 (はち)", content_romaji: "hachi", content_meaning: "8", content_meaning_en: "8" },
      { id: "n-9", type: "number", content_jp: "九 (く/きゅう)", content_romaji: "ku / kyuu", content_meaning: "9", content_meaning_en: "9" },
      { id: "n-10", type: "number", content_jp: "十 (じゅう)", content_romaji: "juu", content_meaning: "10", content_meaning_en: "10" },
      { id: "n-350", type: "number", content_jp: "三百五十円", content_romaji: "sanbyaku gojuu en", content_meaning: "350 yen", content_meaning_en: "350 yen" },
    ],
  },
  "level-0-unit-3-sesi-2": {
    id: "level-0-unit-3-sesi-2",
    title: "Jam & jadwal shift",
    title_en: "Time & shift schedule",
    level_id: "level-0",
    unit_id: "level-0-unit-3",
    items: [
      { id: "t-nanji", type: "phrase", content_jp: "何時ですか？", content_romaji: "Nanji desu ka?", content_meaning: "Jam berapa sekarang?", content_meaning_en: "What time is it?" },
      { id: "t-hachiji", type: "phrase", content_jp: "八時半から五時まで", content_romaji: "hachiji han kara goji made", content_meaning: "dari jam 8.30 sampai jam 5", content_meaning_en: "from 8:30 to 5:00" },
      { id: "t-gozen", type: "phrase", content_jp: "午前", content_romaji: "gozen", content_meaning: "pagi (AM)", content_meaning_en: "morning / AM" },
      { id: "t-gogo", type: "phrase", content_jp: "午後", content_romaji: "gogo", content_meaning: "sore/malam (PM)", content_meaning_en: "afternoon / PM" },
      { id: "t-kyuu", type: "phrase", content_jp: "休憩", content_romaji: "kyuukei", content_meaning: "istirahat", content_meaning_en: "break / rest" },
    ],
  },
  "level-0-unit-4-sesi-1": {
    id: "level-0-unit-4-sesi-1",
    title: "6 salam penting di tempat kerja",
    title_en: "6 essential workplace greetings",
    level_id: "level-0",
    unit_id: "level-0-unit-4",
    items: [
      { id: "g-ohayo", type: "phrase", content_jp: "おはようございます", content_romaji: "Ohayou gozaimasu", content_meaning: "Selamat pagi (formal)", content_meaning_en: "Good morning (formal)" },
      { id: "g-konnichiwa", type: "phrase", content_jp: "こんにちは", content_romaji: "Konnichiwa", content_meaning: "Halo / Selamat siang", content_meaning_en: "Hello / Good afternoon" },
      { id: "g-otsukare", type: "phrase", content_jp: "お疲れ様です", content_romaji: "Otsukaresama desu", content_meaning: "Terima kasih sudah bekerja keras", content_meaning_en: "Thank you for your hard work" },
      { id: "g-yoroshiku", type: "phrase", content_jp: "よろしくお願いします", content_romaji: "Yoroshiku onegaishimasu", content_meaning: "Mohon bantuannya", content_meaning_en: "Please take care of me" },
      { id: "g-sumimasen", type: "phrase", content_jp: "すみません", content_romaji: "Sumimasen", content_meaning: "Permisi / Maaf", content_meaning_en: "Excuse me / Sorry" },
      { id: "g-arigatou", type: "phrase", content_jp: "ありがとうございます", content_romaji: "Arigatou gozaimasu", content_meaning: "Terima kasih (formal)", content_meaning_en: "Thank you (formal)" },
    ],
  },
  "level-0-unit-4-sesi-2": {
    id: "level-0-unit-4-sesi-2",
    title: "Memperkenalkan diri — jikoshoukai",
    title_en: "Self-introduction — jikoshoukai",
    level_id: "level-0",
    unit_id: "level-0-unit-4",
    items: [
      { id: "j-hajimemashite", type: "phrase", content_jp: "はじめまして", content_romaji: "Hajimemashite", content_meaning: "Perkenalkan / Salam kenal", content_meaning_en: "Nice to meet you" },
      { id: "j-namae", type: "sentence", content_jp: "[名前]です。", content_romaji: "[namae] desu.", content_meaning: "Nama saya [nama].", content_meaning_en: "My name is [name]." },
      { id: "j-kara", type: "sentence", content_jp: "インドネシアから来ました。", content_romaji: "Indoneshia kara kimashita.", content_meaning: "Saya dari Indonesia.", content_meaning_en: "I come from Indonesia." },
      { id: "j-yoroshiku", type: "sentence", content_jp: "よろしくお願いします。", content_romaji: "Yoroshiku onegaishimasu.", content_meaning: "Mohon bantuannya.", content_meaning_en: "Please take care of me." },
    ],
  },
  "level-0-unit-4-sesi-3": {
    id: "level-0-unit-4-sesi-3",
    title: "Minta tolong & minta maaf",
    title_en: "Asking for help & apologizing",
    level_id: "level-0",
    unit_id: "level-0-unit-4",
    items: [
      { id: "r-moudoi", type: "sentence", content_jp: "すみません、もう一度お願いします。", content_romaji: "Sumimasen, mou ichido onegaishimasu.", content_meaning: "Maaf, tolong ulangi sekali lagi.", content_meaning_en: "Sorry, could you repeat that?" },
      { id: "r-wakaran", type: "sentence", content_jp: "わかりません。", content_romaji: "Wakarimasen.", content_meaning: "Saya tidak mengerti.", content_meaning_en: "I don't understand." },
      { id: "r-tetsudatte", type: "sentence", content_jp: "手伝ってください。", content_romaji: "Tetsudatte kudasai.", content_meaning: "Tolong bantu saya.", content_meaning_en: "Please help me." },
      { id: "r-moushiwake", type: "phrase", content_jp: "申し訳ありません。", content_romaji: "Moushiwake arimasen.", content_meaning: "Saya sangat minta maaf. (formal)", content_meaning_en: "I sincerely apologize. (formal)" },
    ],
  },
  "level-1-unit-1-sesi-1": {
    id: "level-1-unit-1-sesi-1",
    title: "Naik kereta & bus",
    title_en: "Taking trains & buses",
    level_id: "level-1",
    unit_id: "level-1-unit-1",
    items: [
      { id: "tr-eki", type: "phrase", content_jp: "駅はどこですか？", content_romaji: "Eki wa doko desu ka?", content_meaning: "Stasiun di mana?", content_meaning_en: "Where is the station?" },
      { id: "tr-kippu", type: "phrase", content_jp: "切符を買います。", content_romaji: "Kippu o kaimasu.", content_meaning: "Saya membeli tiket.", content_meaning_en: "I buy a ticket." },
      { id: "tr-noriba", type: "phrase", content_jp: "バス乗り場", content_romaji: "Basu noriba", content_meaning: "halte/tempat naik bus", content_meaning_en: "bus stop / boarding area" },
      { id: "tr-ikimasu", type: "sentence", content_jp: "東京まで行きます。", content_romaji: "Toukyou made ikimasu.", content_meaning: "Saya pergi sampai Tokyo.", content_meaning_en: "I go as far as Tokyo." },
    ],
  },
  "level-1-unit-1-sesi-2": {
    id: "level-1-unit-1-sesi-2",
    title: "Tanya arah",
    title_en: "Asking for directions",
    level_id: "level-1",
    unit_id: "level-1-unit-1",
    items: [
      { id: "dir-migi", type: "phrase", content_jp: "右", content_romaji: "migi", content_meaning: "kanan", content_meaning_en: "right" },
      { id: "dir-hidari", type: "phrase", content_jp: "左", content_romaji: "hidari", content_meaning: "kiri", content_meaning_en: "left" },
      { id: "dir-massugu", type: "phrase", content_jp: "まっすぐ", content_romaji: "massugu", content_meaning: "lurus", content_meaning_en: "straight ahead" },
      { id: "dir-chikai", type: "sentence", content_jp: "ここから近いですか？", content_romaji: "Koko kara chikai desu ka?", content_meaning: "Apakah dekat dari sini?", content_meaning_en: "Is it near from here?" },
    ],
  },
  "level-1-unit-2-sesi-1": {
    id: "level-1-unit-2-sesi-1",
    title: "Di konbini",
    title_en: "At the convenience store",
    level_id: "level-1",
    unit_id: "level-1-unit-2",
    items: [
      { id: "cv-fukuro", type: "phrase", content_jp: "袋はいりますか？", content_romaji: "Fukuro wa irimasu ka?", content_meaning: "Apakah perlu kantong?", content_meaning_en: "Do you need a bag?" },
      { id: "cv-daijoubu", type: "phrase", content_jp: "大丈夫です。", content_romaji: "Daijoubu desu.", content_meaning: "Tidak apa-apa / tidak perlu.", content_meaning_en: "It's okay / no need." },
      { id: "cv-atatame", type: "phrase", content_jp: "温めますか？", content_romaji: "Atatamemasu ka?", content_meaning: "Mau dipanaskan?", content_meaning_en: "Would you like it heated?" },
      { id: "cv-onegai", type: "sentence", content_jp: "お願いします。", content_romaji: "Onegai shimasu.", content_meaning: "Tolong / iya, silakan.", content_meaning_en: "Please / yes, please." },
    ],
  },
  "level-1-unit-2-sesi-2": {
    id: "level-1-unit-2-sesi-2",
    title: "Tanya harga & kembalian",
    title_en: "Asking prices & change",
    level_id: "level-1",
    unit_id: "level-1-unit-2",
    items: [
      { id: "shop-ikura", type: "phrase", content_jp: "いくらですか？", content_romaji: "Ikura desu ka?", content_meaning: "Berapa harganya?", content_meaning_en: "How much is it?" },
      { id: "shop-en", type: "phrase", content_jp: "五百円です。", content_romaji: "Gohyaku en desu.", content_meaning: "Harganya 500 yen.", content_meaning_en: "It is 500 yen." },
      { id: "shop-okaeshi", type: "phrase", content_jp: "お返しです。", content_romaji: "Okaeshi desu.", content_meaning: "Ini kembaliannya.", content_meaning_en: "Here is your change." },
      { id: "shop-card", type: "sentence", content_jp: "カードで払います。", content_romaji: "Kaado de haraimasu.", content_meaning: "Saya bayar dengan kartu.", content_meaning_en: "I will pay by card." },
    ],
  },
  "level-2-unit-1-sesi-1": {
    id: "level-2-unit-1-sesi-1",
    title: "Instruksi kerja dasar",
    title_en: "Basic work instructions",
    level_id: "level-2",
    unit_id: "level-2-unit-1",
    items: [
      { id: "work-kakunin", type: "phrase", content_jp: "確認してください。", content_romaji: "Kakunin shite kudasai.", content_meaning: "Tolong periksa/konfirmasi.", content_meaning_en: "Please check / confirm." },
      { id: "work-junbi", type: "phrase", content_jp: "準備します。", content_romaji: "Junbi shimasu.", content_meaning: "Saya akan menyiapkan.", content_meaning_en: "I will prepare it." },
      { id: "work-owari", type: "sentence", content_jp: "作業が終わりました。", content_romaji: "Sagyou ga owarimashita.", content_meaning: "Pekerjaan sudah selesai.", content_meaning_en: "The task is finished." },
      { id: "work-mada", type: "sentence", content_jp: "まだ終わっていません。", content_romaji: "Mada owatte imasen.", content_meaning: "Belum selesai.", content_meaning_en: "It is not finished yet." },
    ],
  },
  "level-2-unit-1-sesi-2": {
    id: "level-2-unit-1-sesi-2",
    title: "Lapor masalah singkat",
    title_en: "Reporting a small problem",
    level_id: "level-2",
    unit_id: "level-2-unit-1",
    items: [
      { id: "prob-mondai", type: "phrase", content_jp: "問題があります。", content_romaji: "Mondai ga arimasu.", content_meaning: "Ada masalah.", content_meaning_en: "There is a problem." },
      { id: "prob-koware", type: "sentence", content_jp: "機械が壊れました。", content_romaji: "Kikai ga kowaremashita.", content_meaning: "Mesinnya rusak.", content_meaning_en: "The machine broke." },
      { id: "prob-sugu", type: "phrase", content_jp: "すぐ確認します。", content_romaji: "Sugu kakunin shimasu.", content_meaning: "Saya segera cek.", content_meaning_en: "I will check right away." },
      { id: "prob-houkoku", type: "phrase", content_jp: "報告します。", content_romaji: "Houkoku shimasu.", content_meaning: "Saya akan melaporkan.", content_meaning_en: "I will report it." },
    ],
  },
  "level-2-unit-2-sesi-1": {
    id: "level-2-unit-2-sesi-1",
    title: "Minta izin dan konfirmasi",
    title_en: "Asking permission & confirming",
    level_id: "level-2",
    unit_id: "level-2-unit-2",
    items: [
      { id: "perm-ii", type: "sentence", content_jp: "入ってもいいですか？", content_romaji: "Haitte mo ii desu ka?", content_meaning: "Boleh masuk?", content_meaning_en: "May I enter?" },
      { id: "perm-shitsurei", type: "phrase", content_jp: "失礼します。", content_romaji: "Shitsurei shimasu.", content_meaning: "Permisi.", content_meaning_en: "Excuse me." },
      { id: "perm-mouichido", type: "sentence", content_jp: "もう一度確認してもいいですか？", content_romaji: "Mou ichido kakunin shite mo ii desu ka?", content_meaning: "Boleh saya konfirmasi sekali lagi?", content_meaning_en: "May I confirm one more time?" },
      { id: "perm-wakarimashita", type: "phrase", content_jp: "わかりました。", content_romaji: "Wakarimashita.", content_meaning: "Saya mengerti.", content_meaning_en: "Understood." },
    ],
  },
  "level-2-unit-2-sesi-2": {
    id: "level-2-unit-2-sesi-2",
    title: "Ucapan sebelum dan sesudah kerja",
    title_en: "Phrases before and after work",
    level_id: "level-2",
    unit_id: "level-2-unit-2",
    items: [
      { id: "manners-onegai", type: "phrase", content_jp: "よろしくお願いします。", content_romaji: "Yoroshiku onegai shimasu.", content_meaning: "Mohon bantuannya / terima kasih sebelumnya.", content_meaning_en: "Thank you in advance / please guide me." },
      { id: "manners-osaki", type: "phrase", content_jp: "お先に失礼します。", content_romaji: "Osaki ni shitsurei shimasu.", content_meaning: "Saya izin pulang duluan.", content_meaning_en: "Excuse me for leaving before you." },
      { id: "manners-otsukare", type: "phrase", content_jp: "お疲れ様でした。", content_romaji: "Otsukaresama deshita.", content_meaning: "Terima kasih atas kerja kerasnya.", content_meaning_en: "Thank you for your hard work." },
      { id: "manners-arigatou", type: "sentence", content_jp: "教えていただき、ありがとうございます。", content_romaji: "Oshiete itadaki, arigatou gozaimasu.", content_meaning: "Terima kasih sudah mengajari saya.", content_meaning_en: "Thank you for teaching me." },
    ],
  },
};

// Server function untuk ambil detail satu sesi
export const getSessionDetail = createServerFn({ method: "GET" })
  .inputValidator((sessionId: string) => sessionId)
  .handler(async (ctx): Promise<SessionDetail | null> => {
    const sessionId = ctx.data;
    return SESSION_ITEMS[sessionId] ?? null;
  });

// Helper: cari sessionId berikutnya di unit yang sama
export function findNextSessionId(sessionId: string): string | null {
  for (const level of CURRICULUM_DATA) {
    for (const unit of level.units) {
      const idx = unit.sessions.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        const next = unit.sessions[idx + 1];
        return next?.id ?? null;
      }
    }
  }
  return null;
}
