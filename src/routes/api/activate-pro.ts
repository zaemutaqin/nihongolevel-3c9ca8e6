import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  audit,
  clientIp,
  countEventsForIp,
  countEventsForUser,
  hoursAgoIso,
  jsonResponse,
  pickAllowedOrigin,
  preflightResponse,
  safeStringEqual,
  sleep,
} from "@/lib/security.server";

const InputSchema = z.object({
  code: z.string().trim().min(1).max(200),
});

const USER_DAY_MAX = 5;
const IP_DAY_MAX = 10;

export const Route = createFileRoute("/api/activate-pro")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => preflightResponse(pickAllowedOrigin(request)),

      POST: async ({ request }) => {
        const allowedOrigin = pickAllowedOrigin(request);
        if (!allowedOrigin) return jsonResponse({ error: "forbidden_origin" }, 403, null);
        const ip = clientIp(request);

        // Anti-brute-force delay (constant ~1s for ALL paths)
        const delayPromise = sleep(1000);

        let body: unknown;
        try { body = await request.json(); } catch {
          await delayPromise;
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }
        const parsed = InputSchema.safeParse(body);
        if (!parsed.success) {
          await delayPromise;
          return jsonResponse({ error: "invalid_input" }, 400, allowedOrigin);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.toLowerCase().startsWith("bearer ")
          ? authHeader.slice(7).trim() : "";
        if (!token) {
          await audit({ event_type: "auth_failure", ip_address: ip, success: false, error_code: "missing_token", metadata: { route: "activate-pro" } });
          await delayPromise;
          return jsonResponse({ error: "unauthorized" }, 401, allowedOrigin);
        }
        const { data: udata, error: uerr } = await supabaseAdmin.auth.getUser(token);
        if (uerr || !udata.user) {
          await audit({ event_type: "auth_failure", ip_address: ip, success: false, error_code: "invalid_token", metadata: { route: "activate-pro" } });
          await delayPromise;
          return jsonResponse({ error: "unauthorized" }, 401, allowedOrigin);
        }
        const user = udata.user;

        // Throttle by user (5/day) and by IP (10/day)
        const dayAgo = hoursAgoIso(24);
        const [userAttempts, ipAttempts] = await Promise.all([
          countEventsForUser(user.id, ["activate_pro_success", "activate_pro_invalid"], dayAgo),
          countEventsForIp(ip, ["activate_pro_success", "activate_pro_invalid"], dayAgo),
        ]);
        if (userAttempts >= USER_DAY_MAX || ipAttempts >= IP_DAY_MAX) {
          await audit({ event_type: "activate_pro_rate_limited", user_id: user.id, ip_address: ip, success: false, error_code: userAttempts >= USER_DAY_MAX ? "user_daily" : "ip_daily", metadata: { userAttempts, ipAttempts } });
          await delayPromise;
          return jsonResponse({ error: "rate_limit_exceeded", retry_after: 86400 }, 429, allowedOrigin, { "Retry-After": "86400" });
        }

        const expected = process.env.PRO_ACCESS_CODE;
        if (!expected) {
          console.error("PRO_ACCESS_CODE not configured");
          await delayPromise;
          return jsonResponse({ error: "server_misconfigured" }, 500, allowedOrigin);
        }

        const valid = safeStringEqual(parsed.data.code, expected);
        if (!valid) {
          await audit({ event_type: "activate_pro_invalid", user_id: user.id, ip_address: ip, success: false });
          await delayPromise;
          // Identical-shape response with valid path
          return jsonResponse({ ok: false }, 200, allowedOrigin);
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_pro: true, pro_activated_at: new Date().toISOString() })
          .eq("id", user.id);
        if (error) {
          console.error("activate-pro update failed", error);
          await audit({ event_type: "activate_pro_invalid", user_id: user.id, ip_address: ip, success: false, error_code: "update_failed" });
          await delayPromise;
          return jsonResponse({ error: "update_failed" }, 500, allowedOrigin);
        }
        await audit({ event_type: "activate_pro_success", user_id: user.id, ip_address: ip, success: true });
        await delayPromise;
        return jsonResponse({ ok: true }, 200, allowedOrigin);
      },
    },
  },
});
