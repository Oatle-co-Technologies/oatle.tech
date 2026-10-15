import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Oatle Technologies | Start Your Project",
  description:
    "Talk to Oatle Technologies about websites, custom technology solutions, invitations, flyers, posters, and social media graphics.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}