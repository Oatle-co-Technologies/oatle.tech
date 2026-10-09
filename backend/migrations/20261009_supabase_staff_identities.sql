-- Apply only to Supabase. Existing Neon identity IDs remain unchanged.
BEGIN;
CREATE TABLE IF NOT EXISTS public.staff_supabase_identities (
    staff_id integer PRIMARY KEY REFERENCES public.staff(id) ON DELETE CASCADE,
    auth_user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_supabase_identities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_supabase_identities FROM anon, authenticated;
COMMIT;
