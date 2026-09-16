"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AlbumPhotos from "./AlbumPhotos";
import { formatAlbumDate, type AlbumRow, type PhotoRow } from "@/lib/albums";

interface Props {
  initialAlbum: AlbumRow;
  initialPhotos: PhotoRow[];
  eventTitle: string | null;
  currentUserId: string;
}

export default function AlbumDetail({
  initialAlbum, initialPhotos, eventTitle, currentUserId,
}: Props) {
  const router = useRouter();
  const [album, setAlbum] = useState(initialAlbum);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function togglePublish() {
    setAlert(null);
    setBusy(true);
    const next = !album.is_published;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("albums")
        .update({ is_published: next })
        .eq("id", album.id);
      if (error) throw error;

      setAlbum((a) => ({ ...a, is_published: next }));
      setAlert({ kind: "success", text: next ? "Đã đăng album." : "Đã chuyển về nháp." });
      router.refresh();
    } catch (err) {
      const e = err as { code?: string };
      console.error("[AlbumDetail] Đổi trạng thái lỗi:", err);
      setAlert({
        kind: "error",
        text: e.code === "42501"
          ? "Bạn không có quyền thay đổi album này."
          : "Không cập nhật được trạng thái.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="session-detail">
      <a href="/dashboard/albums" className="back-link">← Danh sách album</a>

      <p className="eyebrow">Album ảnh</p>
      <h1 className="section__title">{album.title}</h1>
      <p className="section__lede">
        {formatAlbumDate(album.album_date)}
        {eventTitle ? ` · Sự kiện: ${eventTitle}` : ""}
      </p>

      {album.description && <p className="album-desc">{album.description}</p>}

      <div className="event-flags">
        <span className={`state-badge state-badge--${album.is_published ? "open" : "closed"}`}>
          {album.is_published ? "Đã đăng" : "Nháp"}
        </span>
        {album.cover_image_url ? (
          <span className="state-badge state-badge--upcoming">Đã có ảnh bìa</span>
        ) : (
          <span className="state-badge state-badge--closed">Chưa có ảnh bìa</span>
        )}
      </div>

      <div className="session-actions">
        <button type="button" className={album.is_published ? "btn btn--ghost" : "btn btn--solid"}
          onClick={togglePublish} disabled={busy}>
          {album.is_published ? "Ẩn album" : "Đăng album"}
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <AlbumPhotos
        album={album}
        initialPhotos={initialPhotos}
        currentUserId={currentUserId}
        onCoverChange={(url) => setAlbum((a) => ({ ...a, cover_image_url: url }))}
      />
    </div>
  );
}
