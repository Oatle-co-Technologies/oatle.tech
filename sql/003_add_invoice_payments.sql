ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS amount_paid double precision NOT NULL DEFAULT 0;

UPDATE public.invoices
SET amount_paid = amount
WHERE status = 'paid' AND amount_paid = 0;

CREATE TABLE IF NOT EXISTS public.invoice_payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL CHECK (amount > 0),
    paid_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_invoice_payments_invoice_id
ON public.invoice_payments (invoice_id);

-- Convert the previous cumulative value into one opening ledger entry.
-- NOT EXISTS makes this safe to run again without duplicating payments.
INSERT INTO public.invoice_payments (invoice_id, amount, paid_at)
SELECT invoices.id, invoices.amount_paid,
       COALESCE(invoices.paid_at, invoices.created_at, CURRENT_TIMESTAMP)
FROM public.invoices
WHERE invoices.amount_paid > 0
  AND NOT EXISTS (
      SELECT 1
      FROM public.invoice_payments
      WHERE invoice_payments.invoice_id = invoices.id
  );
