"use client";

import { useEffect } from "react";

interface Props {
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Hộp thoại xác nhận cho các thao tác không hoàn tác được. */
export default function ConfirmDialog({
  title, message, confirmLabel, busy = false, onCancel, onConfirm,
}: Props) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [busy, onCancel]);

  return (
    <div className="lightbox confirm" role="dialog" aria-modal="true" aria-label={title}
      onClick={() => { if (!busy) onCancel(); }}>
      <div className="form-card confirm__panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="confirm__title">{title}</h2>
        <p className="confirm__message">{message}</p>
        <div className="confirm__actions">
          <button type="button" className="btn btn--ghost btn--lg" onClick={onCancel} disabled={busy}>
            Huỷ
          </button>
          <button type="button" className="btn btn--danger btn--lg" onClick={onConfirm} disabled={busy}>
            {busy ? "Đang xoá…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
