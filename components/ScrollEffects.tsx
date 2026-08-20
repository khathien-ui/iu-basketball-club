"use client";

import { useEffect } from "react";

// Scroll reveal — every section animates in when it enters the viewport.
// ?noanim: headless screenshot mode — render everything visible, no transitions.
export default function ScrollEffects() {
  useEffect(() => {
    const noAnim = new URLSearchParams(window.location.search).has("noanim");
    if (noAnim) {
      document.documentElement.style.setProperty("scroll-behavior", "auto");
      return;
    }

    const targets = document.querySelectorAll(
      ".section, .hero__panel, .cta__inner, .footer__inner"
    );
    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
