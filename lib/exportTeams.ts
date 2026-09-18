import { POSITION_SHORT } from "./recruits";
import {
  captainOf,
  TEAM_STATUS_LABEL,
  type TeamStatus,
  type TeamWithMembers,
} from "./teams";

const ACCENT = "FFFF5C1A"; // cam chủ đạo của site (#ff5c1a)
const BORDER_COLOR = "FFD8D8D8";
const GROUP_HEADER = "FFF2F2F4";

/** Nền nhạt phân biệt trạng thái, đủ tương phản để đọc chữ đen. */
const STATUS_FILL: Record<TeamStatus, string> = {
  approved: "FFE3F5E9",
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

const TEAM_COLUMNS: ColumnSpec[] = [
  { header: "Mã đội", key: "team_code", width: 14, numFmt: "@" },
  { header: "Tên đội", key: "team_name", width: 26 },
  { header: "Giải đấu", key: "event_title", width: 28 },
  { header: "Đội trưởng", key: "captain_name", width: 24 },
  { header: "MSSV đội trưởng", key: "captain_student_id", width: 16, numFmt: "@" },
  { header: "Email", key: "captain_email", width: 30 },
  { header: "Số điện thoại", key: "captain_phone", width: 16, numFmt: "@" },
  { header: "Số VĐV", key: "member_count", width: 9 },
  { header: "Trạng thái", key: "status", width: 13 },
  { header: "Ngày đăng ký", key: "created_at", width: 19, numFmt: "dd/mm/yyyy hh:mm" },
  { header: "Ghi chú", key: "note", width: 36 },
];

const ROSTER_COLUMNS: ColumnSpec[] = [
  { header: "Mã đội", key: "team_code", width: 14, numFmt: "@" },
  { header: "Tên đội", key: "team_name", width: 26 },
  { header: "STT", key: "index", width: 6 },
  { header: "Họ và tên", key: "full_name", width: 26 },
  { header: "MSSV", key: "student_id", width: 16, numFmt: "@" },
  { header: "Số điện thoại", key: "phone", width: 16, numFmt: "@" },
  { header: "Chiều cao (cm)", key: "height_cm", width: 12 },
  { header: "Vị trí", key: "position", width: 10 },
  { header: "Vai trò", key: "role", width: 14 },
  { header: "Trạng thái đội", key: "status", width: 14 },
];

/**
 * Excel không lưu múi giờ — nó hiển thị đúng các thành phần ngày/giờ được ghi vào.
 * Cộng thêm 7 tiếng để giờ hiển thị là giờ Việt Nam thay vì UTC.
 */
function toVietnamWallClock(iso: string): Date {
  return new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
}

type Sheet = import("exceljs").Worksheet;

function styleHeader(sheet: Sheet) {
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
}

function applyBorders(sheet: Sheet) {
  const thin = { style: "thin" as const, color: { argb: BORDER_COLOR } };
  sheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
    });
  });
}

export async function exportTeamsToExcel(teams: TeamWithMembers[]): Promise<void> {
  // Nạp động: exceljs khá nặng, không nên nằm trong bundle trang chính.
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IU Basketball Club";
  workbook.created = new Date();

  // ================= Sheet 1: danh sách đội =================
  const teamSheet = workbook.addWorksheet("Đội đăng ký", {
    views: [{ state: "frozen", ySplit: 1 }], // đóng băng hàng tiêu đề
  });

  teamSheet.columns = TEAM_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  styleHeader(teamSheet);

  teams.forEach((t) => {
    const row = teamSheet.addRow({
      team_code: t.team_code,
      team_name: t.team_name,
      event_title: t.event_title ?? "—",
      captain_name: t.captain_name,
      captain_student_id: t.captain_student_id,
      captain_email: t.captain_email,
      captain_phone: t.captain_phone,
      member_count: t.members.length,
      status: TEAM_STATUS_LABEL[t.status],
      created_at: toVietnamWallClock(t.created_at),
      note: t.note ?? "",
    });

    const fill = STATUS_FILL[t.status];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.alignment = { vertical: "middle" };
    });

    row.getCell("member_count").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("status").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("team_code").font = { bold: true };
  });

  applyBorders(teamSheet);
  teamSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, teams.length + 1), column: TEAM_COLUMNS.length },
  };

  // ================= Sheet 2: đội hình chi tiết =================
  const rosterSheet = workbook.addWorksheet("Đội hình", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  rosterSheet.columns = ROSTER_COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  styleHeader(rosterSheet);

  teams.forEach((t) => {
    const captain = captainOf(t.members);

    t.members.forEach((m, i) => {
      const row = rosterSheet.addRow({
        team_code: t.team_code,
        team_name: t.team_name,
        index: i + 1,
        full_name: m.full_name,
        student_id: m.student_id,
        phone: m.phone ?? "",
        height_cm: m.height_cm ?? null,
        position: POSITION_SHORT[m.position],
        role: m.id === captain?.id ? "Đội trưởng" : "Vận động viên",
        status: TEAM_STATUS_LABEL[t.status],
      });

      const fill = STATUS_FILL[t.status];
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
        cell.alignment = { vertical: "middle" };
      });

      // Dòng đầu mỗi đội đậm lên để nhìn ra ranh giới giữa các đội.
      if (i === 0) {
        row.getCell("team_code").font = { bold: true };
        row.getCell("team_name").font = { bold: true };
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: "medium", color: { argb: GROUP_HEADER } },
          };
        });
      }

      ["index", "height_cm", "position", "status"].forEach((key) => {
        row.getCell(key).alignment = { horizontal: "center", vertical: "middle" };
      });
      if (m.is_captain) row.getCell("role").font = { bold: true };
    });
  });

  applyBorders(rosterSheet);
  const rosterRows = teams.reduce((sum, t) => sum + t.members.length, 0);
  rosterSheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, rosterRows + 1), column: ROSTER_COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `doi-dang-ky-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
