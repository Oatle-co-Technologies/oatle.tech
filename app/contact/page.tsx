"use client";

import { FormEvent, useState } from "react";
import emailjs from "@emailjs/browser";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
  type: "success" | "error";
  message: string;
} | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    service: "New Website",
    message: "",
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus(null);

    // Trim whitespace
    const name = formData.name.trim();
    const business = formData.business.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const message = formData.message.trim();
    const service = formData.service;

    // Required fields
    if (!name || !business || !email || !phone || !message) {
        setStatus({
            type: "error",
            message: "Please complete all required fields.",
        });
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        setStatus({
            type: "error",
            message: "Please enter a valid email address.",
        });
        return;
    }

    // Block fake domains
    const blockedDomains = [
        "example.com",
        "test.com",
        "localhost",
        "fake.com",
    ];

    const domain = email.split("@")[1];

    if (blockedDomains.includes(domain)) {
        setStatus({
            type: "error",
            message: "Please use a real email address.",
        });
        return;
    }

    // Block disposable email providers
    const disposableDomains = [
        "mailinator.com",
        "10minutemail.com",
        "guerrillamail.com",
        "tempmail.com",
        "temp-mail.org",
        "sharklasers.com",
    ];

    if (disposableDomains.includes(domain)) {
        setStatus({
            type: "error",
            message: "Temporary email addresses are not supported.",
        });
        return;
    }

    // Phone validation
    const phoneRegex = /^[0-9+\-\s()]{10,20}$/;

    if (!phoneRegex.test(phone)) {
        setStatus({
            type: "error",
            message: "Please enter a valid phone number.",
        });
        return;
    }

    // Message validation
    if (message.length < 20) {
        setStatus({
            type: "error",
            message:
                "Please provide a little more detail about your project.",
        });
        return;
    }

    setLoading(true);

    try {
        await emailjs.send(
            "service_4mg8nys",
            "template_rs3cuww",
            {
                title: business,
                name,
                business,
                email,
                phone,
                service,
                message,
            },
            "G21rP3jrxQohCHe1l"
        );

        setStatus({
            type: "success",
            message:
                "Thank you! Your enquiry has been sent successfully. We'll get back to you within one business day.",
        });

        setFormData({
            name: "",
            business: "",
            email: "",
            phone: "",
            service: "New Website",
            message: "",
        });

    } catch (error) {
        console.error(error);

        setStatus({
            type: "error",
            message:
                "Something went wrong while sending your enquiry. Please try again.",
        });

    } finally {
        setLoading(false);
    }
}

  return (
    <section className="contact-page">
      <div className="container">
        <span className="section-tag">BOOK A DISCOVERY CALL</span>

        <h1> Let's Talk About Your Business</h1>

        <p className="section-description">
          Tell us a little about your business and we'll recommend the best
          solution for your goals.
        </p>

        <div className="contact-content">
          {/* Left Side */}

          <div className="contact-info">
            <div className="contact-card">
              <h3>🤝 Tailored Strategy</h3>
              <p>
                Every business is different, so every solution is designed
                around your goals.
              </p>
            </div>

            <div className="contact-card">
              <h3>🚀 No Pressure</h3>
              <p>
                This is simply the first conversation.
                <br />
                No obligation.
              </p>
            </div>

            <div className="contact-card">
              <h3>💬 Friendly Advice</h3>
              <p>We speak business, not technical jargon.</p>
            </div>
          </div>

          {/* Right Side */}

          <form className="contact-form" onSubmit={handleSubmit}>
            
  
            <div>
              <label>Full Name</label>

              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Business Name</label>

              <input
                type="text"
                required
                value={formData.business}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    business: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Email Address</label>

              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    email: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Phone Number</label>

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label>Service Required</label>

              <select
                value={formData.service}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service: e.target.value,
                  })
                }
              >
                <option>New Website</option>
                <option>Website Redesign</option>
                <option>E-commerce Website</option>
                <option>SEO</option>
                <option>Not Sure Yet</option>
              </select>
            </div>

            <div>
              <label>Tell us about your business</label>

              <textarea
                rows={6}
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    message: e.target.value,
                  })
                }
              />
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Enquiry"}
            </button>
            {status && (
  <div className={`form-message ${status.type}`}>
    {status.message}
  </div>
)}
          </form>
        </div>
      </div>
    </section>
  );
}