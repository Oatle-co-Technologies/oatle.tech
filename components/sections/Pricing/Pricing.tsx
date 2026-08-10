import FadeIn from "@/components/ui/FadeIn";

export default function Pricing() {
  return (
    <FadeIn>
      <section id="pricing" className="pricing">
        <div className="container">
          <span className="section-tag">PRICING</span>

          <h2>Start small. Grow when you&apos;re ready.</h2>

          <p className="section-description">
            You don&apos;t need everything on day one. Start with what your
            business needs today, then add more as your business grows.
          </p>

          <div className="pricing-grid">
            {/* Marketing Page */}
            <article className="pricing-card">
              <h3>Marketing Page</h3>

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

              <button className="primary-button pricing-card-button">
                Get Started
              </button>
            </article>

            {/* Website Redesign */}
            <article className="pricing-card">
              <h3>Website Redesign</h3>

              <p className="pricing-card-description">
                Give your existing website a fresh, modern and professional
                look.
              </p>

              <div className="pricing-card-price">
                <span>From</span>
                <strong>R6,000</strong>
              </div>

              <p className="pricing-card-pages">
                Up to 5 existing pages
              </p>

              <ul className="pricing-card-features">
                <li>
                  <span className="feature-check">✓</span>
                  Fresh, modern website design
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Improved layout &amp; navigation
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Better presentation of your products or services
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Mobile-friendly design &amp; search improvements
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Ready to launch
                </li>
              </ul>

              <button className="primary-button pricing-card-button">
                Redesign My Website
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

              <p className="pricing-card-pages">
                Up to 5 pages
              </p>

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

              <button className="primary-button pricing-card-button">
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

              <p className="pricing-card-pages">
                Up to 10 pages
              </p>

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

              <button className="primary-button pricing-card-button">
                Build My Website
              </button>
            </article>

            {/* Custom Technology Solutions */}
            <article className="pricing-card">
              <h3>Custom Technology Solutions</h3>

              <p className="pricing-card-description">
                Technology built around the way your business works.
              </p>

              <div className="pricing-card-price">
                <strong>Let&apos;s Talk</strong>
              </div>

              <p className="pricing-card-pages">
                Custom project
              </p>

              <ul className="pricing-card-features">
                <li>
                  <span className="feature-check">✓</span>
                  Custom web applications
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Business management &amp; customer portals
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Online ordering &amp; booking systems
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Business automation &amp; integrations
                </li>
                <li>
                  <span className="feature-check">✓</span>
                  Custom design &amp; ongoing technology support
                </li>
              </ul>

              <button className="primary-button pricing-card-button">
                Let&apos;s Talk
              </button>
            </article>

            {/* Build as You Grow */}
            <article className="pricing-card">
              <span className="section-tag">BUILD AS YOU GROW</span>

              <h3>You don&apos;t have to buy everything upfront.</h3>

              <p>
                Start with what your business needs today and add services,
                pages and functionality as your business grows.
              </p>

              <p className="pricing-growth-question">
                Want to see all available services and add-on pricing?
              </p>

              <a
                href="/pricing-guide.pdf"
                className="primary-button pricing-growth-button"
                download
              >
                Download Full Pricing Guide
              </a>
            </article>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}