import { createFileRoute } from "@tanstack/react-router";

/**
 * Hourly reconciliation: revoke is_pro for live subscriptions that have ended
 * (canceled and past current_period_end, or expired without renewing).
 *
 * Auth: Supabase publishable/anon key in `apikey` header — set by pg_cron.
 * Live-only by design; sandbox never grants is_pro.
 */
export const Route = createFileRoute("/api/public/payments/reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const nowIso = new Date().toISOString();

        // Find live subs whose paid period has ended and aren't active anymore.
        const { data: expired, error } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id, status, current_period_end")
          .eq("environment", "live")
          .lt("current_period_end", nowIso)
          .in("status", ["canceled", "paused", "past_due"]);

        if (error) {
          console.error("reconcile query failed", error);
          return new Response("error", { status: 500 });
        }

        let revoked = 0;
        for (const row of expired ?? []) {
          // Only revoke if the user has NO other still-active live sub.
          const { data: stillActive } = await supabaseAdmin
            .from("subscriptions")
            .select("id")
            .eq("user_id", row.user_id as string)
            .eq("environment", "live")
            .in("status", ["active", "trialing"])
            .limit(1)
            .maybeSingle();
          if (stillActive) continue;

          await supabaseAdmin
            .from("profiles")
            .update({ is_pro: false })
            .eq("id", row.user_id as string);
          revoked += 1;
        }

        return Response.json({ ok: true, checked: expired?.length ?? 0, revoked });
      },
    },
  },
});
