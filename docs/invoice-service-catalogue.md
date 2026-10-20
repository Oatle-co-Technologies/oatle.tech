# October 2026 invoice service catalogue

Source: `Oatle_Technologies_Branded_Pricing_Guide_Oct_2026.pdf`, supplied 20 October 2026, pages 1–4.

## Result

The invoice form supports either a development project/package or a standalone service. A standalone service requires a client, but no website project. Existing invoice totals, payment records, catalogue IDs and inactive flags are preserved. Editing an invoice cannot change its billing target or recalculate its saved total in the UI.

The catalogue contains the five development offerings (four starting prices and one quoted offering), nine project add-ons, and 25 individually billable services: seven invitation/promotional designs, four interface services, five audit/SEO services, and the nine add-ons also offered independently. Google Business Profile Setup is R500. Ongoing SEO is R1,000 per month; Website Maintenance starts at R500 per month. Each monthly service invoice covers one month; this change does not introduce subscriptions or scheduled charges.

Catalogue scope notes include two design revision rounds, up to three UI screens, SEO scope of up to five pages, printing exclusions and separately quoted custom work. Legacy services not priced in the PDF remain available for individual quotes; their prices are not invented. The legacy `SEO Optimization` row is renamed in place if there is no existing `SEO Optimisation` row, preserving references to its ID.

Project add-on calculations use `price_at_selection`, including when the public catalogue later changes. The project add-on API returns that agreed price, so the form, email and server calculation agree. New invoice/service mutations retain the existing admin dependency; the service creation endpoint now uses it too because it can write financial prices.

## Deployment order

1. Read the current production catalogue and schema through the Oatle Tech project's database connection. Retain a private catalogue backup and aggregate checks for existing invoice totals/payments; never commit credentials or client data.
2. Review and apply `sql/004_standalone_service_invoices.sql` to that database. It runs in one transaction with an advisory lock. It adds nullable `invoices.service_id` and the service price/type/period fields, then upserts only the PDF catalogue. It does not update invoice or payment rows. Reapplying it does not duplicate catalogue rows.
3. Verify catalogue names/prices/periods, existing IDs and unchanged invoice/payment aggregates.
4. Deploy the code to the existing **oatle-tech** Vercel project, repository `Oatle-co-Technologies/oatle.tech`. The schema migration must run **before** the new code: old code tolerates the additive fields, while new code expects them.
5. Check the authenticated invoice form: select Standalone service, verify Custom Static Invitation R300, Animated Digital Invitation R350, Website Audit & Consultation R750 and the monthly labels. Check existing project invoices. Do not send test emails or create test financial records in production.

`python -m backend.database.seed_pricing` can subsequently synchronise the same catalogue via SQLAlchemy. Apply the schema migration first. Neither route deletes unlisted legacy catalogue rows or rewrites existing invoices.

## Validation

- Production Next.js build and TypeScript check pass.
- Ten invoice integration/payment tests pass against an isolated in-memory database, including invoice creation for each of the 25 published services, discounts, partial-payment history, inactive legacy services, quote validation, existing project/add-on invoices, price snapshots and admin protection.
- PostgreSQL's parser validates the migration syntax. A local PostgreSQL server could not start in the sandbox because shared-memory allocation is unavailable; the migration has not yet been executed against PostgreSQL.
- Invoice component lint has the same two existing `set-state-in-effect` errors and two hook-dependency warnings as the main-branch baseline. No new lint errors were introduced.
- No production database credentials were retrieved and no live database or deployment changes have been made. Automatic approval review rejected the initial broad request for decrypted production settings. Live application requires explicit permission to retrieve **only** this project's `DATABASE_URL`, apply the reviewed migration and deploy.
