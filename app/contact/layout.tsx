import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Oatle Technologies | Start Your Project",
  description:
    "Talk to Oatle Technologies about your website, redesign, online store, or custom technology project.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}