BEGIN;
CREATE TABLE IF NOT EXISTS public.campaign_days (
    id serial PRIMARY KEY,
    focus_date date NOT NULL UNIQUE,
    industry varchar(200) NOT NULL,
    campaign_name varchar(200) NOT NULL,
    description text,
    created_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS campaign_day_id integer REFERENCES public.campaign_days(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by integer REFERENCES public.staff(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT (now() AT TIME ZONE 'UTC');
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS setup_key varchar(160);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_setup_key_idx ON public.tasks(setup_key);
CREATE INDEX IF NOT EXISTS tasks_campaign_day_idx ON public.tasks(campaign_day_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_due_idx ON public.tasks(assigned_to, due_date);
CREATE INDEX IF NOT EXISTS campaign_days_focus_date_idx ON public.campaign_days(focus_date);
ALTER TABLE public.campaign_days ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_days FROM anon, authenticated;
COMMIT;
