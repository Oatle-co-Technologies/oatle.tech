import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Oatle Technologies | Start Your Project",
  description:
    "Talk to Oatle Technologies about software development and design, including websites, applications, interfaces, invitations, cards, posters, and promotional visuals.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}