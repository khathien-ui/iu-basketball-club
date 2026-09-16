"use client";

import Image from "next/image";
import { useState } from "react";
import { gallery } from "@/data/gallery";
import Lightbox from "./Lightbox";

export default function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

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

      {lightbox !== null && (
        <Lightbox
          items={gallery.map((g) => ({
            src: g.src, caption: g.caption, width: g.width, height: g.height,
          }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </section>
  );
}
