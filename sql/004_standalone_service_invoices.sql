-- Source: Oatle_Technologies_Branded_Pricing_Guide_Oct_2026.pdf, pages 1–4.
-- Additive and repeatable. Existing invoice totals/payments and catalogue IDs are preserved.
BEGIN;
SELECT pg_advisory_xact_lock(2026102001);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS base_price double precision;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS pricing_type varchar(50) NOT NULL DEFAULT 'quoted';
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS billing_period varchar(20);
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS service_id integer REFERENCES public.services(id);
CREATE INDEX IF NOT EXISTS ix_invoices_service_id ON public.invoices(service_id);
-- Preserve task references to the existing spelling by retaining its row ID.
UPDATE public.services SET name = 'SEO Optimisation'
WHERE name = 'SEO Optimization'
  AND NOT EXISTS (SELECT 1 FROM public.services WHERE name = 'SEO Optimisation');

INSERT INTO public.products (name, base_price, pricing_type, description, active) VALUES
('Marketing Page', 3000, 'starting', 'From R3,000. One mobile-friendly page, basic search visibility and brand styling.', TRUE),
('Website Redesign', 6000, 'starting', 'From R6,000. Up to five existing pages: layout, navigation, mobile presentation and search improvements.', TRUE),
('Starter Business Website', 8500, 'starting', 'From R8,500. Up to five pages, custom design, contact forms, domain and email setup.', TRUE),
('Professional Business Website', 15000, 'starting', 'From R15,000. Up to ten pages, bespoke design, business tools and launch setup.', TRUE),
('Custom Technology Solutions', NULL, 'quoted', 'Custom applications, portals and integrations are scoped and quoted individually.', TRUE)
ON CONFLICT (name) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    pricing_type = EXCLUDED.pricing_type,
    description = EXCLUDED.description;

INSERT INTO public.addons (name, price, description, active) VALUES
('Additional Website Page', 750, 'One additional website page.', TRUE),
('Contact / Enquiry Form', 500, 'One contact or enquiry form.', TRUE),
('WhatsApp Integration', 350, 'Website WhatsApp integration.', TRUE),
('Professional Email Setup', 350, 'Professional email setup; third-party email costs are excluded.', TRUE),
('Domain Connection', 300, 'Domain connection; domain registration and renewal costs are excluded.', TRUE),
('Hosting / Deployment Setup', 350, 'Hosting/deployment setup; third-party hosting costs are excluded.', TRUE),
('Basic SEO Setup', 750, 'Basic website SEO setup.', TRUE),
('Google Business Profile Setup', 500, 'Google Business Profile setup.', TRUE),
('Website Maintenance', 500, 'From R500 per month. Ongoing website maintenance.', TRUE)
ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    description = EXCLUDED.description;

INSERT INTO public.services (name, base_price, description, pricing_type, billing_period, active) VALUES
('Template-based Invitation', 200, 'Personalise an existing invitation layout for an event. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Custom Static Invitation', 300, 'An original, made-to-order digital invitation. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Animated Digital Invitation', 350, 'An invitation with animation for digital sharing. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Custom Promotional Flyer', 250, 'A branded business, service, product or event flyer. Digital and print-ready files; printing costs excluded. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Social Media Graphic', 200, 'A custom promotional visual for social platforms. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Poster Design', 400, 'A bespoke poster with digital and print-ready files; printing costs excluded. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Announcement Graphic', 200, 'A custom announcement for digital sharing. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Single-screen UI Design', 500, 'One website or application screen. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Multi-screen UI Design', 1000, 'Up to three designed screens; additional screens quoted separately. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Interactive Prototype', 1200, 'A clickable prototype; development not included. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('UX Wireframes & User Flows', 600, 'Planning page structures and user journeys. Includes two revision rounds; further changes are quoted separately.', 'fixed', NULL, TRUE),
('Website Audit & Consultation', 750, 'Combined website review and consultation. Covers up to five existing pages unless agreed otherwise; larger sites may cost more.', 'fixed', NULL, TRUE),
('Existing Website SEO', 1200, 'Initial setup and correction of existing SEO. Covers up to five existing pages unless agreed otherwise; larger sites may cost more.', 'fixed', NULL, TRUE),
('SEO Audit', 750, 'Written findings report; no implementation. Covers up to five existing pages unless agreed otherwise; larger sites may cost more.', 'fixed', NULL, TRUE),
('SEO Optimisation', 1500, 'On-page and basic technical SEO fixes. Covers up to five existing pages unless agreed otherwise; larger sites may cost more.', 'fixed', NULL, TRUE),
('Ongoing SEO', 1000, 'Monitoring, small improvements and a monthly report. R1,000 per month. Covers up to five existing pages unless agreed otherwise; larger sites may cost more.', 'fixed', 'month', TRUE),
('Additional Website Page', 750, 'One additional website page.', 'fixed', NULL, TRUE),
('Contact / Enquiry Form', 500, 'One contact or enquiry form.', 'fixed', NULL, TRUE),
('WhatsApp Integration', 350, 'Website WhatsApp integration.', 'fixed', NULL, TRUE),
('Professional Email Setup', 350, 'Professional email setup; third-party email costs are excluded.', 'fixed', NULL, TRUE),
('Domain Connection', 300, 'Domain connection; domain registration and renewal costs are excluded.', 'fixed', NULL, TRUE),
('Hosting / Deployment Setup', 350, 'Hosting/deployment setup; third-party hosting costs are excluded.', 'fixed', NULL, TRUE),
('Basic SEO Setup', 750, 'Basic website SEO setup.', 'fixed', NULL, TRUE),
('Google Business Profile Setup', 500, 'Google Business Profile setup.', 'fixed', NULL, TRUE),
('Website Maintenance', 500, 'From R500 per month. Ongoing website maintenance.', 'starting', 'month', TRUE)
ON CONFLICT (name) DO UPDATE SET
    base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    pricing_type = EXCLUDED.pricing_type,
    billing_period = EXCLUDED.billing_period;

COMMIT;
