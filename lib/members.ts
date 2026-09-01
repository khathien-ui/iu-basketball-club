import type { RecruitPosition } from "./recruits";

export type UserRole = "admin" | "executive_board" | "member";

export const STAFF_ROLES: UserRole[] = ["admin", "executive_board"];

export interface Profile {
  id: string;
  full_name: string | null;
  student_id: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  position: RecruitPosition;
  height_cm: number | null;
  joined_year: number | null;
  avatar_url: string | null;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Quản trị viên",
  executive_board: "Ban điều hành",
  member: "Thành viên",
};

export const ROLE_ORDER: UserRole[] = ["admin", "executive_board", "member"];

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role as UserRole);
}

export function initialsOf(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  return source.charAt(0).toUpperCase();
}
