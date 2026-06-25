CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule (id may differ across environments)
DO $$
BEGIN
  PERFORM cron.unschedule('payments-reconcile-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'payments-reconcile-hourly',
  '17 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nihongolevel.lovable.app/api/public/payments/reconcile',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndmNocXdnd3dlZmt1ZmlkcmZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NzQ1ODgsImV4cCI6MjA5NjU1MDU4OH0.W2wOgQ1bjRDVkX8I2t7IpTxGKip0DY193w6BCcul7bw'
    ),
    body := '{}'::jsonb
  );
  $$
);