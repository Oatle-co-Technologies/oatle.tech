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
                        Ready To Grow
                        Your Business Online?
                    </h2>

                    <p className="section-description">
                        Whether you're starting from scratch or looking to
                        improve your current website, we'd love to learn
                        about your business and explore the best solution
                        together.
                    </p>

                    <Link
                        href="/contact"
                        className="cta-button"
                    >
                        Book A Discovery Call
                    </Link>

                </div>
            </section>
        </FadeIn>
    );
}