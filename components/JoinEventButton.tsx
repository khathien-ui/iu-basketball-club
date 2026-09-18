"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ParticipantStatus } from "@/lib/events";

interface Props {
  eventId: string;
  slug: string;
  isLoggedIn: boolean;
  initialStatus: ParticipantStatus | null;
  goingCount: number;
  maxParticipants: number | null;
  /** Nút nhỏ dùng trong danh sách sự kiện. */
  compact?: boolean;
}

export default function JoinEventButton({
  eventId, slug, isLoggedIn, initialStatus, goingCount, maxParticipants, compact = false,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<ParticipantStatus | null>(initialStatus);
  const [count, setCount] = useState(goingCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joined = status === "going";
  const full = maxParticipants !== null && count >= maxParticipants && !joined;

  if (!isLoggedIn) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(`/events/${slug}`)}`}
        className={`btn btn--solid${compact ? " btn--sm" : " btn--lg"}`}
      >
        Đăng nhập để tham gia
      </a>
    );
  }

  async function toggle() {
    setError(null);
    setBusy(true);
    const next: ParticipantStatus = joined ? "cancelled" : "going";

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
        return;
      }

      // Đã có bản ghi thì cập nhật, chưa có thì tạo mới.
      const { error: dbError } = status
        ? await supabase
            .from("event_participants")
            .update({ status: next })
            .eq("event_id", eventId)
            .eq("member_id", user.id)
        : await supabase
            .from("event_participants")
            .insert({ event_id: eventId, member_id: user.id, status: next });

      if (dbError) {
        console.error("[JoinEventButton] Lỗi:", dbError);
        setError(
          dbError.code === "42501"
            ? "Sự kiện này hiện không nhận đăng ký."
            : "Không lưu được đăng ký. Vui lòng thử lại."
        );
        return;
      }

      setStatus(next);
      setCount((c) => (next === "going" ? c + 1 : Math.max(0, c - 1)));
      router.refresh();
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "join-compact" : "join-block"}>
      <button
        type="button"
        className={`btn ${joined ? "btn--ghost" : "btn--solid"}${compact ? " btn--sm" : " btn--lg"}`}
        onClick={toggle}
        disabled={busy || full}
      >
        {busy
          ? "Đang lưu…"
          : joined
            ? "Huỷ tham gia"
            : full
              ? "Đã đủ người"
              : "Tham gia"}
      </button>

      {!compact && (
        <span className="join-block__count">
          {count} người tham gia
          {maxParticipants ? ` / ${maxParticipants}` : ""}
          {joined && <span className="join-block__you"> · có bạn</span>}
        </span>
      )}

      {error && <p className="form-alert" role="alert">{error}</p>}
    </div>
  );
}
