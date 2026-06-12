
-- 1. Add explicit deny-all policies / explicit no-access for audit_logs (writes via service_role only, which bypasses RLS)
REVOKE ALL ON public.audit_logs FROM anon, authenticated;
REVOKE ALL ON public.guest_rate_limits FROM anon, authenticated;

-- 2. Add INSERT policy for profiles so users can create their own profile if trigger misses
CREATE POLICY "insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 3. Lock down trigger-only SECURITY DEFINER functions from being executed by authenticated users
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_pro_self_edit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_interview_sessions_updated_at() FROM PUBLIC, anon, authenticated;
