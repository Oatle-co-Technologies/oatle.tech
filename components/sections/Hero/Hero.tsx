"use client";
import { motion } from "framer-motion";


export default function Hero() {
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
            Helping Small Businesses Grow
          </span>

          <h1>
            Websites that help your business get discovered,
            trusted, and chosen.
          </h1>

          <p>
            We help service-based businesses build beautiful,
            modern websites that turn visitors into customers.
          </p>

          <div className="hero-buttons">
            <button>Start Your Project</button>
            <button>View Our Work</button>
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
              src="hero-video.mp4"
              type="video/mp4"
            />
          </video>
        </motion.div>

      </div>
    </section>
  );
}