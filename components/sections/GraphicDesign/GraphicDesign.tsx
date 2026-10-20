
import FadeIn from "@/components/ui/FadeIn";

export default function GraphicDesign() {
  return (
    <FadeIn>
      <section id="graphic-design" className="why-oatle">
        <div className="container">
          <span className="section-tag">DESIGN</span>
          <h2>Designs for digital experiences and special occasions.</h2>

          <p className="section-description">
            From intuitive interfaces to cards, invitations, and promotional visuals,
            we create custom designs around your users, message, and style.
          </p>

          <div className="why-grid">
            <article className="why-card">
              <h3>Interface Design</h3>
              <p>
                Layouts, user flows, and interactive prototypes for websites and
                applications, with a focus on clarity and ease of use.
              </p>
            </article>

            <article className="why-card">
              <h3>Cards &amp; Invitations</h3>
              <p>
                Custom cards and invitations for birthdays, weddings, and other
                celebrations, including animated digital invitations.
              </p>
            </article>

            <article className="why-card">
              <h3>Posters &amp; Promotional Design</h3>
              <p>
                Flyers, posters, social media visuals, and announcements prepared
                for digital sharing or print as agreed in your brief.
              </p>
            </article>
          </div>

          <div className="approach-card">
            <h3>Explore our design services and prices.</h3>
            <p>
              Find prices for invitations, promotional designs, and interface
              design in our full pricing guide. For something more personalised,
              contact us to discuss your requirements.
            </p>

            <a
              href="/pricing-guide.pdf"
              className="primary-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Design Prices (PDF)
            </a>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
