import FadeIn from "@/components/ui/FadeIn";
import Link from "next/link";
import Image from "next/image";
import {
  Smartphone,
  PackageSearch,
  MessageCircle,
  Gauge,
  ArrowUpRight,
} from "lucide-react";

export default function FeaturedClient() {
  return (
    <FadeIn>
      <section id="work" className="featured-client" >

        <div className="container">

          <span className="section-tag">
            FEATURED CLIENT
          </span>

          <h2 className="section-heading">
            Helping Felicia Bakes Grow Online
          </h2>

          <p className="section-description">
            A modern bakery website designed to showcase handcrafted products,
            simplify customer enquiries, and provide a seamless online ordering
            experience.
          </p>

          <div className="featured-image-wrapper" >

            <Image
              src="/felicia-bakes-portfolio-cover.png"
              alt="Felicia Bakes bakery website designed by Oatle Technologies"
              width={1200}
              height={700}
              className="featured-image"
            />

          </div>

          <div className="project-tags">

            <span>
              <Smartphone size={18} />
              Responsive Design
            </span>

            <span>
              <PackageSearch size={18} />
              Order Tracking
            </span>

            <span>
              <MessageCircle size={18} />
              WhatsApp Integration
            </span>

            <span>
              <Gauge size={18} />
              Fast Performance
            </span>

          </div>

          <Link
  href="https://feliciabakes.co.za"
  target="_blank"
  rel="noopener noreferrer"
  className="project-link"
>
  View Live Project
  <ArrowUpRight size={18} />
</Link>

        </div>

      </section>
    </FadeIn>
  );
}