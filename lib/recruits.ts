export type RecruitStatus = "pending" | "passed" | "rejected";
export type RecruitPosition = "PG" | "SG" | "SF" | "PF" | "C" | "unknown";

export interface Recruit {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  phone: string | null;
  height_cm: number | null;
  position: RecruitPosition;
  experience: string | null;
  note: string | null;
  status: RecruitStatus;
  created_at: string;
  /** Khác null = đơn đã được kết nạp thành thành viên, ẩn nút Kết nạp. */
  enrolled_at?: string | null;
}

export const STATUS_LABEL: Record<RecruitStatus, string> = {
  pending: "Chờ duyệt",
  passed: "Đậu",
  rejected: "Loại",
};

export const STATUS_ORDER: RecruitStatus[] = ["pending", "passed", "rejected"];

export const POSITION_LABEL: Record<RecruitPosition, string> = {
  PG: "PG — Hậu vệ dẫn bóng",
  SG: "SG — Hậu vệ ghi điểm",
  SF: "SF — Tiền phong phụ",
  PF: "PF — Tiền phong chính",
  C: "C — Trung phong",
  unknown: "Chưa biết",
};

export const POSITION_SHORT: Record<RecruitPosition, string> = {
  PG: "PG",
  SG: "SG",
  SF: "SF",
  PF: "PF",
  C: "C",
  unknown: "—",
};

export const POSITION_ORDER: RecruitPosition[] = ["PG", "SG", "SF", "PF", "C", "unknown"];

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** Định dạng cố định theo giờ VN để server và client render giống nhau. */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
