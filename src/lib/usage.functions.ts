import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// PRD free-plan daily caps. Keep in sync with /api/translate and /api/interview.
export const FREE_TRANSLATE_CAP = 10;
export const FREE_INTERVIEW_CAP = 2;

export const getMyUsage = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { countEventsForUser, hoursAgoIso } = await import("@/lib/security.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const userId = context.userId;
    const dayAgo = hoursAgoIso(24);

    const [translateUsed, interviewUsed, profRes] = await Promise.all([
      countEventsForUser(userId, ["translate_success", "translate_fail"], dayAgo),
      countEventsForUser(userId, ["interview_feedback"], dayAgo),
      supabaseAdmin.from("profiles").select("is_pro").eq("id", userId).maybeSingle(),
    ]);

    const isPro = !!profRes.data?.is_pro;

    return {
      isPro,
      translate: {
        used: translateUsed,
        cap: isPro ? null : FREE_TRANSLATE_CAP,
      },
      interview: {
        used: interviewUsed,
        cap: isPro ? null : FREE_INTERVIEW_CAP,
      },
    };
  });
