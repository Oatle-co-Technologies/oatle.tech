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
                                        <img
                                            src={social.icon}
                                            alt=""
                                            width="18"
                                            height="18"
                                            style={{
                                                display: "block",
                                            }}
                                        />
                                    </Link>
                                ))}
                            </div>

                            <Link href="mailto:info@oatle-technologies.co.za">
                                info@oatle-technologies.co.za
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
