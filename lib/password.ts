export const MIN_PASSWORD_LENGTH = 8;

/**
 * Quy tắc mật khẩu mới, dùng chung cho màn hình đổi mật khẩu bắt buộc
 * và màn hình đổi mật khẩu trong hồ sơ. Trả null nếu hợp lệ.
 */
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Mật khẩu phải có cả chữ hoa, chữ thường và số.";
  }
  if (password !== confirm) {
    return "Hai lần nhập mật khẩu không khớp.";
  }
  return null;
}

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // bỏ I, O cho dễ đọc
const LOWER = "abcdefghijkmnopqrstuvwxyz"; // bỏ l
const DIGITS = "23456789"; // bỏ 0, 1

/** Số ngẫu nhiên an toàn, chạy được cả trên Node lẫn trình duyệt. */
function randomInt(max: number): number {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto) : undefined;

  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    // Loại bỏ phần dư để phân phối đều, tránh modulo bias.
    const limit = Math.floor(0xffffffff / max) * max;
    let v: number;
    do {
      cryptoObj.getRandomValues(buf);
      v = buf[0];
    } while (v >= limit);
    return v % max;
  }
  return Math.floor(Math.random() * max);
}

function pick(chars: string): string {
  return chars[randomInt(chars.length)];
}

/**
 * Mật khẩu tạm 12 ký tự, đảm bảo có ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số.
 * Bỏ các ký tự dễ nhầm (I/l/1, O/0) vì admin thường phải đọc lại cho thành viên.
 */
export function generateTempPassword(length = 12): string {
  const all = UPPER + LOWER + DIGITS;
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS)];
  const rest = Array.from({ length: length - required.length }, () => pick(all));
  const chars = [...required, ...rest];

  // Fisher-Yates để vị trí ký tự bắt buộc không cố định.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
