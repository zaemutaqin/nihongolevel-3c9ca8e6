import { createFileRoute } from "@tanstack/react-router";

/**
 * Lifetime pricing model: nothing to reconcile. Pro access never expires
 * once granted. Endpoint kept as a no-op so any existing cron call still
 * returns 200 instead of 404.
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
        return Response.json({ ok: true, model: "lifetime", revoked: 0 });
      },
    },
  },
});
