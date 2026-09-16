"use client";

import type { SlugCheck } from "@/lib/useSlugCheck";

interface Props {
  id: string;
  label?: string;
  value: string;
  check: SlugCheck;
  /** Đường dẫn công khai, VD "/events/". */
  pathPrefix: string;
  onChange: (value: string) => void;
  onApplySuggestion: (slug: string) => void;
}

/**
 * Ô nhập slug kèm trạng thái kiểm tra trùng.
 * Dùng chung cho sự kiện, bài viết và album.
 */
export default function SlugField({
  id, label = "Đường dẫn (slug)", value, check, pathPrefix, onChange, onApplySuggestion,
}: Props) {
  const preview = check.status === "adjusted" ? check.resolved : value;

  return (
    <div className="field field--full">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="tuyen-quan-mua-thu-2026"
        className="mono"
        aria-invalid={check.status === "taken" || check.status === "invalid"}
      />

      <div className="slug-status">
        {check.status === "checking" && (
          <span className="slug-status__line">Đang kiểm tra…</span>
        )}

        {check.status === "invalid" && (
          <span className="slug-status__line slug-status__line--bad">
            Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.
          </span>
        )}

        {check.status === "ok" && (
          <span className="slug-status__line slug-status__line--good">
            Dùng được · <code className="mono">{pathPrefix}{preview}</code>
          </span>
        )}

        {check.status === "adjusted" && (
          <span className="slug-status__line slug-status__line--warn">
            <code className="mono">{value}</code> đã có nội dung khác dùng — sẽ lưu thành{" "}
            <code className="mono">{check.resolved}</code>
          </span>
        )}

        {check.status === "taken" && (
          <span className="slug-status__line slug-status__line--bad">
            <code className="mono">{value}</code> đã được dùng.
            {check.suggestion && (
              <>
                {" "}Gợi ý:{" "}
                <button
                  type="button"
                  className="slug-status__apply mono"
                  onClick={() => onApplySuggestion(check.suggestion)}
                >
                  {check.suggestion}
                </button>
              </>
            )}
          </span>
        )}

        {check.status === "error" && (
          <span className="slug-status__line slug-status__line--warn">
            Không kiểm tra được slug. Nếu trùng, hệ thống sẽ tự thêm hậu tố khi lưu.
          </span>
        )}
      </div>
    </div>
  );
}
