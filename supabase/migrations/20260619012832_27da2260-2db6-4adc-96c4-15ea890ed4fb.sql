
-- ============ MASTER CURRICULUM TABLES ============
CREATE TABLE public.levels (
  id text PRIMARY KEY,
  order_index int NOT NULL DEFAULT 0,
  name text NOT NULL,
  unlock_threshold_pct int NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.levels TO anon, authenticated;
GRANT ALL ON public.levels TO service_role;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels are readable by everyone" ON public.levels FOR SELECT USING (true);

CREATE TABLE public.units (
  id text PRIMARY KEY,
  level_id text NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.units TO anon, authenticated;
GRANT ALL ON public.units TO service_role;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Units are readable by everyone" ON public.units FOR SELECT USING (true);
CREATE INDEX units_level_id_idx ON public.units(level_id);

CREATE TABLE public.sessions (
  id text PRIMARY KEY,
  unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  order_index int NOT NULL DEFAULT 0,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sessions are readable by everyone" ON public.sessions FOR SELECT USING (true);
CREATE INDEX sessions_unit_id_idx ON public.sessions(unit_id);

CREATE TABLE public.learning_items (
  id text PRIMARY KEY,
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  content_jp text NOT NULL,
  content_romaji text,
  content_meaning text,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_items TO anon, authenticated;
GRANT ALL ON public.learning_items TO service_role;
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Learning items are readable by everyone" ON public.learning_items FOR SELECT USING (true);
CREATE INDEX learning_items_session_id_idx ON public.learning_items(session_id);

-- ============ USER PROGRESS TABLES ============
CREATE TABLE public.item_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL REFERENCES public.learning_items(id) ON DELETE CASCADE,
  correct_streak int NOT NULL DEFAULT 0,
  ease_factor double precision NOT NULL DEFAULT 2.5,
  next_review_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_progress TO authenticated;
GRANT ALL ON public.item_progress TO service_role;
ALTER TABLE public.item_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own item_progress" ON public.item_progress FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX item_progress_user_review_idx ON public.item_progress(user_id, next_review_at);

CREATE TABLE public.session_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  score_pct int NOT NULL,
  duration_sec int NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_attempts TO authenticated;
GRANT ALL ON public.session_attempts TO service_role;
ALTER TABLE public.session_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own session_attempts" ON public.session_attempts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX session_attempts_user_idx ON public.session_attempts(user_id, session_id);

CREATE TABLE public.unit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id text NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  best_score_pct int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.unit_completions TO authenticated;
GRANT ALL ON public.unit_completions TO service_role;
ALTER TABLE public.unit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own unit_completions" ON public.unit_completions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PROFILES: onboarding columns ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_location text,
  ADD COLUMN IF NOT EXISTS onboarding_level text,
  ADD COLUMN IF NOT EXISTS current_level_id text REFERENCES public.levels(id);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_levels_updated BEFORE UPDATE ON public.levels FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_learning_items_updated BEFORE UPDATE ON public.learning_items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_item_progress_updated BEFORE UPDATE ON public.item_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_unit_completions_updated BEFORE UPDATE ON public.unit_completions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ Seed initial levels ============
INSERT INTO public.levels (id, order_index, name, unlock_threshold_pct) VALUES
  ('level-0', 0, 'Fondasi Mutlak', 80),
  ('level-1', 1, 'Kehidupan Sehari-hari', 80),
  ('level-2', 2, 'Bahasa Tempat Kerja', 80)
ON CONFLICT (id) DO NOTHING;
