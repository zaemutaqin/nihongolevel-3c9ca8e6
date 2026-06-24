import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ReviewResponse = "again" | "hard" | "good" | "easy";

export type DueReviewItem = {
  item_id: string;
  content_jp: string;
  content_romaji: string | null;
  content_meaning: string | null;
  audio_url: string | null;
  correct_streak: number;
  next_review_at: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const reviewItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { itemId: string; response: ReviewResponse }) => {
    if (!d || typeof d.itemId !== "string" || !d.itemId) throw new Error("itemId required");
    if (!["again", "hard", "good", "easy"].includes(d.response)) throw new Error("invalid response");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: itemExists, error: itemError } = await supabase
      .from("learning_items")
      .select("id")
      .eq("id", data.itemId)
      .maybeSingle();
    if (itemError) throw new Error(itemError.message);
    if (!itemExists) return { ok: true as const, skipped: true as const };

    const { data: prev } = await supabase
      .from("item_progress")
      .select("correct_streak, ease_factor, last_seen_at, next_review_at")
      .eq("user_id", userId)
      .eq("item_id", data.itemId)
      .maybeSingle();

    const now = new Date();
    let ease = prev?.ease_factor ?? 2.5;
    let streak = prev?.correct_streak ?? 0;
    let prevIntervalDays = 0;
    if (prev?.last_seen_at && prev?.next_review_at) {
      const delta =
        (new Date(prev.next_review_at).getTime() - new Date(prev.last_seen_at).getTime()) / DAY_MS;
      prevIntervalDays = Math.max(0, delta);
    }

    let intervalDays: number;
    switch (data.response) {
      case "again":
        streak = 0;
        ease = Math.max(1.3, ease - 0.2);
        intervalDays = 1;
        break;
      case "hard":
        streak += 1;
        ease = Math.max(1.3, ease - 0.05);
        intervalDays = prevIntervalDays > 0 ? prevIntervalDays * 1.2 : 1;
        break;
      case "good":
        streak += 1;
        intervalDays = prevIntervalDays > 0 ? prevIntervalDays * ease : 1;
        break;
      case "easy":
        streak += 1;
        ease = ease + 0.15;
        intervalDays = prevIntervalDays > 0 ? prevIntervalDays * ease * 1.3 : 2;
        break;
    }

    const next = new Date(now.getTime() + intervalDays * DAY_MS);
    const { error } = await supabase
      .from("item_progress")
      .upsert(
        {
          user_id: userId,
          item_id: data.itemId,
          correct_streak: streak,
          ease_factor: ease,
          last_seen_at: now.toISOString(),
          next_review_at: next.toISOString(),
        },
        { onConflict: "user_id,item_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const, intervalDays, ease, streak };
  });

export const getDueReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DueReviewItem[]> => {
    const { supabase } = context;
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from("item_progress")
      .select(
        "item_id, correct_streak, next_review_at, learning_items!inner(content_jp, content_romaji, content_meaning, audio_url)",
      )
      .lte("next_review_at", nowIso)
      .order("next_review_at", { ascending: true })
      .order("correct_streak", { ascending: true })
      .limit(20);
    if (error) throw new Error(error.message);
    type Row = {
      item_id: string;
      correct_streak: number;
      next_review_at: string;
      learning_items: {
        content_jp: string;
        content_romaji: string | null;
        content_meaning: string | null;
        audio_url: string | null;
      } | null;
    };
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.learning_items)
      .map((r) => ({
        item_id: r.item_id,
        correct_streak: r.correct_streak,
        next_review_at: r.next_review_at,
        content_jp: r.learning_items!.content_jp,
        content_romaji: r.learning_items!.content_romaji,
        content_meaning: r.learning_items!.content_meaning,
        audio_url: r.learning_items!.audio_url,
      }));
  });
