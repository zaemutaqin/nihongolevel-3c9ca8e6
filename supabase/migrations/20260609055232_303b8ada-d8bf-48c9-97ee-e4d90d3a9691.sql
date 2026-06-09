CREATE TABLE public.guest_rate_limits (
  ip text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ip, day)
);
GRANT ALL ON public.guest_rate_limits TO service_role;
ALTER TABLE public.guest_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server) may touch this table.

-- Drop the old hardcoded-code activator; activation now happens via the
-- /api/activate-pro server route using the PRO_ACCESS_CODE secret + service role.
DROP FUNCTION IF EXISTS public.activate_pro(text);