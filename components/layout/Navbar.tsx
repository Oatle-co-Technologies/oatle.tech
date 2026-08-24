"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="navbar-container">
        <Link
          href="/"
          className="logo"
          aria-label="Oatle Technologies home"
        >
          <span className="logo-primary">
            Oatle Technologies
          </span>

          <span className="logo-tagline">
            Grow. Multiply. Succeed.
          </span>
        </Link>

        <nav aria-label="Primary navigation">
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={
              menuOpen
                ? "Close navigation"
                : "Open navigation"
            }
            onClick={() =>
              setMenuOpen((open) => !open)
            }
          >
            <span
              className="mobile-nav-hamburger"
              aria-hidden="true"
            />
          </button>

          <ul className="nav-links">
            <li>
              <Link href="/#work">
                Work
              </Link>
            </li>

            <li>
              <Link href="/#process">
                Process
              </Link>
            </li>

            <li>
              <Link href="/#pricing">
                Pricing
              </Link>
            </li>

            <li>
              <Link href="/#faq">
                FAQ
              </Link>
            </li>

            <li>
              <Link href="/contact">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Desktop actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <Link
            href="/sign-in"
            className="dashboard-link"
          >
            Login
          </Link>

          <Link
            href="/contact"
            className="primary-button desktop-cta"
          >
            Book Discovery Call
          </Link>
        </div>
      </div>

      {/* Mobile navigation */}
      <div
        id="mobile-navigation"
        className={
          menuOpen
            ? "mobile-nav-overlay active"
            : "mobile-nav-overlay"
        }
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="mobile-nav-panel">
          <button
            type="button"
            className="mobile-nav-close"
            aria-label="Close navigation"
            onClick={() =>
              setMenuOpen(false)
            }
          >
            Close
          </button>

          <ul className="mobile-nav-links">
            <li>
              <Link
                href="/#work"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Work
              </Link>
            </li>

            <li>
              <Link
                href="/#process"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Process
              </Link>
            </li>

            <li>
              <Link
                href="/#pricing"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Pricing
              </Link>
            </li>

            <li>
              <Link
                href="/#faq"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                FAQ
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Contact
              </Link>
            </li>

            {/* Mobile Login */}
            <li>
              <Link
                href="/sign-in"
                onClick={() =>
                  setMenuOpen(false)
                }
              >
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}