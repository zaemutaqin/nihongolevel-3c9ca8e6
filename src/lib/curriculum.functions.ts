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
  status: "available" | "locked" | "completed";
  units: UnitOverview[];
}

export interface CurriculumOverview {
  levels: LevelOverview[];
}

// ─── Data kurikulum hardcoded (tidak butuh Supabase) ─────────────────────────

const CURRICULUM_DATA: LevelOverview[] = [
  {
    id: "level-0",
    name: "Level 0 — Fondasi Mutlak",
    order_index: 0,
    progress_pct: 0,
    unlock_threshold_pct: 80,
    status: "available",
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
    units: [],
  },
];

// ─── Server function ──────────────────────────────────────────────────────────
// Mengembalikan data kurikulum.
// Saat ini menggunakan data hardcoded.
// Untuk menambahkan progress pengguna dari Supabase nanti,
// tambahkan query di dalam fungsi ini setelah Supabase terkonfigurasi.

export const getCurriculumOverview = createServerFn({ method: "GET" }).handler(
  async (): Promise<CurriculumOverview> => {
    // TODO: Setelah Supabase terhubung, uncomment kode berikut
    // untuk mengambil progress nyata pengguna:
    //
    // const { createClient } = await import("@/integrations/supabase/server");
    // const supabase = createClient();
    // const { data: attempts } = await supabase
    //   .from("session_attempts")
    //   .select("session_id, score_pct")
    //   .order("score_pct", { ascending: false });
    //
    // Lalu merge attempts ke CURRICULUM_DATA untuk update
    // completed dan best_score per sesi.

    return { levels: CURRICULUM_DATA };
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
