import FadeIn from "@/components/ui/FadeIn";
import Link from "next/link";

export default function Footer() {
    return (
        <FadeIn>
            <footer className="footer">

                <div className="container">

                    <div className="footer-top">

                        <div className="footer-brand">

                            <h2 className="footer-brand-lockup">
                                <span className="footer-brand-name">
                                    Oatle Technologies
                                </span>

                                <span className="footer-brand-tagline">
                                    Grow. Multiply. Succeed.
                                </span>
                            </h2>

                            <p>
                                Helping businesses build professional websites
                                and digital solutions that attract customers,
                                build trust, and grow online.
                            </p>

                        </div>

                        <div className="footer-links">

                            <h3>Services</h3>

                            <Link href="/#pricing">
                                Web Design
                            </Link>

                            <Link href="/#pricing">
                                Web Development
                            </Link>

                            <Link href="/#pricing">
                                UI / UX Design
                            </Link>

                            <Link href="/#pricing">
                                WordPress
                            </Link>

                        </div>

                        <div className="footer-links">

                            <h3>Connect</h3>

                            <Link
                                href="https://www.linkedin.com/in/ntombizodwa-moekwa-20b25a243"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                LinkedIn
                            </Link>

                            <Link href="mailto:oatle.technologies@gmail.com">
                                oatle.technologies@gmail.com
                            </Link>

                        </div>

                    </div>

                    <div className="footer-bottom">

                        <p>
                            © 2026 Oatle Technologies. All rights reserved.
                        </p>

                    </div>

                </div>

            </footer>
        </FadeIn>
    );
}