"use client";

import { useCallback, useEffect, useRef } from "react";

export interface LightboxItem {
  src: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface Props {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Xem ảnh phóng to. Dùng chung cho thư viện ảnh và ảnh trong bài viết.
 * Điều khiển: bấm nền tối hoặc nút × để đóng, Esc / ← / → trên bàn phím,
 * vuốt trái phải trên điện thoại.
 */
export default function Lightbox({ items, index, onClose, onNavigate }: Props) {
  const touchStartX = useRef<number | null>(null);
  const current = items[index];
  const many = items.length > 1;

  const prev = useCallback(
    () => onNavigate((index + items.length - 1) % items.length),
    [index, items.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((index + 1) % items.length),
    [index, items.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowLeft") prev();
      if (many && e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next, many]);

  if (!current) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={current.caption || "Xem ảnh"}
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null || !many) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx > 48) prev();
        else if (dx < -48) next();
        touchStartX.current = null;
      }}
    >
      <button type="button" className="lightbox__close" aria-label="Đóng" onClick={onClose}>
        ×
      </button>

      {many && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          aria-label="Ảnh trước"
          onClick={(e) => { e.stopPropagation(); prev(); }}
        >
          ‹
        </button>
      )}

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.src}
          alt={current.caption ?? ""}
          width={current.width}
          height={current.height}
          className="lightbox__img"
        />
        {current.caption && (
          <figcaption className="lightbox__caption mono">{current.caption}</figcaption>
        )}
      </figure>

      {many && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          aria-label="Ảnh sau"
          onClick={(e) => { e.stopPropagation(); next(); }}
        >
          ›
        </button>
      )}
    </div>
  );
}
