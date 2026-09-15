"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatClock, formatRange, formatSessionDate } from "@/lib/sessions";

const LENGTH = 6;

interface CheckinResult {
  success: boolean;
  code: string;
  message: string;
  status?: "present" | "late";
  session_title?: string;
  session_date?: string;
  start_time?: string;
  location?: string | null;
  checked_in_at?: string;
  opens_at?: string;
  closes_at?: string;
}

export default function CheckinForm() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CheckinResult | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  function focusAt(i: number) {
    const el = inputs.current[Math.max(0, Math.min(LENGTH - 1, i))];
    el?.focus();
    el?.select();
  }

  function setDigit(i: number, value: string) {
    setResult(null);
    setDigits((d) => {
      const next = [...d];
      next[i] = value;
      return next;
    });
  }

  function handleChange(i: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (!only) {
      setDigit(i, "");
      return;
    }
    // Gõ nhanh hoặc bàn phím ảo trả nhiều ký tự: rải sang các ô sau.
    if (only.length > 1) {
      fillFrom(i, only);
      return;
    }
    setDigit(i, only);
    if (i < LENGTH - 1) focusAt(i + 1);
  }

  function fillFrom(start: number, text: string) {
    const chars = text.replace(/\D/g, "").split("").slice(0, LENGTH - start);
    setResult(null);
    setDigits((d) => {
      const next = [...d];
      chars.forEach((c, k) => { next[start + k] = c; });
      return next;
    });
    focusAt(start + chars.length);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setDigit(i, "");
      } else if (i > 0) {
        e.preventDefault();
        setDigit(i - 1, "");
        focusAt(i - 1);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      e.preventDefault();
      focusAt(i + 1);
    } else if (e.key === "Enter" && complete) {
      e.preventDefault();
      void submit();
    }
  }

  function handlePaste(i: number, e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    fillFrom(i, text);
  }

  function reset() {
    setDigits(Array(LENGTH).fill(""));
    setResult(null);
    focusAt(0);
  }

  async function submit() {
    if (!complete || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("check_in_with_code", { code });

      if (error) {
        console.error("[checkin] RPC lỗi:", error);
        setResult({
          success: false,
          code: "rpc_error",
          message:
            error.code === "42883"
              ? "Chức năng điểm danh chưa được cài đặt trên máy chủ. Vui lòng báo ban điều hành."
              : "Không kết nối được máy chủ. Vui lòng thử lại.",
        });
        return;
      }

      const res = data as CheckinResult;
      setResult(res);
      if (res.success) {
        router.refresh(); // cập nhật lịch sử bên dưới
      } else {
        setDigits(Array(LENGTH).fill(""));
        focusAt(0);
      }
    } catch (err) {
      console.error("[checkin] Ngoại lệ:", err);
      setResult({
        success: false,
        code: "network",
        message: "Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi thử lại.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ----- Màn hình xác nhận thành công -----
  if (result?.success) {
    const late = result.status === "late";
    return (
      <div className="form-card checkin-done">
        <div className={`checkin-done__mark${late ? " is-late" : ""}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.25" />
            <path d="m7.5 12.4 3.1 3.1L16.8 9.2" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h2>{late ? "Đã điểm danh — đi trễ" : "Điểm danh thành công!"}</h2>

        <span className={`att-chip att-chip--${result.status}`}>
          {late ? "Đi trễ" : "Có mặt đúng giờ"}
        </span>

        {result.session_title && (
          <p className="checkin-done__session">{result.session_title}</p>
        )}

        <dl className="checkin-done__info">
          {result.session_date && (
            <div>
              <dt>Buổi tập</dt>
              <dd>
                {formatSessionDate(result.session_date)}
                {result.start_time ? ` · ${formatRange(result.start_time, null)}` : ""}
              </dd>
            </div>
          )}
          {result.location && (
            <div><dt>Địa điểm</dt><dd>{result.location}</dd></div>
          )}
          {result.checked_in_at && (
            <div>
              <dt>Giờ check-in</dt>
              <dd className="mono">{formatClock(result.checked_in_at)}</dd>
            </div>
          )}
        </dl>

        <p className="checkin-done__hint">
          Đưa màn hình này cho ban điều hành xem nếu được yêu cầu.
        </p>

        <div className="form-done__actions">
          <button type="button" className="btn btn--ghost btn--lg" onClick={reset}>
            Điểm danh buổi khác
          </button>
        </div>
      </div>
    );
  }

  // ----- Màn hình nhập mã -----
  return (
    <div className="form-card checkin-card">
      <label className="checkin-card__label" htmlFor="code-0">
        Nhập mã điểm danh 6 số
      </label>

      <div className="otp" onClick={() => { if (!code) focusAt(0); }}>
        {digits.map((d, i) => (
          <input
            key={i}
            id={`code-${i}`}
            ref={(el) => { inputs.current[i] = el; }}
            className="otp__box mono"
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            pattern="[0-9]*"
            maxLength={1}
            value={d}
            aria-label={`Chữ số thứ ${i + 1}`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.target.select()}
            autoFocus={i === 0}
          />
        ))}
      </div>

      {result && !result.success && (
        <p className="form-alert checkin-card__error" role="alert">
          {result.message}
          {result.code === "not_started" && result.opens_at && (
            <> Mở lúc <strong>{formatClock(result.opens_at)}</strong>.</>
          )}
          {result.code === "expired" && result.closes_at && (
            <> Đã đóng lúc <strong>{formatClock(result.closes_at)}</strong>.</>
          )}
        </p>
      )}

      <button
        type="button"
        className="btn btn--solid checkin-card__submit"
        onClick={submit}
        disabled={!complete || submitting}
      >
        {submitting ? "Đang kiểm tra…" : "Check-in"}
      </button>

      <p className="field__hint checkin-card__hint">
        Mã được ban điều hành chiếu tại sân tập.
      </p>
    </div>
  );
}
