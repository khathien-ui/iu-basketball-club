"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CoverUpload from "./CoverUpload";
import SlugField from "./SlugField";
import {
  EVENT_COLUMNS,
  EVENT_TYPE_LABEL,
  EVENT_TYPE_ORDER,
  isValidSlug,
  slugify,
  type ClubEventRow,
  type EventType,
} from "@/lib/events";
import { findAvailableSlug, writeWithUniqueSlug } from "@/lib/slug";
import { useSlugCheck } from "@/lib/useSlugCheck";

interface Props {
  /** null = tạo mới */
  event: ClubEventRow | null;
  onClose: () => void;
  onSaved: (event: ClubEventRow, isNew: boolean, finalSlug: string) => void;
}

export default function EventFormDialog({ event, onClose, onSaved }: Props) {
  const editing = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [slug, setSlug] = useState(event?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? "other");
  const [description, setDescription] = useState(event?.description ?? "");
  const [content, setContent] = useState(event?.content ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? "");
  const [endTime, setEndTime] = useState(event?.end_time?.slice(0, 5) ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [coverUrl, setCoverUrl] = useState<string | null>(event?.cover_image_url ?? null);
  const [allowJoin, setAllowJoin] = useState(event?.allow_join ?? false);
  const [maxParticipants, setMaxParticipants] = useState(
    event?.max_participants != null ? String(event.max_participants) : ""
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Năm của sự kiện là hậu tố ưu tiên khi slug gốc bị trùng.
  const year = useMemo(() => {
    if (!eventDate) return null;
    const y = Number(eventDate.slice(0, 4));
    return Number.isInteger(y) ? y : null;
  }, [eventDate]);

  const slugCheck = useSlugCheck({
    table: "events",
    slug,
    touched: slugTouched,
    year,
    excludeId: event?.id ?? null,
  });

  function handleTitle(value: string) {
    setTitle(value);
    setError(null);
    // Slug bám theo tiêu đề cho tới khi người dùng tự sửa slug.
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);

    if (!title.trim()) { setError("Vui lòng nhập tiêu đề sự kiện."); return; }

    const finalSlug = slug.trim() || slugify(title);
    if (!isValidSlug(finalSlug)) {
      setError("Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang. Ví dụ: tuyen-quan-mua-thu-2026");
      return;
    }
    if (endTime && startTime && endTime <= startTime) {
      setError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    const maxNum = maxParticipants.trim() ? Number(maxParticipants) : null;
    if (maxNum !== null && (!Number.isInteger(maxNum) || maxNum <= 0)) {
      setError("Giới hạn số người phải là số nguyên lớn hơn 0.");
      return;
    }

    // Người dùng tự đặt slug trùng: bắt sửa, không âm thầm đổi.
    if (slugTouched && slugCheck.status === "taken") {
      setError(
        `Slug "${finalSlug}" đã được dùng. Hãy chọn slug khác` +
        (slugCheck.suggestion ? ` — gợi ý: ${slugCheck.suggestion}.` : ".")
      );
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const slugQuery = {
        table: "events" as const,
        base: finalSlug,
        year,
        excludeId: event?.id ?? null,
      };

      // Slug tự sinh thì lấy bản đã né trùng; slug tự đặt thì giữ nguyên.
      const startSlug = slugTouched
        ? finalSlug
        : slugCheck.resolved || (await findAvailableSlug(supabase, slugQuery));

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        title: title.trim(),
        event_type: eventType,
        description: description.trim() || null,
        content: content.trim() || null,
        event_date: eventDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        location: location.trim() || null,
        cover_image_url: coverUrl,
        allow_join: allowJoin,
        max_participants: maxNum,
      };

      // writeWithUniqueSlug tự thử lại với hậu tố mới nếu database báo trùng
      // (hai người tạo cùng lúc), thay vì ném lỗi ra người dùng.
      const { data, slug: savedSlug } = await writeWithUniqueSlug<ClubEventRow>(
        supabase,
        slugQuery,
        startSlug,
        async (candidate) => {
          if (editing) {
            return supabase
              .from("events")
              .update({ ...payload, slug: candidate })
              .eq("id", event!.id)
              .select(EVENT_COLUMNS)
              .single();
          }
          return supabase
            .from("events")
            .insert({
              ...payload,
              slug: candidate,
              created_by: user?.id ?? null,
              is_published: false,
            })
            .select(EVENT_COLUMNS)
            .single();
        }
      );

      if (!data) throw new Error("Không nhận được dữ liệu sau khi lưu.");
      onSaved(data, !editing, savedSlug);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.error("[EventFormDialog] Lưu sự kiện lỗi:", err);
      if (e.code === "42501") {
        setError("Bạn không có quyền tạo hoặc sửa sự kiện.");
      } else {
        setError("Không lưu được sự kiện. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="drawer"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Sửa sự kiện" : "Tạo sự kiện"}
      onClick={onClose}
    >
      <aside className="drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          <div><h2>{editing ? "Sửa sự kiện" : "Tạo sự kiện"}</h2></div>
          <button type="button" className="drawer__close" aria-label="Đóng" onClick={onClose}>×</button>
        </header>

        <form onSubmit={handleSubmit} className="drawer__form" noValidate>
          <CoverUpload
            currentUrl={coverUrl}
            folder={`events/${slug || "draft"}`}
            onUploaded={setCoverUrl}
          />

          <div className="form-grid">
            <div className="field field--full">
              <label htmlFor="e_title">Tiêu đề <span className="req">*</span></label>
              <input id="e_title" value={title} onChange={(e) => handleTitle(e.target.value)}
                placeholder="VD: Tuyển quân mùa Thu 2026" />
            </div>

            <SlugField
              id="e_slug"
              value={slug}
              check={slugCheck}
              pathPrefix="/events/"
              onChange={(v) => { setSlug(v); setSlugTouched(true); setError(null); }}
              onApplySuggestion={(s) => { setSlug(s); setSlugTouched(true); setError(null); }}
            />

            <div className="field">
              <label htmlFor="e_type">Loại sự kiện</label>
              <select id="e_type" value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}>
                {EVENT_TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>{EVENT_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="e_date">Ngày diễn ra</label>
              <input id="e_date" type="date" value={eventDate}
                onChange={(e) => setEventDate(e.target.value)} />
              <span className="field__hint">Để trống nếu chưa chốt (hiện TBA).</span>
            </div>

            <div className="field">
              <label htmlFor="e_start">Giờ bắt đầu</label>
              <input id="e_start" type="time" value={startTime}
                onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="e_end">Giờ kết thúc</label>
              <input id="e_end" type="time" value={endTime}
                onChange={(e) => setEndTime(e.target.value)} />
            </div>

            <div className="field field--full">
              <label htmlFor="e_loc">Địa điểm</label>
              <input id="e_loc" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhà thi đấu IU" />
            </div>

            <div className="field field--full">
              <label htmlFor="e_desc">Mô tả ngắn</label>
              <textarea id="e_desc" rows={2} value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Một hai câu tóm tắt, hiện ở danh sách sự kiện." />
            </div>

            <div className="field field--full">
              <label htmlFor="e_content">Nội dung chi tiết</label>
              <textarea id="e_content" rows={6} value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Thể lệ, lịch trình, yêu cầu chuẩn bị…" />
            </div>
          </div>

          <label className="switch">
            <input type="checkbox" checked={allowJoin}
              onChange={(e) => setAllowJoin(e.target.checked)} />
            <span>Cho thành viên bấm tham gia</span>
          </label>

          {allowJoin && (
            <div className="field">
              <label htmlFor="e_max">Giới hạn số người</label>
              <input id="e_max" type="number" min={1} value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)} placeholder="Để trống = không giới hạn" />
            </div>
          )}

          <p className="field__hint">
            Nút &ldquo;Tham gia&rdquo; ở trang công khai chỉ hiện khi sự kiện đã đăng
            <strong> và</strong> bật tuỳ chọn này — database cũng chặn theo đúng điều kiện đó.
          </p>

          {error && <p className="form-alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn--solid btn--lg form-submit" disabled={submitting}>
            {submitting ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo sự kiện"}
          </button>

          {!editing && (
            <p className="field__hint">Sự kiện mới được lưu ở dạng nháp, bấm “Đăng” ở danh sách để công khai.</p>
          )}
        </form>
      </aside>
    </div>
  );
}
