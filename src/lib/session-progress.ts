// Per-session learning progress persisted in localStorage so closing or
// navigating away doesn't reset the user's position. Works for both guests
// and authenticated users — the same key persists across sessions on the
// same browser, satisfying the "Lanjutkan dari titik terakhir" requirement.

const PREFIX = "nihongo:belajar:progress:";
const LAST_KEY = "nihongo:belajar:last";

export type SessionPhase = "learn" | "listen" | "quiz" | "done";

export interface SessionProgress {
  sessionId: string;
  phase: SessionPhase;
  learnIdx: number;
  updatedAt: number; // epoch ms
}

function isClient() {
  return typeof window !== "undefined";
}

export function saveSessionProgress(p: SessionProgress): void {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(PREFIX + p.sessionId, JSON.stringify(p));
    // Also remember the most recent session so the dashboard "Lanjutkan"
    // button can jump straight back to it.
    window.localStorage.setItem(LAST_KEY, p.sessionId);
  } catch {
    /* noop */
  }
}

export function loadSessionProgress(sessionId: string): SessionProgress | null {
  if (!isClient()) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + sessionId);
    if (!raw) return null;
    const obj = JSON.parse(raw) as SessionProgress;
    if (!obj || obj.sessionId !== sessionId) return null;
    return obj;
  } catch {
    return null;
  }
}

export function clearSessionProgress(sessionId: string): void {
  if (!isClient()) return;
  try {
    window.localStorage.removeItem(PREFIX + sessionId);
  } catch {
    /* noop */
  }
}

export function getLastSessionId(): string | null {
  if (!isClient()) return null;
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
