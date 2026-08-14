
import FadeIn from "@/components/ui/FadeIn";
import { SearchX, ShieldAlert, TrendingDown } from "lucide-react";

export default function Problem() {
  return (
    <FadeIn>
    <section className="problem">

      <div className="container">

        <span className="section-tag">
          THE PROBLEM
        </span>

        <h2>
  A Facebook Page Isn&apos;t Enough for Your Business
</h2>
        <p className="section-description">
          Social media is great for building relationships, but when customers
          are actively searching for a business like yours, they expect to find
          a professional website they can trust.
        </p>

        <div className="problem-grid">

          <div className="problem-card">
            <SearchX className="problem-icon" />
            <h3>Hard to Find</h3>

            <h3>Harder to Find</h3>

<p>
  Potential customers search on Google but may never discover your
  business without a professional website.
</p>
          </div>

          <div className="problem-card">
            <ShieldAlert className="problem-icon" />
            <h3>Lost Trust</h3>

            <p>
              Without a website, some customers question whether your business
              is established and professional.
            </p>
          </div>

          <div className="problem-card">
            <TrendingDown className="problem-icon" />
            <h3> Missed Opportunities</h3>

            <p>
              Every day people are looking for services like yours—and they&apos;re
              finding your competitors instead.
            </p>
          </div>

        </div>

      </div>

    </section>
    </FadeIn>
  );
}