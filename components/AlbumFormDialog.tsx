"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SlugField from "./SlugField";
import { isValidSlug, slugify } from "@/lib/events";
import { findAvailableSlug, writeWithUniqueSlug } from "@/lib/slug";
import { useSlugCheck } from "@/lib/useSlugCheck";
import { ALBUM_COLUMNS, albumYear, type AlbumRow } from "@/lib/albums";

export interface EventOption {
  id: string;
  title: string;
}

interface Props {
  album: AlbumRow | null;
  events: EventOption[];
  onClose: () => void;
  onSaved: (album: AlbumRow, isNew: boolean) => void;
}

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AlbumFormDialog({ album, events, onClose, onSaved }: Props) {
  const editing = !!album;

  const [title, setTitle] = useState(album?.title ?? "");
  const [slug, setSlug] = useState(album?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [description, setDescription] = useState(album?.description ?? "");
  const [albumDate, setAlbumDate] = useState(album?.album_date ?? todayLocal());
  const [eventId, setEventId] = useState(album?.event_id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = useMemo(() => albumYear(albumDate), [albumDate]);

  const slugCheck = useSlugCheck({
    table: "albums",
    slug,
    touched: slugTouched,
    year,
    excludeId: album?.id ?? null,
  });

  function handleTitle(value: string) {
    setTitle(value);
    setError(null);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Vui lòng nhập tiêu đề album."); return; }

    const finalSlug = (slug.trim() || slugify(title)).trim();
    if (!isValidSlug(finalSlug)) {
      setError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.");
      return;
    }
    if (slugTouched && slugCheck.status === "taken") {
      setError(
        `Slug "${finalSlug}" đã được dùng.` +
        (slugCheck.suggestion ? ` Gợi ý: ${slugCheck.suggestion}.` : "")
      );
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const slugQuery = { table: "albums" as const, base: finalSlug, year, excludeId: album?.id ?? null };

      const startSlug = slugTouched
        ? finalSlug
        : slugCheck.resolved || (await findAvailableSlug(supabase, slugQuery));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        album_date: albumDate || null,
        event_id: eventId || null,
      };

      const { data } = await writeWithUniqueSlug<AlbumRow>(
        supabase,
        slugQuery,
        startSlug,
        async (candidate) => {
          if (editing) {
            return supabase
              .from("albums")
              .update({ ...payload, slug: candidate })
              .eq("id", album!.id)
              .select(ALBUM_COLUMNS)
              .single();
          }
          return supabase
            .from("albums")
            .insert({ ...payload, slug: candidate, created_by: user?.id ?? null, is_published: false })
            .select(ALBUM_COLUMNS)
            .single();
        }
      );

      if (!data) throw new Error("Không nhận được dữ liệu sau khi lưu.");
      onSaved(data, !editing);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.error("[AlbumFormDialog] Lưu album lỗi:", err);
      setError(
        e.code === "42501"
          ? "Bạn không có quyền tạo hoặc sửa album."
          : "Không lưu được album. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="drawer" role="dialog" aria-modal="true"
      aria-label={editing ? "Sửa album" : "Tạo album"} onClick={onClose}>
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div><h2>{editing ? "Sửa album" : "Tạo album"}</h2></div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="drawer__form" noValidate>
          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="al_title">Tiêu đề <span className="req">*</span></label>
              <input id="al_title" value={title} onChange={(e) => handleTitle(e.target.value)}
                placeholder="VD: Giải 3x3 toàn trường 2026" />
            </div>

            <SlugField
              id="al_slug"
              value={slug}
              check={slugCheck}
              pathPrefix="/gallery/"
              onChange={(v) => { setSlug(v); setSlugTouched(true); setError(null); }}
              onApplySuggestion={(s) => { setSlug(s); setSlugTouched(true); setError(null); }}
            />

            <div className="field">
              <label htmlFor="al_date">Ngày</label>
              <input id="al_date" type="date" value={albumDate}
                onChange={(e) => setAlbumDate(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="al_event">Liên kết sự kiện</label>
              <select id="al_event" value={eventId} onChange={(e) => setEventId(e.target.value)}>
                <option value="">— Không liên kết —</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <span className="field__hint">Không bắt buộc.</span>
            </div>

            <div className="field field--full">
              <label htmlFor="al_desc">Mô tả</label>
              <textarea id="al_desc" rows={3} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Vài dòng giới thiệu về album ảnh này." />
            </div>
          </div>

          {error && <p className="form-alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
            {submitting ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo album"}
          </button>

          {!editing && (
            <p className="field__hint">
              Album mới ở dạng nháp. Thêm ảnh ở trang chi tiết rồi bấm đăng để công khai.
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}
