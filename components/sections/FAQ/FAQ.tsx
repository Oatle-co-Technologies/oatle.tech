"use client";

import { useState } from "react";
import FadeIn from "@/components/ui/FadeIn";

const faqs = [
  {
    question: "How long does a website take to build?",
    answer:
      "The timeline depends on the size and complexity of your website, the number of pages, the functionality required, and how quickly content and feedback are provided. During the discovery and planning stages, we will give you a clearer timeline based on your specific project.",
  },
  {
    question: "Will my website work on mobile devices?",
    answer:
      "Absolutely. Every website we design is responsive, meaning it is built to work across mobile phones, tablets, laptops, and desktop computers. We make sure your website is easy to navigate and looks professional regardless of the device your customers use.",
  },
  {
    question: "Can you redesign my existing website?",
    answer:
      "Yes. We can redesign your existing website to give it a more modern, professional look while improving its layout, navigation, mobile experience, and overall usability. If a redesign is not the best solution for your business, we can also recommend building a new website.",
  },
  {
    question: "Do you build websites for small businesses?",
    answer:
      "Yes. Oatle Technologies works with small and growing businesses to create professional websites and technology solutions that fit their current needs and budget. You do not have to invest in everything upfront—you can start small and add pages, features, and functionality as your business grows.",
  },
  {
    question: "How much does a website cost?",
    answer:
      "Website costs depend on the type, size, and functionality of the project. Our website packages start from R3,000 for a professional one-page marketing website, with larger business websites and custom technology solutions priced according to their requirements. Visit our pricing section to explore the available options.",
  },
  {
    question: "Do you provide ongoing website support?",
    answer:
      "Yes. We offer ongoing support after launch to help keep your website running smoothly. Depending on your needs, this can include website updates, improvements, maintenance, troubleshooting, and additional functionality as your business grows.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <FadeIn>
      <section id="faq" className="faq">
        <div className="container">

          <span className="section-tag">
            FAQ
          </span>

          <h2>
            Frequently Asked Questions About Our Web Design Services
          </h2>

          <p className="section-description">
            Have questions about website design, pricing, timelines, or ongoing
            support? Here are some of the most common questions business owners
            ask before getting started with Oatle Technologies.
          </p>

          <div className="faq-container">

            {faqs.map((faq, index) => (
              <div
                key={faq.question}
                className={`faq-item ${
                  openIndex === index ? "active" : ""
                }`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="faq-question">

                  <h3>
                    {faq.question}
                  </h3>

                  <span className="faq-icon">
                    {openIndex === index ? "−" : "+"}
                  </span>

                </div>

                {openIndex === index && (
                  <p className="faq-answer">
                    {faq.answer}
                  </p>
                )}

              </div>
            ))}

          </div>

        </div>
      </section>
    </FadeIn>
  );
}