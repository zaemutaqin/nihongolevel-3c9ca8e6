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
        const { safeStringEqual } = await import("@/lib/security.server");
        const provided = request.headers.get("x-cron-secret") ?? "";
        const expected = process.env.CRON_SECRET ?? "";
        if (!expected || !provided || !safeStringEqual(provided, expected)) {
          return new Response("Unauthorized", { status: 401 });
        }
        return Response.json({ ok: true, model: "lifetime", revoked: 0 });
      },
    },
  },
});
