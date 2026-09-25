import FadeIn from "@/components/ui/FadeIn";
import Link from "next/link";

const socialLinks = [
    {
        name: "Facebook",
        href: "https://www.facebook.com/oatle.tech",
        icon: "https://cdn.simpleicons.org/facebook/ffffff",
    },
    {
        name: "Instagram",
        href: "https://www.instagram.com/oatle.tech/",
        icon: "https://cdn.simpleicons.org/instagram/ffffff",
    },
    {
        name: "TikTok",
        href: "https://www.tiktok.com/@vinoliacode?lang=en-GB",
        icon: "https://cdn.simpleicons.org/tiktok/ffffff",
    },
    {
        name: "LinkedIn",
        href: "https://www.linkedin.com/in/ntombizodwa-moekwa-20b25a243",
        icon: "https://cdn.simpleicons.org/linkedin/FFFFFF",
    },
    {
        name: "WhatsApp",
        href: "https://wa.me/27797532581",
        icon: "https://cdn.simpleicons.org/whatsapp/ffffff",
    },
];

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

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    marginBottom: "0.5rem",
                                }}
                            >
                                {socialLinks.map((social) => (
                                    <Link
                                        key={social.name}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={social.name}
                                        title={social.name}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "32px",
                                            height: "32px",
                                        }}
                                    >
                                        {social.name === "LinkedIn" ? (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                width="18"
                                                height="18"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.026-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V8.999h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.287zM5.337 7.433a2.062 2.062 0 1 1 0-4.123 2.062 2.062 0 0 1 0 4.123zM3.555 20.452h3.564V8.999H3.555v11.453z" />
                                            </svg>
                                        ) : (
                                            <img
                                                src={social.icon}
                                                alt=""
                                                width="18"
                                                height="18"
                                                style={{
                                                    display: "block",
                                                }}
                                            />
                                        )}
                                    </Link>
                                ))}
                            </div>

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
