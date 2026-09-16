"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AlbumFormDialog, { type EventOption } from "./AlbumFormDialog";
import ConfirmDialog from "./ConfirmDialog";
import { storagePathFromPublicUrl } from "@/lib/imageUpload";
import { formatAlbumDate, type AlbumRow } from "@/lib/albums";

type PublishFilter = "all" | "published" | "draft";

interface Props {
  initialAlbums: AlbumRow[];
  photoCounts: Record<string, number>;
  eventTitles: Record<string, string>;
  events: EventOption[];
}

export default function AlbumsAdmin({ initialAlbums, photoCounts, eventTitles, events }: Props) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initialAlbums);
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AlbumRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AlbumRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const stats = useMemo(() => ({
    total: albums.length,
    published: albums.filter((a) => a.is_published).length,
    photos: Object.values(photoCounts).reduce((s, n) => s + n, 0),
  }), [albums, photoCounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return albums
      .filter((a) =>
        publishFilter === "all" ||
        (publishFilter === "published" ? a.is_published : !a.is_published)
      )
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.slug.includes(q));
  }, [albums, publishFilter, query]);

  async function togglePublish(album: AlbumRow) {
    setAlert(null);
    setBusyId(album.id);
    const next = !album.is_published;
    const previous = albums;
    setAlbums((as) => as.map((a) => (a.id === album.id ? { ...a, is_published: next } : a)));

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("albums")
        .update({ is_published: next })
        .eq("id", album.id);

      if (error) {
        setAlbums(previous);
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền thay đổi album này."
            : "Không cập nhật được trạng thái.",
        });
        return;
      }
      setAlert({ kind: "success", text: next ? "Đã đăng album." : "Đã chuyển về nháp." });
      router.refresh();
    } catch {
      setAlbums(previous);
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
    }
  }

  /** Xoá album kèm toàn bộ file ảnh trên Storage. */
  async function handleDelete(album: AlbumRow) {
    setAlert(null);
    setBusyId(album.id);
    try {
      const supabase = createClient();

      const { data: photos } = await supabase
        .from("photos")
        .select("image_url, thumbnail_url")
        .eq("album_id", album.id);

      const paths = (photos ?? [])
        .flatMap((p) => [p.image_url, p.thumbnail_url])
        .filter((u): u is string => !!u)
        .map((u) => storagePathFromPublicUrl(u, "media"))
        .filter((p): p is string => !!p);

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage.from("media").remove(paths);
        if (storageError) {
          // File mồ côi trên Storage không đáng để chặn việc xoá album.
          console.error("[AlbumsAdmin] Xoá file trên Storage lỗi:", storageError);
        }
      }

      // photos có ON DELETE CASCADE nên xoá album là xoá luôn bản ghi ảnh.
      const { error } = await supabase.from("albums").delete().eq("id", album.id);
      if (error) {
        setAlert({
          kind: "error",
          text: error.code === "42501"
            ? "Bạn không có quyền xoá album này."
            : "Không xoá được album.",
        });
        return;
      }

      setAlbums((as) => as.filter((a) => a.id !== album.id));
      setAlert({
        kind: "success",
        text: `Đã xoá album “${album.title}” và ${paths.length / 2} ảnh.`,
      });
      router.refresh();
    } catch (err) {
      console.error("[AlbumsAdmin] Xoá album lỗi:", err);
      setAlert({ kind: "error", text: "Không kết nối được máy chủ." });
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  function handleSaved(saved: AlbumRow, isNew: boolean) {
    setAlbums((as) => (isNew ? [saved, ...as] : as.map((a) => (a.id === saved.id ? saved : a))));
    setCreating(false);
    setEditing(null);
    setAlert({
      kind: "success",
      text: isNew ? "Đã tạo album (bản nháp)." : "Đã lưu thay đổi.",
    });
    router.refresh();
  }

  return (
    <div className="recruits">
      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.total}</span>
          <span className="stat-card__label">Tổng album</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.published}</span>
          <span className="stat-card__label">Đã đăng</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value mono">{stats.photos}</span>
          <span className="stat-card__label">Tổng số ảnh</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar__search field">
          <label htmlFor="alSearch" className="sr-only">Tìm theo tiêu đề</label>
          <input id="alSearch" type="search" value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug…" />
        </div>

        <div className="field">
          <label htmlFor="alPublish" className="sr-only">Lọc theo trạng thái</label>
          <select id="alPublish" value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã đăng</option>
            <option value="draft">Nháp</option>
          </select>
        </div>

        <button type="button" className="btn btn--solid" onClick={() => setCreating(true)}>
          Tạo album
        </button>
      </div>

      {alert && (
        <p className={alert.kind === "error" ? "form-alert" : "form-success"} role="alert">
          {alert.text}
        </p>
      )}

      <p className="recruits__count">Hiển thị {filtered.length} / {albums.length} album</p>

      {filtered.length === 0 ? (
        <div className="form-card recruits__empty">
          <p>{albums.length === 0 ? "Chưa có album nào. Bấm “Tạo album” để bắt đầu." : "Không có album khớp bộ lọc."}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Album</th>
                <th>Số ảnh</th>
                <th>Ngày</th>
                <th>Sự kiện</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className={busyId === a.id ? "is-saving" : undefined}>
                  <td data-label="Album">
                    <span className="event-cell">
                      {a.cover_image_url ? (
                        <img className="event-cell__thumb" src={a.cover_image_url} alt="" />
                      ) : (
                        <span className="event-cell__thumb event-cell__thumb--empty" aria-hidden="true" />
                      )}
                      <span className="member-cell__text">
                        <strong>{a.title}</strong>
                        <em className="mono">/{a.slug}</em>
                      </span>
                    </span>
                  </td>
                  <td data-label="Số ảnh" className="mono">{photoCounts[a.id] ?? 0}</td>
                  <td data-label="Ngày" className="nowrap">{formatAlbumDate(a.album_date)}</td>
                  <td data-label="Sự kiện">
                    {a.event_id ? (eventTitles[a.event_id] ?? "(đã xoá)") : "—"}
                  </td>
                  <td data-label="Trạng thái">
                    <span className={`state-badge state-badge--${a.is_published ? "open" : "closed"}`}>
                      {a.is_published ? "Đã đăng" : "Nháp"}
                    </span>
                  </td>
                  <td data-label="">
                    <div className="mark-actions">
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === a.id} onClick={() => togglePublish(a)}>
                        {a.is_published ? "Ẩn" : "Đăng"}
                      </button>
                      <a href={`/dashboard/albums/${a.id}`} className="btn btn--ghost btn--sm">Ảnh</a>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === a.id} onClick={() => setEditing(a)}>Sửa</button>
                      <button type="button" className="btn btn--ghost btn--sm"
                        disabled={busyId === a.id} onClick={() => setConfirmDelete(a)}>Xoá</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <AlbumFormDialog
          album={editing}
          events={events}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xoá album?"
          message={`Album “${confirmDelete.title}” và toàn bộ ${photoCounts[confirmDelete.id] ?? 0} ảnh bên trong sẽ bị xoá vĩnh viễn, kể cả file trên Storage. Không thể hoàn tác.`}
          confirmLabel="Xoá album"
          busy={busyId === confirmDelete.id}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => void handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}
