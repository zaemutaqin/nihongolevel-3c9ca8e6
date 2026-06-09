import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  code: z.string().trim().min(1).max(200),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/activate-pro")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Same-origin guard
        const origin = request.headers.get("origin");
        const referer = request.headers.get("referer");
        const host = request.headers.get("host");
        const source = origin ?? referer ?? "";
        let okOrigin = false;
        if (source && host) {
          try {
            okOrigin = new URL(source).host === host;
          } catch {
            okOrigin = false;
          }
        }
        if (!okOrigin) return json({ error: "forbidden" }, 403);

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_request" }, 400);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) return json({ error: "invalid_request" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!token) return json({ error: "unauthorized" }, 401);
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        const user = userData.user;
        if (!user) return json({ error: "unauthorized" }, 401);

        const expected = process.env.PRO_ACCESS_CODE;
        if (!expected) {
          console.error("PRO_ACCESS_CODE not configured");
          return json({ error: "server_misconfigured" }, 500);
        }
        if (parsed.data.code !== expected) {
          return json({ ok: false, error: "invalid_code" }, 200);
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_pro: true, pro_activated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (error) {
          console.error("activate-pro update failed", error);
          return json({ error: "update_failed" }, 500);
        }
        return json({ ok: true });
      },
    },
  },
});
