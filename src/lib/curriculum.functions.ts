import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SessionNode = {
  id: string;
  title: string;
  order_index: number;
  unit_id: string;
  completed: boolean;
  best_score: number | null;
};

export type UnitNode = {
  id: string;
  name: string;
  order_index: number;
  level_id: string;
  sessions: SessionNode[];
};

export type LevelNode = {
  id: string;
  name: string;
  order_index: number;
  unlock_threshold_pct: number;
  units: UnitNode[];
  status: "completed" | "current" | "locked";
  progress_pct: number;
};

export type CurriculumOverview = {
  full_name: string | null;
  current_level_id: string | null;
  levels: LevelNode[];
  items_learned: number;
  next_session: {
    session_id: string;
    session_title: string;
    unit_name: string;
    level_name: string;
    level_id: string;
    unit_progress_pct: number;
  } | null;
  last_session: {
    level_name: string;
    unit_name: string;
    session_title: string;
  } | null;
};

export const getCurriculumOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CurriculumOverview> => {
    const { supabase, userId } = context;

    const [levelsRes, attemptsRes, itemsRes, profileRes] = await Promise.all([
      supabase
        .from("levels")
        .select(
          "id,name,order_index,unlock_threshold_pct,units(id,name,order_index,level_id,sessions(id,title,order_index,unit_id))",
        )
        .order("order_index", { ascending: true }),
      supabase
        .from("session_attempts")
        .select("session_id, score_pct, completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }),
      supabase
        .from("item_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("profiles")
        .select("current_level_id, full_name")
        .eq("id", userId)
        .maybeSingle(),
    ]);

    if (levelsRes.error) throw new Error(levelsRes.error.message);

    const attempts = attemptsRes.data ?? [];
    // best score per session
    const bestBySession = new Map<string, number>();
    const latestBySession = new Map<string, string>();
    for (const a of attempts) {
      const cur = bestBySession.get(a.session_id) ?? 0;
      if (a.score_pct > cur) bestBySession.set(a.session_id, a.score_pct);
      if (!latestBySession.has(a.session_id)) latestBySession.set(a.session_id, a.completed_at);
    }

    const currentLevelId = profileRes.data?.current_level_id ?? null;
    const rawLevels = (levelsRes.data ?? []) as Array<{
      id: string;
      name: string;
      order_index: number;
      unlock_threshold_pct: number;
      units: Array<{
        id: string;
        name: string;
        order_index: number;
        level_id: string;
        sessions: Array<{ id: string; title: string; order_index: number; unit_id: string }>;
      }>;
    }>;

    const currentLevelOrder =
      rawLevels.find((l) => l.id === currentLevelId)?.order_index ?? 0;

    const levels: LevelNode[] = rawLevels.map((l) => {
      const units = [...(l.units ?? [])]
        .sort((a, b) => a.order_index - b.order_index)
        .map((u) => {
          const sessions = [...(u.sessions ?? [])]
            .sort((a, b) => a.order_index - b.order_index)
            .map((s) => {
              const best = bestBySession.get(s.id) ?? null;
              return {
                id: s.id,
                title: s.title,
                order_index: s.order_index,
                unit_id: s.unit_id,
                completed: (best ?? 0) >= l.unlock_threshold_pct,
                best_score: best,
              };
            });
          return { id: u.id, name: u.name, order_index: u.order_index, level_id: u.level_id, sessions };
        });

      const allSessions = units.flatMap((u) => u.sessions);
      const doneCount = allSessions.filter((s) => s.completed).length;
      const progress_pct = allSessions.length
        ? Math.round((doneCount / allSessions.length) * 100)
        : 0;

      let status: LevelNode["status"];
      if (l.order_index < currentLevelOrder) status = "completed";
      else if (l.order_index === currentLevelOrder) status = "current";
      else status = "locked";

      return {
        id: l.id,
        name: l.name,
        order_index: l.order_index,
        unlock_threshold_pct: l.unlock_threshold_pct,
        units,
        status,
        progress_pct,
      };
    });

    // next session: first non-completed session in current level (then next levels)
    let nextSession: CurriculumOverview["next_session"] = null;
    for (const lvl of levels) {
      if (lvl.status === "locked") continue;
      for (const u of lvl.units) {
        for (const s of u.sessions) {
          if (!s.completed) {
            const unitDone = u.sessions.filter((x) => x.completed).length;
            nextSession = {
              session_id: s.id,
              session_title: s.title,
              unit_name: u.name,
              level_name: lvl.name,
              level_id: lvl.id,
              unit_progress_pct: u.sessions.length
                ? Math.round((unitDone / u.sessions.length) * 100)
                : 0,
            };
            break;
          }
        }
        if (nextSession) break;
      }
      if (nextSession) break;
    }

    // last session: most recent attempt
    let lastSession: CurriculumOverview["last_session"] = null;
    const latest = attempts[0];
    if (latest) {
      for (const lvl of levels) {
        for (const u of lvl.units) {
          const s = u.sessions.find((x) => x.id === latest.session_id);
          if (s) {
            lastSession = { level_name: lvl.name, unit_name: u.name, session_title: s.title };
            break;
          }
        }
        if (lastSession) break;
      }
    }

    return {
      full_name: profileRes.data?.full_name ?? null,
      current_level_id: currentLevelId,
      levels,
      items_learned: itemsRes.count ?? 0,
      next_session: nextSession,
      last_session: lastSession,
    };
  });
