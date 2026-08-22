"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gallery } from "@/data/gallery";

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(
    () => setLightbox((i) => (i === null ? null : (i + gallery.length - 1) % gallery.length)),
    []
  );
  const next = useCallback(
    () => setLightbox((i) => (i === null ? null : (i + 1) % gallery.length)),
    []
  );

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 48) prev();
    else if (dx < -48) next();
    touchStartX.current = null;
  };

  const current = lightbox === null ? null : gallery[lightbox];

  return (
    <section className="section" id="gallery">
      <div className="section-inner">
        <p className="eyebrow">Ngày thi đấu</p>
        <h2 className="section__title">Gallery.</h2>
        <p className="section__lede">
          Hình ảnh và khoảnh khắc nổi bật từ các buổi tuyển quân, tập luyện và giải đấu.
        </p>

        <div className="gallery-masonry">
          {gallery.map(({ src, caption, width, height }, i) => (
            <button
              type="button"
              className="gallery-item"
              key={src}
              onClick={() => setLightbox(i)}
              aria-label={`Xem ảnh: ${caption}`}
            >
              <Image src={src} alt={caption} width={width} height={height} loading="lazy" />
              <span className="gallery-item__caption">{caption}</span>
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          onClick={close}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button type="button" className="lightbox__close" aria-label="Đóng" onClick={close}>
            ×
          </button>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--prev"
            aria-label="Ảnh trước"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>
          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <Image
              src={current.src}
              alt={current.caption}
              width={current.width}
              height={current.height}
              className="lightbox__img"
            />
            <figcaption className="lightbox__caption mono">{current.caption}</figcaption>
          </figure>
          <button
            type="button"
            className="lightbox__nav lightbox__nav--next"
            aria-label="Ảnh sau"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
