"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/actions/auth";

interface Props {
  displayName: string | null;
  isStaff: boolean;
  canManageContent: boolean;
}

export default function NavbarClient({ displayName, isStaff, canManageContent }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  const close = () => setOpen(false);

  const authArea = displayName ? (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="user-menu__name">{displayName}</span>
        <span className="user-menu__caret" aria-hidden="true">▾</span>
      </button>

      {menuOpen && (
        <div className="user-menu__dropdown" role="menu">
          <a href="/checkin" role="menuitem" onClick={() => setMenuOpen(false)}>
            Điểm danh
          </a>
          <a href="/dashboard/profile" role="menuitem" onClick={() => setMenuOpen(false)}>
            Hồ sơ
          </a>
          <a href="/dashboard" role="menuitem" onClick={() => setMenuOpen(false)}>
            Dashboard
          </a>
          {canManageContent && (
            <>
              <a href="/dashboard/events" role="menuitem" onClick={() => setMenuOpen(false)}>
                Sự kiện
              </a>
              <a href="/dashboard/posts" role="menuitem" onClick={() => setMenuOpen(false)}>
                Bài viết
              </a>
              <a href="/dashboard/albums" role="menuitem" onClick={() => setMenuOpen(false)}>
                Album ảnh
              </a>
            </>
          )}
          {isStaff && (
            <a href="/dashboard/members" role="menuitem" onClick={() => setMenuOpen(false)}>
              Quản trị
            </a>
          )}
          <form action={signOut}>
            <button type="submit" role="menuitem" className="user-menu__signout">
              Đăng xuất
            </button>
          </form>
        </div>
      )}
    </div>
  ) : (
    <a href="/login" className="btn btn--ghost">Member Login</a>
  );

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}`} id="nav">
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
          <a href="/events" onClick={close}>Events</a>
          <a href="/gallery" onClick={close}>Gallery</a>
          <a href="/news" onClick={close}>News</a>
          <a href="/#contact" onClick={close}>Contact</a>
          <div className="nav__actions nav__actions--mobile">
            {!displayName && (
              <a href="/login" className="btn btn--ghost" onClick={close}>Member Login</a>
            )}
            {displayName && (
              <>
                <a href="/checkin" className="btn btn--ghost" onClick={close}>Điểm danh</a>
                <a href="/dashboard" className="btn btn--ghost" onClick={close}>Dashboard</a>
                <form action={signOut}>
                  <button type="submit" className="btn btn--ghost" style={{ width: "100%" }}>
                    Đăng xuất
                  </button>
                </form>
              </>
            )}
            <a href="/events" className="btn btn--solid" onClick={close}>Join the Club</a>
          </div>
        </nav>

        <div className="nav__actions">
          {authArea}
          <a href="/events" className="btn btn--solid">Join the Club</a>
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
