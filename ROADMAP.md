# ROADMAP — IU Basketball Club Website

## Giai đoạn 1 — Prototype design ✅ (08/2026)

- Prototype tĩnh HTML/CSS/JS theo design tham chiếu resend.com.
- Chốt design system: nền tối, accent cam `#ff5c1a`, logo emblem, scroll animation.

## Giai đoạn 2 — Migrate Next.js ✅ (08/2026)

- Next.js 14 App Router + TypeScript, tách 11 component, `lang="vi"`.
- Push GitHub (`khathien-ui/iu-basketball-club`).

## Giai đoạn 3 — Data layer ✅ (08/2026)

- Tách nội dung động ra `data/*.ts` (events, board, news, testimonials).
- Chuẩn bị điểm nối để thay bằng Supabase query sau này.

## Giai đoạn 4 — Supabase & thành viên

- Kết nối Supabase (Postgres + Auth + Storage), RLS cho mọi bảng.
- Đăng ký/đăng nhập, hồ sơ thành viên, phân quyền (admin / executive_board / member / guest).
- Bật lại nút Member Login. Trang Members (public một phần, đầy đủ khi đăng nhập).

## Giai đoạn 5 — Sự kiện, tin tức & media

- CRUD sự kiện + form đăng ký tuyển quân/giải đấu (`/events/[slug]/register`), duyệt đơn.
- Tin tức và gallery quản lý qua dashboard, ảnh lưu Supabase Storage.
- Deploy Vercel + domain chính thức.

## Giai đoạn 6 — Tính năng nâng cao

### Match Center

Cấu trúc 3 cấp:

1. `/matches` — danh sách giải đấu, mới nhất trước.
2. `/matches/[giải]` — các trận trong giải, nhóm theo vòng đấu: Group / Semi / Final.
3. `/matches/[trận]` — tỉ số, recap do AI viết, album ảnh, MVP kèm ảnh upload riêng.

Database:

- `tournaments` — thông tin giải đấu.
- `matches` — có cột `stage` (vòng đấu) và `mvp_member_id` liên kết `members`.
- `match_media` — album ảnh/media của trận.

Dashboard admin: nhập kết quả **một lần** → AI sinh recap + hình scoreboard + caption FB/Insta để copy.

Hỗ trợ cả **trận giao hữu** không thuộc giải nào (match không bắt buộc gắn tournament).
