
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN NOT NULL DEFAULT false,
  pro_activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "update own profile basic" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Prevent users from flipping is_pro themselves via direct UPDATE
CREATE OR REPLACE FUNCTION public.prevent_pro_self_edit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.is_pro IS DISTINCT FROM OLD.is_pro OR NEW.pro_activated_at IS DISTINCT FROM OLD.pro_activated_at THEN
    -- Only allow if no auth user context (i.e. service role / definer-fn path)
    IF auth.uid() IS NOT NULL AND current_setting('role', true) = 'authenticated' THEN
      RAISE EXCEPTION 'Cannot directly modify Pro status';
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_guard_pro
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_pro_self_edit();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- nihongo_data
CREATE TABLE public.nihongo_data (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('history','favorite','review','challenge')),
  item_id BIGINT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nihongo_data TO authenticated;
GRANT ALL ON public.nihongo_data TO service_role;
ALTER TABLE public.nihongo_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own nihongo_data" ON public.nihongo_data
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX nihongo_data_user_kind ON public.nihongo_data(user_id, kind);

-- Pro activation function
CREATE OR REPLACE FUNCTION public.activate_pro(_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  IF _code = 'NIHONGOPRO2026' THEN
    UPDATE public.profiles
      SET is_pro = true, pro_activated_at = COALESCE(pro_activated_at, now())
      WHERE id = auth.uid();
    RETURN true;
  END IF;
  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.activate_pro(TEXT) TO authenticated;
