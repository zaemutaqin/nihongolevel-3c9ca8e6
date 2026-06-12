import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubscriptionSchema = (raw: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
}) => {
  if (!raw.endpoint || typeof raw.endpoint !== "string" || raw.endpoint.length > 2000) {
    throw new Error("Invalid endpoint");
  }
  if (!raw.p256dh || typeof raw.p256dh !== "string" || raw.p256dh.length > 500) {
    throw new Error("Invalid p256dh key");
  }
  if (!raw.auth || typeof raw.auth !== "string" || raw.auth.length > 200) {
    throw new Error("Invalid auth key");
  }
  return raw;
};

export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SubscriptionSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: { endpoint: string }) => {
    if (!raw.endpoint || typeof raw.endpoint !== "string") throw new Error("Invalid endpoint");
    return raw;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", data.endpoint);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    if (!subs || subs.length === 0) return { sent: 0 };
    const { sendPushToSubscriptions } = await import("@/lib/web-push.server");
    const sent = await sendPushToSubscriptions(subs, {
      title: "Test notifikasi 🎌",
      body: "Push notification kamu aktif!",
      url: "/",
    });
    return { sent };
  });
