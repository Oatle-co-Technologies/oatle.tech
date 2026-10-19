"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

type FadeInProps = {
  children: ReactNode;
  delay?: number;
};

export default function FadeIn({ children, delay = 0 }: FadeInProps) {
  const element = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || !element.current || !("IntersectionObserver" in window)) return;

    // Trigger on any visible part, including sections taller than the viewport.
    // Content is visible before hydration and when observation is unavailable.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
    observer.observe(element.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={element} className={entered ? "section-reveal" : undefined}
      style={{ "--section-reveal-delay": `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
}
