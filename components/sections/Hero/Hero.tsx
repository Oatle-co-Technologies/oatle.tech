"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="hero">
      <div className="container hero-content">

        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
          }}
        >
          <span className="eyebrow">
            Web Development &amp; Graphic Design
          </span>

          <h1>
  Websites with purpose.
  Designs with personality.
</h1>

          <p>
  Custom websites for growing businesses. Invitations, flyers, and
  graphics for the moments and messages that matter.
</p>
          <div className="hero-buttons">
            <button onClick={() => router.push("/contact")}>
              Start Your Project
            </button>

            <button onClick={() => router.push("/#demos")}>
              Explore Live Demos
            </button>
          </div>
        </motion.div>

        <motion.div
          className="hero-video"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1,
            delay: 0.2,
            ease: "easeOut",
          }}
        >
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
        </motion.div>

      </div>
    </section>
  );
}