import { ROLE_LABEL, type Profile } from "./members";
import {
  formatEventDate,
  formatEventTime,
  formatJoinedAt,
  PARTICIPANT_LABEL,
  type ClubEventRow,
  type EventParticipant,
  type ParticipantStatus,
} from "./events";

const ACCENT = "FFFF5C1A";
const BORDER_COLOR = "FFD8D8D8";

const STATUS_FILL: Record<ParticipantStatus, string> = {
  going: "FFE3F5E9",
  maybe: "FFFFF3DF",
  cancelled: "FFFBE6E7",
};

interface ColumnSpec {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

const COLUMNS: ColumnSpec[] = [
  { header: "Họ và tên", key: "name", width: 26 },
  { header: "MSSV", key: "student_id", width: 16, numFmt: "@" },
  { header: "Email", key: "email", width: 30 },
  { header: "Số điện thoại", key: "phone", width: 16, numFmt: "@" },
  { header: "Vai trò", key: "role", width: 18 },
  { header: "Trạng thái", key: "status", width: 14 },
  { header: "Thời điểm đăng ký", key: "joined_at", width: 20 },
];

export interface ParticipantRow {
  participant: EventParticipant;
  member: Profile | null;
}

export async function exportParticipantsToExcel(
  event: ClubEventRow,
  rows: ParticipantRow[]
): Promise<void> {
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IU Basketball Club";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Người tham gia", {
    views: [{ state: "frozen", ySplit: 3 }],
  });

  sheet.columns = COLUMNS.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.numFmt ? { numFmt: c.numFmt } : undefined,
  }));

  // Hai dòng tiêu đề mô tả sự kiện, chèn lên trên hàng tiêu đề cột.
  const when = [
    formatEventDate(event.event_date),
    formatEventTime(event.start_time, event.end_time),
    event.location ?? "",
  ].filter(Boolean).join(" · ");

  sheet.spliceRows(1, 0, [`Danh sách tham gia — ${event.title}`], [when]);
  sheet.mergeCells(1, 1, 1, COLUMNS.length);
  sheet.mergeCells(2, 1, 2, COLUMNS.length);

  const titleRow = sheet.getRow(1);
  titleRow.height = 26;
  titleRow.getCell(1).font = { bold: true, size: 13 };
  titleRow.getCell(1).alignment = { vertical: "middle" };
  sheet.getRow(2).getCell(1).font = { size: 11, color: { argb: "FF666666" } };

  const headerRow = sheet.getRow(3);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });

  rows.forEach(({ participant, member }) => {
    const row = sheet.addRow({
      name: member?.full_name ?? "(không rõ)",
      student_id: member?.student_id ?? "",
      email: member?.email ?? "",
      phone: member?.phone ?? "",
      role: member ? ROLE_LABEL[member.role] : "",
      status: PARTICIPANT_LABEL[participant.status],
      joined_at: formatJoinedAt(participant.joined_at),
    });

    const fill = STATUS_FILL[participant.status];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      cell.alignment = { vertical: "middle" };
    });
    row.getCell("status").alignment = { horizontal: "center", vertical: "middle" };
  });

  const thin = { style: "thin" as const, color: { argb: BORDER_COLOR } };
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 3) return;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: thin, left: thin, bottom: thin, right: thin };
    });
  });

  sheet.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: Math.max(3, rows.length + 3), column: COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nguoi-tham-gia-${event.slug}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
