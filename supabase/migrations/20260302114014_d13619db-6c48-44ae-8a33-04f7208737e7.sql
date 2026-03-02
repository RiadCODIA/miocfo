-- Schedule auto-categorize every 4 hours using pg_cron + pg_net
SELECT cron.schedule(
  'auto-categorize-transactions',
  '0 */4 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://yzhonmuhywdiqaxxbnsj.supabase.co/functions/v1/auto-categorize',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6aG9ubXVoeXdkaXFheHhibnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzEzMTMsImV4cCI6MjA4NTk0NzMxM30.7oaiC1P4pwNdj8mIv4rU5Jsdm2jgkxKwz85PzUxWcvY"}'::jsonb,
      body := '{"time": "scheduled"}'::jsonb
    ) AS request_id;
  $$
);
