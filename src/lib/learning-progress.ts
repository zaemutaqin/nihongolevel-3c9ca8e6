import type { CurriculumOverview, LevelOverview, SessionRef, UnitOverview } from "@/lib/curriculum.functions";

export type StoredLearningPhase = "learn" | "listen" | "quiz" | "done";

export type StoredSessionProgress = {
  phase: StoredLearningPhase;
  learnIdx: number;
  listenIdx: number;
  quizIdx: number;
  step: number;
  totalSteps: number;
  lives: number;
  correctIds: string[];
  wrongIds: string[];
  completed: boolean;
  scorePct: number | null;
  updatedAt: string;
};

export type LearningProgressMap = Record<string, StoredSessionProgress>;

const STORAGE_PREFIX = "nihongolevel_learning_progress_v1";
const CHANGE_EVENT = "nihongolevel_learning_progress_change";

function storageKey(userId: string | null | undefined) {
  return `${STORAGE_PREFIX}:${userId || "guest"}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readLearningProgress(userId: string | null | undefined): LearningProgressMap {
  if (!canUseStorage()) return {};
  const readKey = (key: string): LearningProgressMap => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as LearningProgressMap;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  try {
    if (userId) {
      return { ...readKey(storageKey(null)), ...readKey(storageKey(userId)) };
    }

    let merged: LearningProgressMap = {};
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(`${STORAGE_PREFIX}:`)) merged = { ...merged, ...readKey(key) };
    }
    return merged;
  } catch {
    return {};
  }
}

export function getStoredSessionProgress(
  userId: string | null | undefined,
  sessionId: string,
): StoredSessionProgress | null {
  return readLearningProgress(userId)[sessionId] ?? readLearningProgress(null)[sessionId] ?? null;
}

export function saveStoredSessionProgress(
  userId: string | null | undefined,
  sessionId: string,
  progress: Omit<StoredSessionProgress, "updatedAt"> & { updatedAt?: string },
) {
  if (!canUseStorage()) return;
  const next = {
    ...readLearningProgress(userId),
    [sessionId]: {
      ...progress,
      updatedAt: progress.updatedAt ?? new Date().toISOString(),
    },
  } satisfies LearningProgressMap;
  window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function subscribeLearningProgress(callback: () => void) {
  if (!canUseStorage()) return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getSessionProgressRatio(progress: StoredSessionProgress | undefined | null) {
  if (!progress) return 0;
  if (progress.completed) return 1;
  return Math.max(0, Math.min(0.99, progress.step / Math.max(1, progress.totalSteps)));
}

function sessionRefFrom(level: LevelOverview, unit: UnitOverview, sessionId: string): SessionRef | null {
  const session = unit.sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const unitRatio = unit.sessions.reduce((sum, s) => sum + (s.completed ? 1 : 0), 0) / Math.max(1, unit.sessions.length);
  return {
    session_id: session.id,
    session_title: session.title,
    unit_name: unit.name,
    level_name: level.name,
    unit_progress_pct: Math.round(unitRatio * 100),
  };
}

export function applyLearningProgressToOverview(
  overview: CurriculumOverview | undefined,
  progressMap: LearningProgressMap,
): CurriculumOverview | undefined {
  if (!overview) return overview;

  const levels = overview.levels.map((level) => ({
    ...level,
    units: level.units.map((unit) => ({
      ...unit,
      sessions: unit.sessions.map((session) => {
        const progress = progressMap[session.id];
        const ratio = getSessionProgressRatio(progress);
        return {
          ...session,
          completed: session.completed || ratio >= 1,
          best_score: progress?.scorePct ?? session.best_score,
        };
      }),
    })),
  }));

  levels.forEach((level) => {
    let totalRatio = 0;
    let totalSessions = 0;

    level.units.forEach((unit) => {
      let unitRatio = 0;
      unit.sessions.forEach((session) => {
        unitRatio += getSessionProgressRatio(progressMap[session.id]);
      });
      totalRatio += unitRatio;
      totalSessions += unit.sessions.length;
    });

    level.progress_pct = totalSessions > 0 ? Math.round((totalRatio / totalSessions) * 100) : 0;
  });

  levels.forEach((level, index) => {
    const previous = levels[index - 1];
    const locked = index > 0 && (!previous || previous.progress_pct < previous.unlock_threshold_pct);
    if (locked) level.status = "locked";
    else if (level.progress_pct >= 100 && level.units.some((u) => u.sessions.length > 0)) level.status = "completed";
    else level.status = "available";
  });

  const current = levels.find((level) => level.status === "available");
  if (current) current.status = "current";

  let latestPartial: { sessionId: string; updatedAt: string } | null = null;
  for (const [sessionId, progress] of Object.entries(progressMap)) {
    if (progress.completed || progress.step <= 0) continue;
    if (!latestPartial || progress.updatedAt > latestPartial.updatedAt) {
      latestPartial = { sessionId, updatedAt: progress.updatedAt };
    }
  }

  let nextSession: SessionRef | null = null;
  let lastSession: SessionRef | null = null;

  const findRef = (sessionId: string) => {
    for (const level of levels) {
      if (level.status === "locked") continue;
      for (const unit of level.units) {
        const ref = sessionRefFrom(level, unit, sessionId);
        if (ref) {
          const unitRatio = unit.sessions.reduce(
            (sum, s) => sum + getSessionProgressRatio(progressMap[s.id]),
            0,
          );
          ref.unit_progress_pct = Math.round((unitRatio / Math.max(1, unit.sessions.length)) * 100);
          return ref;
        }
      }
    }
    return null;
  };

  if (latestPartial) {
    nextSession = findRef(latestPartial.sessionId);
    lastSession = nextSession;
  }

  if (!nextSession) {
    const currentLevel = levels.find((level) => level.status === "current") ?? levels.find((level) => level.status !== "locked");
    if (currentLevel) {
      outer: for (const unit of currentLevel.units) {
        for (const session of unit.sessions) {
          if (!session.completed) {
            nextSession = findRef(session.id);
            break outer;
          }
        }
      }
    }
  }

  const itemsLearned = Object.values(progressMap).reduce(
    (sum, progress) => sum + Math.min(progress.step, progress.totalSteps),
    0,
  );

  return {
    ...overview,
    levels,
    next_session: nextSession,
    last_session: lastSession ?? overview.last_session,
    items_learned: Math.max(overview.items_learned ?? 0, itemsLearned),
  };
}