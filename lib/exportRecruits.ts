import {
  formatDate,
  POSITION_LABEL,
  STATUS_LABEL,
  type Recruit,
  type RecruitStatus,
} from "./recruits";

const ACCENT = "FFFF5C1A"; // cam chủ đạo của site (#ff5c1a)
const BORDER_COLOR = "FFD8D8D8";

/** Nền nhạt phân biệt trạng thái, đủ tương phản để đọc chữ đen. */
const STATUS_FILL: Record<RecruitStatus, string> = {
  passed: "FFE3F5E9",
  pending: "FFFFF3DF",
  rejected: "FFFBE6E7",
};

interface ColumnSpec {
  header: string;
  key: string;
  width: number;
  /** Định dạng ô Excel: '@' = text (giữ số 0 đầu, tránh ký hiệu khoa học) */
  numFmt?: string;
}

const COLUMNS: ColumnSpec[] = [
  { header: "Họ và tên", key: "full_name", width: 26 },
  { header: "MSSV", key: "student_id", width: 16, numFmt: "@" },
  { header: "Email", key: "email", width: 30 },
  { header: "Số điện thoại", key: "phone", width: 16, numFmt: "@" },
  { header: "Chiều cao (cm)", key: "height_cm", width: 10 },
  { header: "Vị trí", key: "position", width: 24 },
  { header: "Kinh nghiệm", key: "experience", width: 16 },
  { header: "Ghi chú", key: "note", width: 42 },
  { header: "Trạng thái", key: "status", width: 13 },
  { header: "Ngày đăng ký", key: "created_at", width: 19, numFmt: "dd/mm/yyyy hh:mm" },
];

/**
 * Excel không lưu múi giờ — nó hiển thị đúng các thành phần ngày/giờ được ghi vào.
 * Cộng thêm 7 tiếng để giờ hiển thị là giờ Việt Nam thay vì UTC.
 */
function toVietnamWallClock(iso: string): Date {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
}

export async function exportRecruitsToExcel(recruits: Recruit[]): Promise<void> {
  // Nạp động: exceljs khá nặng, không nên nằm trong bundle trang chính.
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IU Basketball Club";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Đơn tuyển quân", {
    views: [{ state: "frozen", ySplit: 1 }], // đóng băng hàng tiêu đề
  });

  sheet.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // ----- Hàng tiêu đề -----
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  // ----- Dữ liệu -----
  recruits.forEach((r) => {
    const row = sheet.addRow({
      full_name: r.full_name,
      student_id: r.student_id,
      email: r.email,
      phone: r.phone ?? "",
      height_cm: r.height_cm ?? null,
      position: POSITION_LABEL[r.position],
      experience: r.experience ?? "",
      note: r.note ?? "",
      status: STATUS_LABEL[r.status],
      created_at: toVietnamWallClock(r.created_at),
    });

    const fill = STATUS_FILL[r.status];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.alignment = { vertical: "middle" };
    });

    row.getCell("height_cm").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("status").alignment = { horizontal: "center", vertical: "middle" };
  });

  // ----- Viền mảnh cho toàn bộ ô -----
  const thin = { style: "thin" as const, color: { argb: BORDER_COLOR } };
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
    });
  });

  // ----- Bộ lọc tự động trên toàn bảng -----
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, recruits.length + 1), column: COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `don-tuyen-quan-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Dùng cho tên file / hiển thị — giữ chung một chỗ định dạng ngày. */
export { formatDate };
