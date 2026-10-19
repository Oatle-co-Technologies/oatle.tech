"use client";

import FadeIn from "@/components/ui/FadeIn";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <FadeIn>
    <section className="hero">
      <div className="container hero-content">

        <div className="hero-text">
          <span className="eyebrow">
            Software Development &amp; Design
          </span>

          <h1>
  Software with purpose.
  Designs with personality.
</h1>

          <p>
  Custom websites and software for growing businesses. Interfaces, cards,
  invitations, and visual designs for the moments and messages that matter.
</p>
          <div className="hero-buttons">
            <button onClick={() => router.push("/#contact")}>
              Start Your Project
            </button>

            <button onClick={() => router.push("/#demos")}>
              Explore Live Demos
            </button>
          </div>
        </div>

        <div className="hero-video">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="hero-video-player"
          >
            <source
              src="/hero-video.mp4"
              type="video/mp4"
            />
          </video>
        </div>

      </div>
    </section>
    </FadeIn>
  );
}