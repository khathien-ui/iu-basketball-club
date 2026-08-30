"use client";

import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`} id="nav" ref={navRef}>
      <div className="nav__inner">
        <a href="/" className="nav__logo">
          <span className="nav__logo-badge">
            <img src="/assets/logo.png" alt="IU Basketball Club logo" />
          </span>
          IU Basketball Club
        </a>

        <nav className={`nav__links${open ? " is-open" : ""}`} id="navLinks">
          <a href="/#about" onClick={close}>About Us</a>
          <a href="/#board" onClick={close}>Executive Board</a>
          <a href="/#events" onClick={close}>Events</a>
          <a href="/#gallery" onClick={close}>Gallery</a>
          <a href="/#news" onClick={close}>News</a>
          <a href="/#contact" onClick={close}>Contact</a>
          <div className="nav__actions nav__actions--mobile">
            <a href="/#events" className="btn btn--solid" onClick={close}>Join the Club</a>
          </div>
        </nav>

        <div className="nav__actions">
          <a href="/#events" className="btn btn--solid">Join the Club</a>
        </div>

        <button
          className="nav__toggle"
          id="navToggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
