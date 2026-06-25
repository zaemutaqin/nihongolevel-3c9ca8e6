import { createFileRoute } from "@tanstack/react-router";

// Cron-triggered endpoint. Sends a daily streak reminder push to every user
// who has at least one push subscription. Authenticated by a private
// CRON_SECRET passed via the `x-cron-secret` header.

export const Route = createFileRoute("/api/public/hooks/daily-streak-push")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { safeStringEqual } = await import("@/lib/security.server");
        const provided = request.headers.get("x-cron-secret") ?? "";
        const expected = process.env.CRON_SECRET ?? "";
        if (!expected || !provided || !safeStringEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPushToSubscriptions } = await import("@/lib/web-push.server");

        const { data: subs, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth");

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (!subs || subs.length === 0) {
          return Response.json({ ok: true, sent: 0 });
        }

        const sent = await sendPushToSubscriptions(subs, {
          title: "Saatnya belajar! 🔥",
          body: "Jaga streak kamu — buka Nihongolive dan cari 1 kata hari ini.",
          url: "/translate",
          tag: "daily-streak",
        });

        return Response.json({ ok: true, sent, total: subs.length });
      },
    },
  },
});
