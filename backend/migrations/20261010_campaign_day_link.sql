BEGIN;
ALTER TABLE public.campaign_days ADD COLUMN IF NOT EXISTS resource_url varchar(2048);
COMMIT;
