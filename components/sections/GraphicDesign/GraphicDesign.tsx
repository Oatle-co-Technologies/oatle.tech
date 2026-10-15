import Link from "next/link";
import FadeIn from "@/components/ui/FadeIn";

export default function GraphicDesign() {
  return (
    <FadeIn>
      <section id="graphic-design" className="why-oatle">
        <div className="container">
          <span className="section-tag">GRAPHIC DESIGN</span>
          <h2>Designs for your business and special occasions.</h2>
          <p className="section-description">
            From birthday invitations to your next business promotion, we create
            custom designs around your message, style, and occasion.
          </p>
          <div className="why-grid">
            <article className="why-card">
              <h3>Invitations</h3>
              <p>Custom invitations for birthdays, baby showers, weddings, and
                celebrations. Ask about animated digital invitations, too.</p>
            </article>
            <article className="why-card">
              <h3>Flyers &amp; Posters</h3>
              <p>Designs for business promotions, events, and announcements,
                prepared for digital sharing or print as agreed in your brief.</p>
            </article>
            <article className="why-card">
              <h3>Social Media Graphics</h3>
              <p>Custom promotional posts and announcements designed for the
                social platforms and formats you need.</p>
            </article>
          </div>
          <div className="approach-card">
            <h3>Tell us your idea. We&apos;ll quote for your project.</h3>
            <p>Share your wording, images, preferred style, and deadline.
              We agree on the price, formats, revisions, and turnaround before
              designing. After your feedback and approval, we deliver the agreed
              digital files. Printing is quoted separately if arranged.</p>
            <Link href="/contact?service=graphic-design" className="primary-button">
              Request a Design Quote
            </Link>
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
