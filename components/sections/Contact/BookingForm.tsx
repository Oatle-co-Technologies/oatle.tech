"use client";

import { FormEvent, useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { useSearchParams } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/backend";
const SOUTH_AFRICA_OFFSET = "+02:00";

export default function BookingForm() {
  const requestedService = useSearchParams().get("service");
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
    preferred_date: "",
    preferred_time: "",
    message: "",
  });

  const isDesign = formData.service === "Design";

  useEffect(() => {
    if (["design", "graphic-design"].includes(requestedService || "")) {
      setFormData((current) => ({ ...current, service: "Design" }));
    }
  }, [requestedService]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setStatus(null);

    const name = formData.name.trim();
    const business = formData.business.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const service = formData.service;
    const preferredDate = formData.preferred_date;
    const preferredTime = formData.preferred_time;
    const message = formData.message.trim();

    // Required fields
    if (
      !name ||
      (!isDesign && !business) ||
      !email ||
      !phone ||
      (!isDesign && !preferredDate) ||
      (!isDesign && !preferredTime) ||
      !message
    ) {
      setStatus({
        type: "error",
        message: "Please complete all required fields.",
      });
      return;
    }

    if (Boolean(preferredDate) !== Boolean(preferredTime)) {
      setStatus({ type: "error", message: "Please provide both a date and time for a discovery call, or leave both blank for a design enquiry." });
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

    // Block obvious test/fake domains
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
        message: "Please provide a little more detail about your project.",
      });
      return;
    }

    setLoading(true);

    try {
      if (preferredDate && preferredTime) {
        const start = new Date(
          `${preferredDate}T${preferredTime}:00${SOUTH_AFRICA_OFFSET}`
        );
        const end = new Date(
          start.getTime() + 45 * 60 * 1000
        );

        const appointmentResponse = await fetch(
          `${API_URL}/appointments/discovery`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              participant_name: name,
              participant_email: email,
              title: `Discovery call - ${business || name}`,
              appointment_type: "discovery_call",
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              location: "Online discovery call",
              notes: `${service}\n\n${message}\n\nPhone: ${phone}`,
            }),
          }
        );

        if (!appointmentResponse.ok) {
          const data = await appointmentResponse
            .json()
            .catch(() => null);

          throw new Error(
            data?.detail ||
              "We could not reserve that discovery-call time."
          );
        }

      }

      await emailjs.send(
        "service_4mg8nys",
        "template_rs3cuww",
        {
          title: business || `${service} enquiry - ${name}`,
          name,
          business,
          email,
          phone,
          service,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
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
        preferred_date: "",
        preferred_time: "",
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
          <form className="contact-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Full Name</label>

              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
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
              <label htmlFor="business">Business Name{isDesign ? " (optional)" : ""}</label>

              <input
                id="business"
                name="business"
                type="text"
                required={!isDesign}
                autoComplete="organization"
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
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
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
              <label htmlFor="phone">Phone Number</label>

              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value,
                  })
                }
              />
            </div>

            <div className="booking-wide">
              <label htmlFor="service">Service Required</label>

              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    service: e.target.value,
                  })
                }
              >
                <option>Design</option>
                <option>New Website</option>
                <option>Website Redesign</option>
                <option>Custom Technology Solution</option>
                <option>Online Store / E-commerce</option>
                <option>Not Sure Yet</option>
              </select>
            </div>

            {isDesign && (
              <p className="booking-wide">For design enquiries, a call is optional. Include your brief and deadline below.</p>
            )}

            <div className="contact-form-row">
              <div>
                <label htmlFor="preferred_date">
                  Preferred Call Date{isDesign ? " (optional)" : ""}
                </label>

                <input
                  id="preferred_date"
                  name="preferred_date"
                  type="date"
                  required={!isDesign}
                  value={formData.preferred_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="preferred_time">
                  Preferred Call Time{isDesign ? " (optional)" : ""}
                </label>

                <input
                  id="preferred_time"
                  name="preferred_time"
                  type="time"
                  required={!isDesign}
                  value={formData.preferred_time}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preferred_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="booking-wide">
              <label htmlFor="message">
                Tell us about your project
              </label>

              <textarea
                id="message"
                name="message"
                rows={3}
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
              {loading ? "Sending..." : isDesign && !formData.preferred_date ? "Send Design Enquiry" : "Book an Appointment"}
            </button>

            {status && (
              <div
                className={`form-message ${status.type}`}
                role="alert"
                aria-live="polite"
              >
                {status.message}
              </div>
            )}
          </form>
  );
}
