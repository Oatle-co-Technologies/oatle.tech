import Script from "next/script";

import Hero from "@/components/sections/Hero/Hero";
import Problem from "@/components/sections/Problem/Problem";
import WhyOatle from "@/components/sections/WhyOatle/WhyOatle";
import FeaturedClient from "@/components/sections/FeaturedClient/FeaturedClient";
import Pricing from "@/components/sections/Pricing/Pricing";
import Process from "@/components/sections/Process/Process";
import FAQ from "@/components/sections/FAQ/FAQ";
import CTA from "@/components/sections/CTA/CTA";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://oatle-technologies.co.za/#organization",
        name: "Oatle Technologies",
        url: "https://oatle-technologies.co.za/",
        description:
          "Oatle Technologies builds professional websites, custom web applications, and digital solutions for businesses in South Africa and beyond.",
        email: "oatle.technologies@gmail.com",
        sameAs: [
          "https://www.linkedin.com/in/ntombizodwa-moekwa-20b25a243",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://oatle-technologies.co.za/#website",
        name: "Oatle Technologies",
        url: "https://oatle-technologies.co.za/",
        publisher: {
          "@id": "https://oatle-technologies.co.za/#organization",
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="oatle-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <Hero />
      <Problem />
      <WhyOatle />
      <FeaturedClient />
      <Process />
      <Pricing />
      <FAQ />
      <CTA />
    </>
  );
}