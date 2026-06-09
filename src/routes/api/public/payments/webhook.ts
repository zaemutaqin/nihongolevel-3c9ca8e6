import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

async function getSupabase() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Only live subscriptions grant Pro on the published app.
// Sandbox subscriptions are still recorded for testing but don't flip is_pro.
async function setProStatus(userId: string, isPro: boolean, env: PaddleEnv) {
  if (env !== "live") return;
  const update: { is_pro: boolean; pro_activated_at?: string } = { is_pro: isPro };
  if (isPro) update.pro_activated_at = new Date().toISOString();
  await (await getSupabase()).from("profiles").update(update).eq("id", userId);
}

// Active = paid and in good standing OR in dunning (don't revoke during retries).
function statusGrantsAccess(status: string): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData, scheduledChange } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("No userId in customData");
    return;
  }
  const item = items[0];
  const priceId = item.price.importMeta?.externalId;
  const productId = item.product.importMeta?.externalId;
  if (!priceId || !productId) {
    console.warn("Skipping subscription: missing importMeta.externalId");
    return;
  }
  await (await getSupabase()).from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId,
      product_id: productId,
      price_id: priceId,
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );
  if (statusGrantsAccess(status)) {
    await setProStatus(userId, true, env);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(data: any, env: PaddleEnv) {
  const { id, status, currentBillingPeriod, scheduledChange, customData } = data;
  await (await getSupabase())
    .from("subscriptions")
    .update({
      status,
      current_period_start: currentBillingPeriod?.startsAt,
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  const userId = customData?.userId;
  if (!userId) return;

  if (statusGrantsAccess(status)) {
    // active / trialing / past_due — keep Pro on. Dunning preserves access.
    await setProStatus(userId, true, env);
  } else if (status === "canceled") {
    // Honor grace period: keep Pro until current_period_end (reconciliation job revokes later).
    const endsAt = currentBillingPeriod?.endsAt
      ? new Date(currentBillingPeriod.endsAt).getTime()
      : Date.now() - 1;
    if (endsAt <= Date.now()) {
      await setProStatus(userId, false, env);
    }
  } else {
    // paused or other non-access-granting states
    await setProStatus(userId, false, env);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  const { id, customData, currentBillingPeriod } = data;
  await (await getSupabase())
    .from("subscriptions")
    .update({
      status: "canceled",
      current_period_end: currentBillingPeriod?.endsAt,
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("paddle_subscription_id", id)
    .eq("environment", env);

  const userId = customData?.userId;
  if (!userId) return;

  // Only revoke immediately if the paid period has already ended.
  // Otherwise the reconciliation cron handles revocation at period_end.
  const endsAt = currentBillingPeriod?.endsAt
    ? new Date(currentBillingPeriod.endsAt).getTime()
    : 0;
  if (endsAt > 0 && endsAt <= Date.now()) {
    await setProStatus(userId, false, env);
  }
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.SubscriptionCreated:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionCreated(event.data as any, env);
      break;
    case EventName.SubscriptionUpdated:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionUpdated(event.data as any, env);
      break;
    case EventName.SubscriptionCanceled:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionCanceled(event.data as any, env);
      break;
    default:
      console.log("Unhandled event:", event.eventType);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const env = (url.searchParams.get("env") || "sandbox") as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
