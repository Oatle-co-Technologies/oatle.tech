-- NULL preserves existing percentage discounts. A value represents an exact rand discount.
BEGIN;
SELECT pg_advisory_xact_lock(2026102002);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_fixed numeric(12, 2);
COMMIT;
