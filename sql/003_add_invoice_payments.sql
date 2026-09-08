ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS amount_paid double precision NOT NULL DEFAULT 0;

UPDATE public.invoices
SET amount_paid = amount
WHERE status = 'paid' AND amount_paid = 0;