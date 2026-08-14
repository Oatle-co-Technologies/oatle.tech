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
            We design and develop professional websites and digital experiences
            that help businesses get discovered online, build trust with
            customers, and create opportunities for growth.
          </p>

          <div className="why-grid">

            <div className="why-card">

              <Search className="why-icon" />

              <h3>
                Be Found
              </h3>

              <p>
                We design and develop SEO-friendly websites that help customers
                discover your business on Google when they are searching for
                your products or services.
              </p>

            </div>

            <div className="why-card">

              <ShieldCheck className="why-icon" />

              <h3>
                Build Trust
              </h3>

              <p>
                We combine modern web design, fast performance, and a professional
                online presence to give customers confidence in your business.
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