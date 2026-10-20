"""Published October 2026 prices; source: Oatle branded pricing guide, pages 1–4."""
PRODUCTS = [
    dict(name="Marketing Page", base_price=3000, pricing_type="starting", description="From R3,000. One mobile-friendly page, basic search visibility and brand styling."),
    dict(name="Website Redesign", base_price=6000, pricing_type="starting", description="From R6,000. Up to five existing pages: layout, navigation, mobile presentation and search improvements."),
    dict(name="Starter Business Website", base_price=8500, pricing_type="starting", description="From R8,500. Up to five pages, custom design, contact forms, domain and email setup."),
    dict(name="Professional Business Website", base_price=15000, pricing_type="starting", description="From R15,000. Up to ten pages, bespoke design, business tools and launch setup."),
    dict(name="Custom Technology Solutions", base_price=None, pricing_type="quoted", description="Custom applications, portals and integrations are scoped and quoted individually."),
]

# Tuple fields: name, price, description. These remain available on project invoices.
ADDON_ROWS = [
    ("Additional Website Page", 750, "One additional website page."),
    ("Contact / Enquiry Form", 500, "One contact or enquiry form."),
    ("WhatsApp Integration", 350, "Website WhatsApp integration."),
    ("Professional Email Setup", 350, "Professional email setup; third-party email costs are excluded."),
    ("Domain Connection", 300, "Domain connection; domain registration and renewal costs are excluded."),
    ("Hosting / Deployment Setup", 350, "Hosting/deployment setup; third-party hosting costs are excluded."),
    ("Basic SEO Setup", 750, "Basic website SEO setup."),
    ("Google Business Profile Setup", 500, "Google Business Profile setup."),
    ("Website Maintenance", 500, "From R500 per month. Ongoing website maintenance."),
]
ADDONS = [dict(name=n, price=p, description=d) for n, p, d in ADDON_ROWS]
DESIGN_NOTE = " Includes two revision rounds; further changes are quoted separately."
SEO_NOTE = " Covers up to five existing pages unless agreed otherwise; larger sites may cost more."
SERVICE_ROWS = [
    ("Template-based Invitation", 200, "Personalise an existing invitation layout for an event." + DESIGN_NOTE),
    ("Custom Static Invitation", 300, "An original, made-to-order digital invitation." + DESIGN_NOTE),
    ("Animated Digital Invitation", 350, "An invitation with animation for digital sharing." + DESIGN_NOTE),
    ("Custom Promotional Flyer", 250, "A branded business, service, product or event flyer. Digital and print-ready files; printing costs excluded." + DESIGN_NOTE),
    ("Social Media Graphic", 200, "A custom promotional visual for social platforms." + DESIGN_NOTE),
    ("Poster Design", 400, "A bespoke poster with digital and print-ready files; printing costs excluded." + DESIGN_NOTE),
    ("Announcement Graphic", 200, "A custom announcement for digital sharing." + DESIGN_NOTE),
    ("Single-screen UI Design", 500, "One website or application screen." + DESIGN_NOTE),
    ("Multi-screen UI Design", 1000, "Up to three designed screens; additional screens quoted separately." + DESIGN_NOTE),
    ("Interactive Prototype", 1200, "A clickable prototype; development not included." + DESIGN_NOTE),
    ("UX Wireframes & User Flows", 600, "Planning page structures and user journeys." + DESIGN_NOTE),
    ("Website Audit & Consultation", 750, "Combined website review and consultation." + SEO_NOTE),
    ("Existing Website SEO", 1200, "Initial setup and correction of existing SEO." + SEO_NOTE),
    ("SEO Audit", 750, "Written findings report; no implementation." + SEO_NOTE),
    ("SEO Optimisation", 1500, "On-page and basic technical SEO fixes." + SEO_NOTE),
    ("Ongoing SEO", 1000, "Monitoring, small improvements and a monthly report. R1,000 per month." + SEO_NOTE),
]
SERVICES = [dict(name=n, base_price=p, description=d, pricing_type="fixed", billing_period="month" if n == "Ongoing SEO" else None) for n,p,d in SERVICE_ROWS]
# Add-ons may also be billed as standalone work without a website project.
SERVICES += [dict(name=n, base_price=p, description=d, pricing_type="starting" if n == "Website Maintenance" else "fixed", billing_period="month" if n == "Website Maintenance" else None) for n,p,d in ADDON_ROWS]
ALIASES = {"SEO Optimisation": "SEO Optimization"}
