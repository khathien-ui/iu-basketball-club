import { ROLE_LABEL } from "./members";
import { formatSessionDate } from "./sessions";
import type { MemberStats, Period } from "./attendanceStats";

const ACCENT = "FFFF5C1A";
const BORDER_COLOR = "FFD8D8D8";

/** Nền nhạt theo mức chuyên cần, khớp màu trên giao diện. */
const LEVEL_FILL = {
  good: "FFE3F5E9",
  warn: "FFFFF3DF",
  bad: "FFFBE6E7",
  none: "FFF5F5F5",
} as const;

interface ColumnSpec {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

const COLUMNS: ColumnSpec[] = [
  { header: "Họ và tên", key: "name", width: 26 },
  { header: "MSSV", key: "student_id", width: 16, numFmt: "@" },
  { header: "Vai trò", key: "role", width: 16 },
  { header: "Số buổi", key: "total", width: 10 },
  { header: "Có mặt", key: "attended", width: 10 },
  { header: "Đúng giờ", key: "present", width: 10 },
  { header: "Đi trễ", key: "late", width: 10 },
  { header: "Có phép", key: "excused", width: 10 },
  { header: "Vắng không phép", key: "absent", width: 16 },
  { header: "Tỉ lệ chuyên cần", key: "rate", width: 16, numFmt: "0%" },
];

export async function exportAttendanceToExcel(
  stats: MemberStats[],
  period: Period,
  sessionCount: number
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IU Basketball Club";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Chuyên cần", {
    views: [{ state: "frozen", ySplit: 3 }], // khoá 2 dòng tiêu đề kỳ + hàng tiêu đề cột
  });

  sheet.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // ----- Dòng tiêu đề kỳ thống kê (chèn lên trên hàng tiêu đề cột) -----
  sheet.spliceRows(1, 0,
    [`Báo cáo chuyên cần — ${formatSessionDate(period.from)} đến ${formatSessionDate(period.to)}`],
    [`Số buổi tập trong kỳ: ${sessionCount}`]
  );
  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  sheet.mergeCells(2, 1, 2, COLUMNS.length);

  const titleRow = sheet.getRow(1);
  titleRow.height = 26;
  titleRow.getCell(1).font = { bold: true, size: 13 };
  titleRow.getCell(1).alignment = { vertical: "middle" };

  const subRow = sheet.getRow(2);
  subRow.getCell(1).font = { size: 11, color: { argb: "FF666666" } };

  // ----- Hàng tiêu đề cột (giờ ở dòng 3) -----
  const headerRow = sheet.getRow(3);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  // ----- Dữ liệu -----
  stats.forEach((s) => {
    const row = sheet.addRow({
      name: s.member.full_name ?? "",
      student_id: s.member.student_id ?? "",
      role: ROLE_LABEL[s.member.role],
      total: s.totalSessions,
      attended: s.attended,
      present: s.present,
      late: s.late,
      excused: s.excused,
      absent: s.absent,
      rate: s.rate === null ? null : s.rate / 100, // numFmt 0% cần dạng tỉ lệ
    });

    const level = s.rate === null
      ? "none"
      : s.rate >= 80 ? "good" : s.rate >= 50 ? "warn" : "bad";

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LEVEL_FILL[level] } };
      cell.alignment = { vertical: "middle" };
    });

    // Cột số căn giữa cho dễ đọc.
    ["total", "attended", "present", "late", "excused", "absent", "rate"].forEach((k) => {
      row.getCell(k).alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // ----- Viền mảnh -----
  const thin = { style: "thin" as const, color: { argb: BORDER_COLOR } };
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 3) return; // hai dòng tiêu đề kỳ để trống viền cho thoáng
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: Math.max(3, stats.length + 3), column: COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chuyen-can-${period.from}-den-${period.to}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
