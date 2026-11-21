BEGIN;
SELECT pg_advisory_xact_lock(2026110201);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_email_sent_at timestamp without time zone;
UPDATE public.invoices
SET invoice_email_sent_at = COALESCE(created_at, CURRENT_TIMESTAMP)
WHERE invoice_email_sent_at IS NULL
  AND status <> 'draft';
COMMIT;
