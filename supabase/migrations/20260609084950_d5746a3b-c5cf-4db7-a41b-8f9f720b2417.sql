-- Drop the old version that accepted an arbitrary user_uuid (privacy bypass)
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid, text);

-- Recreate scoped to the calling user only
CREATE OR REPLACE FUNCTION public.has_active_subscription(check_env text DEFAULT 'live')
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = auth.uid()
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_subscription(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(text) TO authenticated;