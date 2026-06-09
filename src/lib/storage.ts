import type {
  TranslationResult,
  LevelBlock,
  IntentInfo,
  IntentType,
  SocialAnalysis,
  MostNatural,
  AlternativeExpression,
  Naturalness,
} from "./translate.functions";

export type LevelKey = "n4" | "n3" | "n2" | "n1";

export interface HistoryEntry {
  id: number;
  date: string;
  input: string;
  intent: IntentInfo;
  social_analysis: SocialAnalysis;
  most_natural: MostNatural;
  alternatives: AlternativeExpression[];
  levels: Record<LevelKey, LevelBlock>;
}

export interface FavoriteEntry {
  id: number;
  added_at: string;
  source_history_id: number;
  input: string;
  intent: IntentInfo;
  // either a level expression or the most-natural one
  kind: "level" | "most_natural";
  level: string; // N4/N3/N2/N1
  japanese: string;
  romaji: string;
  meaning: string; // for most_natural: reason; for level: nuance
  naturalness?: Naturalness;
  naturalness_note?: string;
  nuance?: string;
  why_this_level?: string;
  grammar?: { pattern: string; explanation: string }[];
  kanji?: { char: string; reading: string; meaning: string; examples: string; jlpt: string }[];
}

export interface ReviewItem {
  id: number; // matches favorite.id
  favorite_id: number;
  last_reviewed: string | null;
  times_correct: number;
  times_incorrect: number;
  next_review_date: string; // ISO
}

const HISTORY_KEY = "nihongo_history";
const FAVORITES_KEY = "nihongo_favorites";
const REVIEW_KEY = "nihongo_review_queue";
const RESULT_CACHE_KEY = "nihongo_result_cache";
const RESULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RESULT_CACHE_MAX = 10;

interface CacheEntry {
  key: string;
  ts: number;
  result: TranslationResult;
}

export function buildCacheKey(sentence: string, listener?: string, mood?: string): string {
  return `${sentence.trim().toLowerCase()}|${(listener ?? "").trim()}|${(mood ?? "").trim()}`;
}

export function getCachedResult(key: string): TranslationResult | null {
  const all = read<CacheEntry>(RESULT_CACHE_KEY);
  const now = Date.now();
  const fresh = all.filter((e) => now - e.ts < RESULT_CACHE_TTL_MS);
  if (fresh.length !== all.length) write(RESULT_CACHE_KEY, fresh);
  return fresh.find((e) => e.key === key)?.result ?? null;
}

export function setCachedResult(key: string, result: TranslationResult): void {
  const now = Date.now();
  const all = read<CacheEntry>(RESULT_CACHE_KEY)
    .filter((e) => e.key !== key && now - e.ts < RESULT_CACHE_TTL_MS);
  all.unshift({ key, ts: now, result });
  write(RESULT_CACHE_KEY, all.slice(0, RESULT_CACHE_MAX));
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  // notify listeners in same tab
  window.dispatchEvent(new CustomEvent("nihongo:storage", { detail: { key } }));
}

// ============== History ==============
export function getHistory(): HistoryEntry[] {
  return read<HistoryEntry>(HISTORY_KEY).sort((a, b) => b.id - a.id);
}

export function addHistory(input: string, result: TranslationResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: Date.now(),
    date: new Date().toISOString(),
    input,
    intent: result.intent,
    social_analysis: result.social_analysis,
    most_natural: result.most_natural,
    alternatives: result.alternatives ?? [],
    levels: { n4: result.n4, n3: result.n3, n2: result.n2, n1: result.n1 },
  };
  const all = read<HistoryEntry>(HISTORY_KEY);
  all.push(entry);
  write(HISTORY_KEY, all);
  return entry;
}

export function deleteHistory(id: number) {
  write(HISTORY_KEY, read<HistoryEntry>(HISTORY_KEY).filter((h) => h.id !== id));
}

// ============== Favorites ==============
export function getFavorites(): FavoriteEntry[] {
  return read<FavoriteEntry>(FAVORITES_KEY).sort((a, b) => b.id - a.id);
}

export function addFavoriteFromMostNatural(h: HistoryEntry): FavoriteEntry {
  const fav: FavoriteEntry = {
    id: Date.now(),
    added_at: new Date().toISOString(),
    source_history_id: h.id,
    input: h.input,
    intent: h.intent,
    kind: "most_natural",
    level: h.most_natural.level,
    japanese: h.most_natural.japanese,
    romaji: h.most_natural.romaji,
    meaning: h.most_natural.reason,
  };
  const all = read<FavoriteEntry>(FAVORITES_KEY);
  all.push(fav);
  write(FAVORITES_KEY, all);
  ensureReviewItem(fav);
  return fav;
}

export function addFavoriteFromLevel(h: HistoryEntry, levelKey: LevelKey): FavoriteEntry {
  const b = h.levels[levelKey];
  const fav: FavoriteEntry = {
    id: Date.now(),
    added_at: new Date().toISOString(),
    source_history_id: h.id,
    input: h.input,
    intent: h.intent,
    kind: "level",
    level: levelKey.toUpperCase(),
    japanese: b.japanese,
    romaji: b.romaji,
    meaning: b.nuance,
    naturalness: b.naturalness,
    naturalness_note: b.naturalness_note,
    nuance: b.nuance,
    why_this_level: b.why_this_level,
    grammar: b.grammar,
    kanji: b.kanji,
  };
  const all = read<FavoriteEntry>(FAVORITES_KEY);
  all.push(fav);
  write(FAVORITES_KEY, all);
  ensureReviewItem(fav);
  return fav;
}

export function removeFavorite(id: number) {
  write(FAVORITES_KEY, read<FavoriteEntry>(FAVORITES_KEY).filter((f) => f.id !== id));
  write(REVIEW_KEY, read<ReviewItem>(REVIEW_KEY).filter((r) => r.favorite_id !== id));
}

export function isFavorited(historyId: number, kind: "level" | "most_natural", level?: string): boolean {
  return getFavorites().some(
    (f) =>
      f.source_history_id === historyId &&
      f.kind === kind &&
      (kind === "most_natural" || f.level === level),
  );
}

// ============== Review ==============
export function getReviewQueue(): ReviewItem[] {
  return read<ReviewItem>(REVIEW_KEY);
}

function ensureReviewItem(fav: FavoriteEntry) {
  const all = read<ReviewItem>(REVIEW_KEY);
  if (all.some((r) => r.favorite_id === fav.id)) return;
  all.push({
    id: fav.id,
    favorite_id: fav.id,
    last_reviewed: null,
    times_correct: 0,
    times_incorrect: 0,
    next_review_date: new Date().toISOString(),
  });
  write(REVIEW_KEY, all);
}

export function rateReview(favoriteId: number, correct: boolean) {
  const all = read<ReviewItem>(REVIEW_KEY);
  const now = new Date();
  const idx = all.findIndex((r) => r.favorite_id === favoriteId);
  if (idx === -1) return;
  const item = all[idx];
  const days = correct ? 7 : 1;
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  all[idx] = {
    ...item,
    last_reviewed: now.toISOString(),
    times_correct: item.times_correct + (correct ? 1 : 0),
    times_incorrect: item.times_incorrect + (correct ? 0 : 1),
    next_review_date: next.toISOString(),
  };
  write(REVIEW_KEY, all);
}

export function getDueReviewFavorites(): FavoriteEntry[] {
  const queue = getReviewQueue();
  const favs = getFavorites();
  const now = Date.now();
  const dueIds = new Set(
    queue.filter((r) => new Date(r.next_review_date).getTime() <= now).map((r) => r.favorite_id),
  );
  return favs.filter((f) => dueIds.has(f.id));
}

// Favorites whose last_reviewed is null or 7+ days ago
export function getFavoritesNeedsReview7d(): FavoriteEntry[] {
  const queue = getReviewQueue();
  const favs = getFavorites();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const map = new Map(queue.map((r) => [r.favorite_id, r]));
  return favs.filter((f) => {
    const r = map.get(f.id);
    if (!r || !r.last_reviewed) return true;
    return new Date(r.last_reviewed).getTime() <= cutoff;
  });
}

// Oldest reviewed favorites (null last_reviewed counts as oldest)
export function getOldestReviewedFavorites(limit = 3): { fav: FavoriteEntry; lastReviewed: string | null }[] {
  const queue = getReviewQueue();
  const favs = getFavorites();
  const map = new Map(queue.map((r) => [r.favorite_id, r]));
  return favs
    .map((f) => {
      const r = map.get(f.id);
      const last = r?.last_reviewed ?? null;
      const ts = last ? new Date(last).getTime() : 0;
      return { fav: f, lastReviewed: last, ts };
    })
    .sort((a, b) => a.ts - b.ts)
    .slice(0, limit)
    .map(({ fav, lastReviewed }) => ({ fav, lastReviewed }));
}

// ============== Situation challenges ==============
const CHALLENGE_KEY = "nihongo_challenge_results";
export interface ChallengeResult {
  history_id: number;
  date: string;
  success: boolean;
}
export function getChallengeResults(): ChallengeResult[] {
  return read<ChallengeResult>(CHALLENGE_KEY);
}
export function addChallengeResult(historyId: number, success: boolean) {
  const all = read<ChallengeResult>(CHALLENGE_KEY);
  all.push({ history_id: historyId, date: new Date().toISOString(), success });
  write(CHALLENGE_KEY, all);
}
export function getChallengeResultsToday(): ChallengeResult[] {
  const today = new Date().toDateString();
  return getChallengeResults().filter((r) => new Date(r.date).toDateString() === today);
}


// ============== React hook ==============
import { useEffect, useState, useCallback } from "react";

export function useLocalCollection<T>(loader: () => T[]): [T[], () => void] {
  const [data, setData] = useState<T[]>([]);
  const refresh = useCallback(() => setData(loader()), [loader]);
  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("nihongo:storage", onStorage as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("nihongo:storage", onStorage as EventListener);
    };
  }, [refresh]);
  return [data, refresh];
}

// ============== Stats helpers ==============
export function getStreakDays(): number {
  const hist = getHistory();
  if (hist.length === 0) return 0;
  const days = new Set(hist.map((h) => new Date(h.date).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getSearchesThisWeek(): number {
  const hist = getHistory();
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return hist.filter((h) => new Date(h.date).getTime() >= since).length;
}

export function getIntentCounts(): { type: IntentType; count: number }[] {
  const hist = getHistory();
  const map = new Map<IntentType, number>();
  for (const h of hist) {
    map.set(h.intent.type, (map.get(h.intent.type) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function getLevelDistribution(): Record<string, number> {
  const hist = getHistory();
  const dist: Record<string, number> = { N4: 0, N3: 0, N2: 0, N1: 0 };
  for (const h of hist) {
    const lvl = h.most_natural.level?.toUpperCase();
    if (lvl && dist[lvl] !== undefined) dist[lvl]++;
  }
  return dist;
}

export function formatIndonesianDate(iso: string): string {
  const d = new Date(iso);
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${hh}:${mm}`;
}
