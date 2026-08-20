export interface BoardMember {
  role: string;
  desc: string;
}

/** Thành viên ban điều hành — section Executive Board */
export const board: BoardMember[] = [
  { role: "President", desc: "Định hướng CLB & đối ngoại" },
  { role: "Vice President", desc: "Vận hành & hậu cần" },
  { role: "Head Coach", desc: "Huấn luyện & tuyển chọn đội hình" },
  { role: "Media Lead", desc: "Nội dung & truyền thông" },
];
