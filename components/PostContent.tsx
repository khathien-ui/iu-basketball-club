"use client";

import { useMemo, useRef, useState } from "react";
import { renderMarkdown } from "@/lib/markdown";
import Lightbox, { type LightboxItem } from "./Lightbox";

interface Props {
  content: string;
  className?: string;
}

/**
 * Hiển thị nội dung markdown của bài viết.
 * Bấm vào ảnh trong bài sẽ mở lightbox dùng chung với thư viện ảnh.
 */
export default function PostContent({ content, className }: Props) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const rootRef = useRef<HTMLDivElement>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [items, setItems] = useState<LightboxItem[]>([]);

  /** Bắt sự kiện ở gốc thay vì gắn từng ảnh — nội dung do dangerouslySetInnerHTML dựng. */
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG" || !target.dataset.mdImage) return;

    const root = rootRef.current;
    if (!root) return;

    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img[data-md-image]"));
    const index = images.indexOf(target as HTMLImageElement);
    if (index === -1) return;

    setItems(images.map((img) => ({
      src: img.src,
      caption: img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || img.alt,
    })));
    setLightbox(index);
  }

  return (
    <>
      <div
        ref={rootRef}
        className={className ?? "md-preview"}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {lightbox !== null && items.length > 0 && (
        <Lightbox
          items={items}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNavigate={setLightbox}
        />
      )}
    </>
  );
}
