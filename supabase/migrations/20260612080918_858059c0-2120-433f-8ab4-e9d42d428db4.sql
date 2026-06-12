CREATE TABLE public.interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scenario_id text NOT NULL,
  scenario_title text NOT NULL,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  grammar_score integer,
  naturalness_score integer,
  confidence_score integer,
  vocabulary_level text,
  suggestions jsonb DEFAULT '[]'::jsonb,
  summary text,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_sessions TO authenticated;
GRANT ALL ON public.interview_sessions TO service_role;

ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own interview sessions"
  ON public.interview_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX interview_sessions_user_created_idx
  ON public.interview_sessions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_interview_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER interview_sessions_touch_updated_at
BEFORE UPDATE ON public.interview_sessions
FOR EACH ROW EXECUTE FUNCTION public.touch_interview_sessions_updated_at();