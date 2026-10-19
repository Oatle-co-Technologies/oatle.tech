import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import { Providers } from "./providers";

import "@neondatabase/auth-ui/css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oatle-technologies.co.za"),

  title: {
    default: "Oatle Technologies | Software Development & Design",
    template: "%s | Oatle Technologies",
  },

  description:
    "Oatle Technologies offers software development and design, from websites and custom applications to interfaces, invitations, cards, and promotional designs for businesses and special occasions in South Africa and beyond.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Oatle Technologies | Software Development & Design",
    description:
      "Software development and design: websites, custom applications, interfaces, invitations, cards, posters, and promotional visuals.",
    url: "https://oatle-technologies.co.za",
    siteName: "Oatle Technologies",
    type: "website",
    locale: "en_ZA",
  },

  twitter: {
    card: "summary_large_image",
    title: "Oatle Technologies | Software Development & Design",
    description:
      "Software development and design: websites, custom applications, interfaces, invitations, cards, posters, and promotional visuals.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${playfair.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}