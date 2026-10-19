import { Suspense } from "react";
import BookingForm from "./BookingForm";
import AskAI from "./AskAI";

export default function Contact() {
  return (
    <section id="contact" className="homepage-contact" aria-labelledby="contact-heading">
      <div className="container contact-content">
        <div className="contact-intro">
          <span className="section-tag">CONTACT</span>
          <h2 id="contact-heading">Fill in your details to book an appointment.</h2>
          <p>Choose a preferred date and time for a 45-minute online discovery call.
            All appointments, including first-time visits, must be booked through this form.</p>
          <div className="contact-options">
            <a href="https://wa.me/27797532581" target="_blank" rel="noopener noreferrer">WhatsApp enquiries: +27 79 753 2581</a>
            <a href="mailto:info@oatle-technologies.co.za">Email: info@oatle-technologies.co.za</a>
          </div>
          <AskAI />
        </div>
        <Suspense fallback={<p>Loading booking form…</p>}>
          <BookingForm />
        </Suspense>
      </div>
    </section>
  );
}
