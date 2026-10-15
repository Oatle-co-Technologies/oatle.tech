import FadeIn from "@/components/ui/FadeIn";
import Link from "next/link";

export default function CTA() {
    return (
        <FadeIn>
            <section className="cta">
                <div className="container">

                    <span className="section-tag">
                        LET'S BUILD SOMETHING GREAT
                    </span>

                    <h2>
                        Have a Project in Mind?
                    </h2>

                    <p className="section-description">
                        Whether you need a website, a business flyer, or an invitation
                        for a special occasion, tell us what you have in mind
                        and we&apos;ll help you take the next step.
                    </p>

                    <Link
                        href="/contact"
                        className="cta-button"
                    >
                        Enquire About Your Project
                    </Link>

                </div>
            </section>
        </FadeIn>
    );
}