from sqlalchemy.orm import Session

from backend.database.connection import SessionLocal
from backend.models.pricing import AddOn, Product, Service


products = [
    {
        "name": "Marketing Page",
        "description": (
            "A professional single-page website designed to introduce "
            "a business, showcase what it offers, and provide a clear "
            "way for potential customers to get in touch."
        ),
        "base_price": 3000,
        "pricing_type": "fixed",
    },
    {
        "name": "Website Redesign",
        "description": (
            "A fresh, modern and professional redesign for an existing "
            "website, with improved layout, navigation, presentation, "
            "mobile experience, colours, fonts and visual style."
        ),
        "base_price": 6000,
        "pricing_type": "fixed",
    },
    {
        "name": "Starter Business Website",
        "description": (
            "A complete professional website for businesses ready to "
            "build their online presence."
        ),
        "base_price": 8500,
        "pricing_type": "fixed",
    },
    {
        "name": "Professional Business Website",
        "description": (
            "A highly customized and professional online presence "
            "for established businesses."
        ),
        "base_price": 15000,
        "pricing_type": "fixed",
    },
    {
        "name": "Custom Technology Solutions",
        "description": (
            "Technology built around the specific way a business works, "
            "including custom applications, management systems, portals, "
            "ordering and booking systems, automation and integrations."
        ),
        "base_price": None,
        "pricing_type": "quoted",
    },
]


addons = [
    {
        "name": "Additional Website Page",
        "description": "An additional website page beyond the package allowance.",
        "price": 750,
    },
    {
        "name": "Contact / Enquiry Form",
        "description": "Additional contact or enquiry form functionality.",
        "price": 500,
    },
    {
        "name": "WhatsApp Integration",
        "description": "WhatsApp integration for the website.",
        "price": 350,
    },
    {
        "name": "Professional Email Setup",
        "description": "Professional business email setup.",
        "price": 350,
    },
    {
        "name": "Domain Connection",
        "description": "Domain connection and configuration.",
        "price": 300,
    },
    {
        "name": "Hosting / Deployment Setup",
        "description": "Hosting and deployment configuration.",
        "price": 350,
    },
    {
        "name": "Basic SEO Setup",
        "description": "Basic search engine optimization setup.",
        "price": 750,
    },
    {
        "name": "Google Business Profile Setup",
        "description": "Google Business Profile setup.",
        "price": 300,
    },
    {
        "name": "Website Maintenance",
        "description": "Ongoing website maintenance.",
        "price": 500,
    },
    {
        "name": "Custom Functionality",
        "description": "Additional functionality outside the selected package.",
        "price": 0,
    },
]


services = [
    {
        "name": "Code Review",
        "description": "Standalone code review and technical assessment.",
    },
    {
        "name": "SEO Optimization",
        "description": "Standalone SEO optimization work.",
    },
    {
        "name": "Technical Consultation",
        "description": "Standalone technical consultation and advice.",
    },
]


def seed_pricing():
    db: Session = SessionLocal()

    try:
        # -------------------------
        # Products
        # -------------------------

        for product_data in products:
            existing_product = (
                db.query(Product)
                .filter(
                    Product.name == product_data["name"]
                )
                .first()
            )

            if not existing_product:
                db.add(Product(**product_data))

        # -------------------------
        # Add-ons
        # -------------------------

        for addon_data in addons:
            existing_addon = (
                db.query(AddOn)
                .filter(
                    AddOn.name == addon_data["name"]
                )
                .first()
            )

            if not existing_addon:
                db.add(AddOn(**addon_data))

        # -------------------------
        # Services
        # -------------------------

        for service_data in services:
            existing_service = (
                db.query(Service)
                .filter(
                    Service.name == service_data["name"]
                )
                .first()
            )

            if not existing_service:
                db.add(Service(**service_data))

        db.commit()

        print("Pricing data seeded successfully.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed_pricing()