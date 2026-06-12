// Server-only helper for sending Web Push notifications via VAPID.
// Import this file ONLY from server function handlers (inside .handler())
// or from other *.server.ts modules — never at module scope from client-reachable code.

import webpush from "web-push";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@nihongolevel.app";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

export type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToSubscriptions(
  subscriptions: SubscriptionRow[],
  payload: PushPayload,
): Promise<number> {
  ensureConfigured();
  const json = JSON.stringify(payload);
  let sent = 0;
  const expired: string[] = [];

  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          json,
        );
        sent += 1;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) expired.push(s.endpoint);
        else console.error("[web-push] send failed", statusCode, err);
      }
    }),
  );

  if (expired.length > 0) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("push_subscriptions").delete().in("endpoint", expired);
    } catch (err) {
      console.error("[web-push] cleanup failed", err);
    }
  }

  return sent;
}
