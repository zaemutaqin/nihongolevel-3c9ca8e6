// ============================================================
// Global Japanese TTS service.
// All audio in the app (kana cards, vocab, interview AI reply,
// slang, dashboard previews) must call speakJapanese() so the
// voice is consistent and as native-sounding as possible.
//
// Strategy:
//  - Prefer Google Japanese voices (most natural on Chrome/Edge/Android).
//  - Fall back to OS-native ja-JP voices (Kyoko/Otoya on macOS/iOS,
//    Haruka/Ichiro/Ayumi on Windows).
//  - Avoid English-locale "fake Japanese" voices.
//  - Chunk long text by sentence so playback isn't choppy and the engine
//    doesn't truncate the utterance after ~200 chars (Chrome bug).
// ============================================================

type Listener = () => void;

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesReady = false;
const readyListeners = new Set<Listener>();

function isClient(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Voice quality ranking — higher score = better.
function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = (v.name || "").toLowerCase();
  const lang = (v.lang || "").toLowerCase();
  if (!lang.startsWith("ja")) return -1;

  let s = 10;
  // Google network voices — usually best on Chrome/Edge/Android.
  if (name.includes("google")) s += 100;
  // Microsoft Neural/Online voices (Nanami, Keita, Aoi, Daichi, Mayu, Naoki).
  if (name.includes("nanami") || name.includes("keita") || name.includes("mayu")) s += 80;
  if (name.includes("aoi") || name.includes("daichi") || name.includes("naoki")) s += 70;
  if (name.includes("microsoft")) s += 40;
  // macOS / iOS native voices — clear and natural.
  if (name.includes("kyoko") || name.includes("otoya")) s += 60;
  // Premium / enhanced tags on Safari.
  if (name.includes("premium") || name.includes("enhanced") || name.includes("siri")) s += 30;
  // Local/installed beats remote on flaky networks.
  if (v.localService) s += 5;
  // Exact ja-JP beats generic ja.
  if (lang === "ja-jp") s += 3;
  // Penalize obvious novelty voices.
  if (name.includes("eddy") || name.includes("flo") || name.includes("rocko") || name.includes("grandma") || name.includes("grandpa")) s -= 50;
  return s;
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (!isClient()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  const japanese = voices.filter((v) => (v.lang || "").toLowerCase().startsWith("ja"));
  if (japanese.length === 0) return null;
  japanese.sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return japanese[0];
}

function refreshVoice() {
  cachedVoice = pickBestVoice();
  voicesReady = true;
  readyListeners.forEach((l) => {
    try {
      l();
    } catch {
      /* noop */
    }
  });
}

if (isClient()) {
  // Trigger the lazy voice load.
  const initial = window.speechSynthesis.getVoices();
  if (initial && initial.length > 0) refreshVoice();
  window.speechSynthesis.onvoiceschanged = refreshVoice;
  // Some browsers (mobile Safari) only populate after a tiny delay.
  setTimeout(() => {
    if (!voicesReady) refreshVoice();
  }, 250);
}

export function getJapaneseVoice(): SpeechSynthesisVoice | null {
  if (!cachedVoice && isClient()) refreshVoice();
  return cachedVoice;
}

export function isTtsAvailable(): boolean {
  return isClient();
}

export function onVoiceReady(cb: Listener): () => void {
  readyListeners.add(cb);
  if (voicesReady) cb();
  return () => readyListeners.delete(cb);
}

// Split text by Japanese + Latin sentence boundaries so the engine speaks
// each clause with natural prosody instead of one long monotone run.
function chunkJapanese(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  // Split on 。！？!?. and Japanese full-width versions, keep the punctuation.
  const parts = trimmed
    .split(/(?<=[。！？!?\.])\s*/u)
    .map((p) => p.trim())
    .filter(Boolean);
  // Merge tiny fragments so we don't pause after every 1-char piece.
  const merged: string[] = [];
  for (const p of parts) {
    if (merged.length > 0 && (merged[merged.length - 1].length + p.length) < 30) {
      merged[merged.length - 1] += " " + p;
    } else {
      merged.push(p);
    }
  }
  return merged.length > 0 ? merged : [trimmed];
}

export interface SpeakOptions {
  rate?: number;        // 0.5 – 1.5; default 0.95 — slightly slower than native for learners.
  pitch?: number;       // 0 – 2; default 1.
  volume?: number;      // 0 – 1; default 1.
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

let currentEndCb: (() => void) | null = null;

export function cancelSpeech() {
  if (!isClient()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
  currentEndCb = null;
}

export function speakJapanese(text: string, opts: SpeakOptions = {}): void {
  if (!isClient() || !text || !text.trim()) {
    opts.onError?.();
    return;
  }
  const synth = window.speechSynthesis;
  try {
    synth.cancel();
  } catch {
    /* noop */
  }

  const voice = getJapaneseVoice();
  const chunks = chunkJapanese(text);
  if (chunks.length === 0) {
    opts.onError?.();
    return;
  }

  const rate = opts.rate ?? 0.95;
  const pitch = opts.pitch ?? 1;
  const volume = opts.volume ?? 1;

  let started = false;
  let remaining = chunks.length;
  const finish = () => {
    if (currentEndCb === finish) currentEndCb = null;
    opts.onEnd?.();
  };
  currentEndCb = finish;

  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = "ja-JP";
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    if (voice) u.voice = voice;
    u.onstart = () => {
      if (!started) {
        started = true;
        opts.onStart?.();
      }
    };
    u.onend = () => {
      remaining -= 1;
      if (remaining <= 0 && currentEndCb === finish) finish();
    };
    u.onerror = () => {
      remaining -= 1;
      if (i === 0 && !started) opts.onError?.();
      if (remaining <= 0 && currentEndCb === finish) finish();
    };
    synth.speak(u);
  });
}
