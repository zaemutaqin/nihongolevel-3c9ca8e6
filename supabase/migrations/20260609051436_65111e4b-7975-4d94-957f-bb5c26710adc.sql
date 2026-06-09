
-- Trigger functions should not be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_pro_self_edit() FROM PUBLIC, anon, authenticated;

-- Pro code redemption: only signed-in users may call; remove PUBLIC/anon
REVOKE ALL ON FUNCTION public.activate_pro(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_pro(text) TO authenticated;
