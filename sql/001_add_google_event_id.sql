ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS google_event_id varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS appointments_google_event_id_key
ON public.appointments (google_event_id)
WHERE google_event_id IS NOT NULL;