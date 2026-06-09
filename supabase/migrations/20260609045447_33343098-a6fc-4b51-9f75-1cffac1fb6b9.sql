
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_pro_self_edit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_pro(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_pro(TEXT) TO authenticated;
