import FadeIn from "@/components/ui/FadeIn";
import {
  Search,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function WhyOatle() {
  return (
    <FadeIn>
      <section className="why-oatle">

        <div className="container">

          <span className="section-tag">
            WHY OATLE TECHNOLOGIES
          </span>

          <h2>
            More Than Just a Website
          </h2>

          <p className="section-description">
            We don't just build beautiful websites. We create digital experiences
            that help your business get discovered, build trust with customers,
            and grow with confidence.
          </p>

          <div className="why-grid">

            <div className="why-card">

              <Search className="why-icon" />

              <h3>
                Be Found
              </h3>

              <p>
                We build SEO-friendly websites that help customers find your
                business on Google when they need your services.
              </p>

            </div>

            <div className="why-card">

              <ShieldCheck className="why-icon" />

              <h3>
                Build Trust
              </h3>

              <p>
                Modern design, fast performance, and a professional online
                presence that gives customers confidence to choose you.
              </p>

            </div>

            <div className="why-card">

              <TrendingUp className="why-icon" />

              <h3>
                Grow Your Business
              </h3>

              <p>
                Every page is designed with one goal in mind—turning visitors
                into enquiries, bookings, and paying customers.
              </p>

            </div>

          </div>

        </div>

      </section>

    </FadeIn>
  );
}