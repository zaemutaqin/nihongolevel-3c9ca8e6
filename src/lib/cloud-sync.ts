import { supabase } from "@/integrations/supabase/client";

const KEYS = {
  history: "nihongo_history",
  favorite: "nihongo_favorites",
  review: "nihongo_review_queue",
  challenge: "nihongo_challenge_results",
} as const;

type Kind = keyof typeof KEYS;

function read(key: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(key: string, value: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("nihongo:storage", { detail: { key } }));
}

function itemId(kind: Kind, item: any, idx: number): number {
  if (kind === "challenge") {
    // No native id — synthesize stable id from history_id + date
    return Number(item.history_id ?? 0) * 1_000_000 + idx;
  }
  return Number(item.id ?? item.favorite_id ?? Date.now() + idx);
}

let isSyncing = false;

export async function syncOnLogin(userId: string): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    // Pull from cloud
    const { data: cloud, error } = await supabase
      .from("nihongo_data")
      .select("kind,item_id,data")
      .eq("user_id", userId);
    if (error) throw error;

    const cloudByKind: Record<Kind, any[]> = {
      history: [], favorite: [], review: [], challenge: [],
    };
    for (const row of cloud ?? []) {
      if (row.kind in cloudByKind) cloudByKind[row.kind as Kind].push(row.data);
    }

    // Merge cloud + local (cloud takes precedence on id collision; otherwise union)
    const toUpsert: { user_id: string; kind: string; item_id: number; data: any }[] = [];

    for (const kind of Object.keys(KEYS) as Kind[]) {
      const local = read(KEYS[kind]);
      const merged = new Map<number, any>();

      local.forEach((item, idx) => {
        merged.set(itemId(kind, item, idx), item);
      });
      cloudByKind[kind].forEach((item, idx) => {
        merged.set(itemId(kind, item, idx), item); // cloud overwrites
      });

      const mergedArr = Array.from(merged.values());
      write(KEYS[kind], mergedArr);

      // Push any local items not already in cloud
      const cloudIds = new Set(
        (cloud ?? []).filter((r) => r.kind === kind).map((r) => r.item_id),
      );
      local.forEach((item, idx) => {
        const id = itemId(kind, item, idx);
        if (!cloudIds.has(id)) {
          toUpsert.push({ user_id: userId, kind, item_id: id, data: item });
        }
      });
    }

    if (toUpsert.length > 0) {
      // Chunk to avoid payload limits
      for (let i = 0; i < toUpsert.length; i += 100) {
        await supabase
          .from("nihongo_data")
          .upsert(toUpsert.slice(i, i + 100), { onConflict: "user_id,kind,item_id" });
      }
    }
  } finally {
    isSyncing = false;
  }
}

// Best-effort background mirror on every local write
export function pushChange(localKey: string, items: any[]) {
  const kindEntry = Object.entries(KEYS).find(([, k]) => k === localKey) as
    | [Kind, string]
    | undefined;
  if (!kindEntry) return;
  const kind = kindEntry[0];

  (async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user?.id;
      if (!uid) return;

      // Get existing ids to detect deletions
      const { data: existing } = await supabase
        .from("nihongo_data")
        .select("item_id")
        .eq("user_id", uid)
        .eq("kind", kind);
      const existingIds = new Set((existing ?? []).map((r) => r.item_id as number));
      const currentIds = new Set<number>();
      const rows = items.map((item, idx) => {
        const id = itemId(kind as Kind, item, idx);
        currentIds.add(id);
        return { user_id: uid, kind, item_id: id, data: item };
      });
      const toDelete = Array.from(existingIds).filter((id) => !currentIds.has(id));

      if (rows.length > 0) {
        await supabase
          .from("nihongo_data")
          .upsert(rows, { onConflict: "user_id,kind,item_id" });
      }
      if (toDelete.length > 0) {
        await supabase
          .from("nihongo_data")
          .delete()
          .eq("user_id", uid)
          .eq("kind", kind)
          .in("item_id", toDelete);
      }
    } catch (e) {
      console.warn("[cloud-sync] push failed", e);
    }
  })();
}
