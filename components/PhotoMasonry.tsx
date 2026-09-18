"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";
import type { PhotoRow } from "@/lib/albums";

interface Props {
  photos: PhotoRow[];
}

/**
 * Lưới masonry + lightbox cho ảnh lấy từ database.
 * Giữ nguyên lưới và lightbox đã dùng ở trang chủ trước đây.
 */
export default function PhotoMasonry({ photos }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      <div className="gallery-masonry">
        {photos.map((p, i) => (
          <button
            type="button"
            className="gallery-item"
            key={p.id}
            onClick={() => setLightbox(i)}
            aria-label={p.caption ? `Xem ảnh: ${p.caption}` : "Xem ảnh"}
          >
            <img
              src={p.thumbnail_url ?? p.image_url}
              alt={p.caption ?? ""}
              loading="lazy"
            />
            {p.caption && <span className="gallery-item__caption">{p.caption}</span>}
          </button>
        ))}
      </div>

      {lightbox !== null && (
        <Lightbox
          items={photos.map((p) => ({ src: p.image_url, caption: p.caption ?? undefined }))}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </>
  );
}
