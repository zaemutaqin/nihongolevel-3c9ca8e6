import { createFileRoute } from "@tanstack/react-router";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";

async function getSupabase() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// Lifetime: once granted, always Pro. Only live transactions flip is_pro.
async function grantLifetimePro(userId: string, env: PaddleEnv) {
  if (env !== "live") return;
  await (await getSupabase())
    .from("profiles")
    .update({ is_pro: true, pro_activated_at: new Date().toISOString() })
    .eq("id", userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTransactionCompleted(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.error("transaction.completed: missing customData.userId", { id });
    return;
  }
  if (status && status !== "completed" && status !== "paid") {
    console.log("transaction.completed: ignoring non-paid status", status);
    return;
  }
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  if (!priceId) {
    console.warn("transaction.completed: missing price externalId — skipping", {
      id,
      rawPriceId: item?.price?.id,
    });
    return;
  }
  // Record the purchase for audit (re-use subscriptions table, status=lifetime).
  try {
    await (await getSupabase()).from("subscriptions").upsert(
      {
        user_id: userId,
        paddle_subscription_id: id, // transaction id used as unique key
        paddle_customer_id: customerId ?? "",
        product_id: item?.price?.productId ?? "nihongolevel_pro",
        price_id: priceId,
        status: "lifetime",
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "paddle_subscription_id" },
    );
  } catch (e) {
    console.error("Failed to record lifetime purchase", e);
  }
  await grantLifetimePro(userId, env);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionEvent(data: any, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, scheduledChange, customData } = data;
  const userId = customData?.userId;
  if (!userId) {
    console.warn("subscription event: missing customData.userId", { id });
    return;
  }
  const item = items?.[0];
  const priceId = item?.price?.importMeta?.externalId;
  const productId = item?.price?.productId ?? item?.product?.id ?? "nihongolevel_pro";
  if (!priceId) {
    console.warn("subscription event: missing price externalId — skipping", { id });
    return;
  }
  await (await getSupabase()).from("subscriptions").upsert(
    {
      user_id: userId,
      paddle_subscription_id: id,
      paddle_customer_id: customerId ?? "",
      product_id: productId,
      price_id: priceId,
      status: status ?? "active",
      current_period_start: currentBillingPeriod?.startsAt ?? null,
      current_period_end: currentBillingPeriod?.endsAt ?? null,
      cancel_at_period_end: scheduledChange?.action === "cancel",
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "paddle_subscription_id" },
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCanceled(data: any, env: PaddleEnv) {
  await (await getSupabase())
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("paddle_subscription_id", data.id)
    .eq("environment", env);
}

async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.eventType) {
    case EventName.TransactionCompleted:
    case EventName.TransactionPaid:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleTransactionCompleted(event.data as any, env);
      break;
    case EventName.SubscriptionCreated:
    case EventName.SubscriptionUpdated:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await handleSubscriptionEvent(event.data as any, env);
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
