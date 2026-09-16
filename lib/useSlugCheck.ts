"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "./supabase/client";
import { isValidSlug } from "./events";
import { findAvailableSlug, isSlugTaken, type SlugTable } from "./slug";

const DEBOUNCE_MS = 400;

export type SlugStatus =
  | "idle"        // chưa nhập gì
  | "invalid"     // sai định dạng
  | "checking"    // đang hỏi database
  | "ok"          // dùng được đúng như đang gõ
  | "adjusted"    // slug gốc bị trùng, hệ thống tự đổi hậu tố
  | "taken"       // người dùng tự đặt và slug đó đã có người dùng
  | "error";      // không kiểm tra được

export interface SlugCheck {
  status: SlugStatus;
  /** Slug sẽ được lưu thật sự. */
  resolved: string;
  /** Gợi ý khi status = "taken". */
  suggestion: string;
}

interface Params {
  table: SlugTable;
  /** Giá trị đang có trong ô slug. */
  slug: string;
  /** Người dùng đã tự sửa ô slug chưa. */
  touched: boolean;
  /** Năm ưu tiên thêm vào hậu tố (VD năm diễn ra sự kiện). */
  year?: number | null;
  /** Bỏ qua bản ghi đang sửa. */
  excludeId?: string | null;
}

/**
 * Kiểm tra slug ngay khi gõ.
 * - Chưa tự sửa slug: tự tìm slug khả dụng (base -> base-YYYY -> base-YYYY-2…).
 * - Đã tự sửa slug: chỉ báo trùng và kèm gợi ý, không âm thầm đổi.
 */
export function useSlugCheck({ table, slug, touched, year, excludeId }: Params): SlugCheck {
  const [check, setCheck] = useState<SlugCheck>({ status: "idle", resolved: "", suggestion: "" });
  const runId = useRef(0);

  useEffect(() => {
    const value = slug.trim();

    if (!value) {
      setCheck({ status: "idle", resolved: "", suggestion: "" });
      return;
    }
    if (!isValidSlug(value)) {
      setCheck({ status: "invalid", resolved: "", suggestion: "" });
      return;
    }

    const id = ++runId.current;
    setCheck((c) => ({ ...c, status: "checking" }));

    const timer = setTimeout(async () => {
      try {
        const supabase = createClient();
        const query = { table, base: value, year, excludeId };

        if (touched) {
          // Người dùng tự đặt: tôn trọng lựa chọn, chỉ cảnh báo nếu trùng.
          const taken = await isSlugTaken(supabase, { table, excludeId }, value);
          if (id !== runId.current) return;

          if (!taken) {
            setCheck({ status: "ok", resolved: value, suggestion: "" });
            return;
          }
          const suggestion = await findAvailableSlug(supabase, query);
          if (id !== runId.current) return;
          setCheck({ status: "taken", resolved: "", suggestion });
          return;
        }

        // Tự sinh từ tiêu đề: im lặng chọn slug khả dụng.
        const resolved = await findAvailableSlug(supabase, query);
        if (id !== runId.current) return;
        setCheck({
          status: resolved === value ? "ok" : "adjusted",
          resolved,
          suggestion: "",
        });
      } catch (err) {
        if (id !== runId.current) return;
        console.error("[useSlugCheck] Không kiểm tra được slug:", err);
        setCheck({ status: "error", resolved: value, suggestion: "" });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [table, slug, touched, year, excludeId]);

  return check;
}
