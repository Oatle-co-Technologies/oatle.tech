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
    default: "Oatle Technologies | Web Development & Digital Solutions",
    template: "%s | Oatle Technologies",
  },

  description:
    "Oatle Technologies builds professional websites, custom web applications, and digital solutions for businesses in South Africa and beyond.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "Oatle Technologies | Web Development & Digital Solutions",
    description:
      "Professional websites, custom web applications, and digital solutions for businesses in South Africa and beyond.",
    url: "https://oatle-technologies.co.za",
    siteName: "Oatle Technologies",
    type: "website",
    locale: "en_ZA",
  },

  twitter: {
    card: "summary_large_image",
    title: "Oatle Technologies | Web Development & Digital Solutions",
    description:
      "Professional websites, custom web applications, and digital solutions for businesses in South Africa and beyond.",
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