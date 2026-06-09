import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getPaddleClient, type PaddleEnv } from "@/lib/paddle.server";

/**
 * Returns the Paddle customer portal URL for the calling user's most recent
 * subscription in the given environment. Caller passes environment so we never
 * leak live data into a sandbox session or vice versa.
 */
export const createCustomerPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!sub) throw new Error("No subscription found");

    const paddle = getPaddleClient(data.environment);
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id as string,
      [sub.paddle_subscription_id as string],
    );

    const overview = session.urls?.general?.overview;
    if (!overview) throw new Error("Failed to create portal session");
    return { url: overview };
  });

/**
 * Reads the calling user's most recent subscription (any env) so the UI can
 * show renewal/cancel info. Returns null when the user has no subscriptions.
 */
export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: PaddleEnv }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select(
        "status,price_id,current_period_end,cancel_at_period_end,environment",
      )
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return sub ?? null;
  });
