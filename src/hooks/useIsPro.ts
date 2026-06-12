import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";

/**
 * Returns true if the current user has Pro access — either:
 *  - profile.is_pro (admin-granted via PRO_ACCESS_CODE), or
 *  - an active Paddle subscription in the current Paddle environment.
 */
export function useIsPro() {
  const { user, profile } = useAuth();
  const env = getPaddleEnvironment();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id, env],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", user!.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const subActive = !!subscription && (() => {
    const end = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
    if (["active", "trialing", "past_due"].includes(subscription.status)) {
      return !end || end > new Date();
    }
    if (subscription.status === "canceled" && end && end > new Date()) return true;
    return false;
  })();

  return {
    isPro: !!profile?.is_pro || subActive,
    source: profile?.is_pro ? ("code" as const) : subActive ? ("subscription" as const) : null,
    loading: !!user && subscription === undefined && !profile?.is_pro,
  };
}
