"use client";

import { useState } from "react";
import FadeIn from "@/components/ui/FadeIn";

const steps = [
  {
    title: "Discovery",
    description:
      "We learn about your business, customers, and goals before recommending the right website or digital solution."
  },
  {
    title: "Strategy",
    description:
      "Together we define the right solution and create a clear roadmap for your website or digital project."
  },
  {
    title: "Build",
    description:
      "We design and develop a fast, modern website that reflects your brand and delivers results.",
  },
  {
    title: "Launch",
    description:
      "After testing, your website goes live and we're here to support your growth.",
  },
];

export default function OurApproach() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <FadeIn>
      <section id="process" className="our-approach">
        <div className="container">

          <span className="section-tag">
            OUR APPROACH
          </span>

          <h2>
            Every Business Deserves
            <br />
            a Tailored Solution
          </h2>

          <p className="section-description">
            We guide every client through a simple four-step process—from the
            first conversation to launching a website that helps their business
            grow.
          </p>

          <div className="process-stepper">

            {steps.map((step, index) => (
              <div
                key={step.title}
                className="step-wrapper"
              >
                <div
                  className={`step ${
                    activeStep === index ? "active" : ""
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="step-dot">
                    {index + 1}
                  </div>

                  <span>{step.title}</span>
                </div>

                {index < steps.length - 1 && (
                  <div className="step-line"></div>
                )}
              </div>
            ))}

          </div>

          <div className="approach-card">

            <h3>{steps[activeStep].title}</h3>

            <p>{steps[activeStep].description}</p>

          </div>

        </div>
      </section>
    </FadeIn>
  );
}