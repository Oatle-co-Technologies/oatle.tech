CREATE TABLE IF NOT EXISTS public.staff_push_subscriptions (
    endpoint_hash text PRIMARY KEY,
    staff_id integer NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_push_subscriptions_staff_idx ON public.staff_push_subscriptions(staff_id);
ALTER TABLE public.staff_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_push_subscriptions FROM anon, authenticated;
