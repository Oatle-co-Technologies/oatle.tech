"use client";

import { useState } from "react";
import FadeIn from "@/components/ui/FadeIn";

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
                        Frequently Asked Questions
                    </h2>

                    <p className="section-description">
                        Have questions? Here are some of the most common things
                        business owners ask before getting started.
                    </p>

                    <div className="faq-container">

                        {/* FAQ 1 */}

                        <div
                            className={`faq-item ${openIndex === 0 ? "active" : ""}`}
                            onClick={() => toggleFAQ(0)}
                        >

                            <div className="faq-question">

                                <h3>
                                    How long does a website take?
                                </h3>

                                <span className="faq-icon">
                                    {openIndex === 0 ? "−" : "+"}
                                </span>

                            </div>

                            {openIndex === 0 && (

                                <p className="faq-answer">
                                    Every project is different, so timelines depend on
                                    the complexity and your business requirements.
                                </p>

                            )}

                        </div>

                        {/* FAQ 2 */}

                        <div
                            className={`faq-item ${openIndex === 1 ? "active" : ""}`}
                            onClick={() => toggleFAQ(1)}
                        >

                            <div className="faq-question">

                                <h3>
                                    Will my website work on mobile devices?
                                </h3>

                                <span className="faq-icon">
                                    {openIndex === 1 ? "−" : "+"}
                                </span>

                            </div>

                            {openIndex === 1 && (

                                <p className="faq-answer">
                                    Absolutely. Every website is designed to work
                                    beautifully across phones, tablets, and desktops.
                                </p>

                            )}

                        </div>

                        {/* FAQ 3 */}

                        <div
                            className={`faq-item ${openIndex === 2 ? "active" : ""}`}
                            onClick={() => toggleFAQ(2)}
                        >

                            <div className="faq-question">

                                <h3>
                                    Can you redesign my existing website?
                                </h3>

                                <span className="faq-icon">
                                    {openIndex === 2 ? "−" : "+"}
                                </span>

                            </div>

                            {openIndex === 2 && (

                                <p className="faq-answer">
                                    Yes. We can refresh your current website or build a
                                    completely new experience if that's the better fit.
                                </p>

                            )}

                        </div>

                        {/* FAQ 4 */}

                        <div
                            className={`faq-item ${openIndex === 3 ? "active" : ""}`}
                            onClick={() => toggleFAQ(3)}
                        >

                            <div className="faq-question">

                                <h3>
                                    Do you provide ongoing support?
                                </h3>

                                <span className="faq-icon">
                                    {openIndex === 3 ? "−" : "+"}
                                </span>

                            </div>

                            {openIndex === 3 && (

                                <p className="faq-answer">
                                    We offer support options after launch to help keep
                                    your website running smoothly.
                                </p>

                            )}

                        </div>

                    </div>

                </div>

            </section>
        </FadeIn>
    );
}