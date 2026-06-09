CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  ts timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address text,
  input_length integer,
  success boolean NOT NULL DEFAULT false,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT audit_logs_input_length_chk CHECK (input_length IS NULL OR (input_length >= 0 AND input_length <= 500)),
  CONSTRAINT audit_logs_event_type_chk CHECK (event_type IN (
    'translate_success',
    'translate_fail',
    'translate_rate_limited',
    'translate_anomaly',
    'translate_personal_data_redacted',
    'translate_inappropriate',
    'translate_invalid_input',
    'activate_pro_success',
    'activate_pro_invalid',
    'activate_pro_rate_limited',
    'auth_failure'
  ))
);

GRANT ALL ON public.audit_logs TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.audit_logs_id_seq TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- No policies: only service_role (server) may touch this table.

CREATE INDEX audit_logs_user_ts_idx ON public.audit_logs (user_id, ts DESC) WHERE user_id IS NOT NULL;
CREATE INDEX audit_logs_ip_ts_idx ON public.audit_logs (ip_address, ts DESC) WHERE ip_address IS NOT NULL;
CREATE INDEX audit_logs_event_ts_idx ON public.audit_logs (event_type, ts DESC);