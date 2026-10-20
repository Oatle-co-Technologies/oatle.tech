
"use client";

import { useRouter } from "next/navigation";

export default function Pricing() {
  const router = useRouter();

  return (
    <section id="pricing" className="pricing">
      <div className="container">
        <span className="section-tag">PRICING</span>

        <h2>Start small. Grow when you&apos;re ready.</h2>

        <p className="section-description">
          You don&apos;t need everything on day one. Start with what your
          business needs today, then add more as your business grows.
        </p>

        <div className="pricing-grid">
          {/* Marketing Website */}
          <article className="pricing-card">
            <h3>Marketing Website</h3>

            <p className="pricing-card-description">
              A professional single-page website designed to introduce your
              business, showcase what you offer, and give potential customers
              a clear way to get in touch.
            </p>

            <div className="pricing-card-price">
              <span>From</span>
              <strong>R3,000</strong>
            </div>

            <p className="pricing-card-pages">1 page</p>

            <ul className="pricing-card-features">
              <li>
                <span className="feature-check">✓</span>
                Professional one-page website
              </li>
              <li>
                <span className="feature-check">✓</span>
                Business, services &amp; contact information
              </li>
              <li>
                <span className="feature-check">✓</span>
                Mobile-friendly design
              </li>
              <li>
                <span className="feature-check">✓</span>
                Basic search visibility &amp; brand styling
              </li>
              <li>
                <span className="feature-check">✓</span>
                Ready to launch
              </li>
            </ul>

            <p className="pricing-card-note">
              Domain, hosting, professional email, advanced functionality,
              additional pages and extensive branding are not included.
            </p>

            <button
              className="primary-button pricing-card-button"
              onClick={() => router.push("/contact")}
            >
              Get Started
            </button>
          </article>

          {/* Starter Business Website */}
          <article className="pricing-card">
            <h3>Starter Business Website</h3>

            <p className="pricing-card-description">
              A complete, professional website for businesses that are ready
              to build their online presence.
            </p>

            <div className="pricing-card-price">
              <span>From</span>
              <strong>R8,500</strong>
            </div>

            <p className="pricing-card-pages">Up to 5 pages</p>

            <ul className="pricing-card-features">
              <li>
                <span className="feature-check">✓</span>
                Up to 5 professionally designed pages
              </li>
              <li>
                <span className="feature-check">✓</span>
                Home, About, Services &amp; Contact pages
              </li>
              <li>
                <span className="feature-check">✓</span>
                One additional page
              </li>
              <li>
                <span className="feature-check">✓</span>
                Custom design, brand styling &amp; contact forms
              </li>
              <li>
                <span className="feature-check">✓</span>
                Mobile, search, domain &amp; email setup
              </li>
            </ul>

            <p className="pricing-card-note">
              Third-party domain, hosting and email costs are not included.
            </p>

            <button
              className="primary-button pricing-card-button"
              onClick={() => router.push("/contact")}
            >
              Build My Website
            </button>
          </article>

          {/* Professional Business Website */}
          <article className="pricing-card">
            <h3>Professional Business Website</h3>

            <p className="pricing-card-description">
              For established businesses that need a highly customized and
              professional online presence.
            </p>

            <div className="pricing-card-price">
              <span>From</span>
              <strong>R15,000</strong>
            </div>

            <p className="pricing-card-pages">Up to 10 pages</p>

            <ul className="pricing-card-features">
              <li>
                <span className="feature-check">✓</span>
                Up to 10 custom-designed pages
              </li>
              <li>
                <span className="feature-check">✓</span>
                Bespoke design &amp; branding guidance
              </li>
              <li>
                <span className="feature-check">✓</span>
                Customer-focused layouts &amp; content presentation
              </li>
              <li>
                <span className="feature-check">✓</span>
                Advanced business features &amp; integrations
              </li>
              <li>
                <span className="feature-check">✓</span>
                Domain, email &amp; launch setup
              </li>
            </ul>

            <p className="pricing-card-note">
              Third-party domain, hosting and email costs are not included.
            </p>

            <button
              className="primary-button pricing-card-button"
              onClick={() => router.push("/contact")}
            >
              Build My Website
            </button>
          </article>
        </div>

        {/* Full Pricing Guide */}
        <div className="pricing-growth" style={{ marginTop: "2rem" }}>
          <span className="section-tag">BUILD AS YOU GROW</span>

          <h3>You don&apos;t have to buy everything upfront.</h3>

          <p>
            Start with what your business needs today and add services,
            pages and functionality as your business grows.
          </p>

          <p className="pricing-growth-question">
            Looking for website redesigns, design services, SEO or add-ons?
            View all services and prices in our full pricing guide.
          </p>

          <a
            href="/pricing-guide.pdf"
            className="primary-button pricing-growth-button"
            download
          >
            Download Full Pricing Guide (PDF)
          </a>
        </div>
      </div>
    </section>
  );
}
