import Hero from "@/components/sections/Hero/Hero";
import Problem from "@/components/sections/Problem/Problem";
import WhyOatle from "@/components/sections/WhyOatle/WhyOatle";
import FeaturedClient from "@/components/sections/FeaturedClient/FeaturedClient";
import Pricing from "@/components/sections/Pricing/Pricing";
import Process from "@/components/sections/Process/Process";
import FAQ from "@/components/sections/FAQ/FAQ";
import CTA from "@/components/sections/CTA/CTA";

export default function Home() {
  return (
    <>
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