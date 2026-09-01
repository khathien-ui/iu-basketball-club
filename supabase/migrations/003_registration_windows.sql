-- 003_registration_windows.sql
-- Đóng/mở form đăng ký theo đợt — CLB Bóng rổ IU
-- Phụ thuộc: 001_recruits.sql, 002_profiles.sql (dùng public.is_club_staff())
-- Chạy trong Supabase SQL Editor.

-- ============================================================
-- 1. ENUM & BẢNG
-- ============================================================
create type public.registration_type as enum ('tryout', 'tournament');

create table public.registration_windows (
  id             uuid                      primary key default gen_random_uuid(),
  type           public.registration_type  not null unique,
  is_open        boolean                   not null default false,
  title          text,
  opens_at       timestamptz,
  closes_at      timestamptz,
  closed_message text,
  updated_at     timestamptz               not null default now(),

  constraint registration_windows_period
    check (opens_at is null or closes_at is null or closes_at > opens_at)
);

comment on table  public.registration_windows                is 'Cấu hình đóng/mở từng đợt đăng ký';
comment on column public.registration_windows.type           is 'Mỗi loại chỉ có đúng một dòng cấu hình (unique)';
comment on column public.registration_windows.is_open        is 'Công tắc thủ công; vẫn bị closes_at ghi đè khi quá hạn';
comment on column public.registration_windows.closes_at      is 'Quá thời điểm này thì tự đóng dù is_open = true';
comment on column public.registration_windows.closed_message is 'Nội dung hiển thị cho người dùng khi đợt đang đóng';

-- Tự cập nhật updated_at mỗi lần sửa.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

create trigger registration_windows_touch
  before update on public.registration_windows
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. DỮ LIỆU KHỞI TẠO — mỗi loại một dòng, mặc định ĐÓNG
-- ============================================================
insert into public.registration_windows (type, is_open, title, closed_message)
values
  ('tryout', false, 'Tuyển quân mùa Thu 2026',
   'Đợt tuyển quân hiện chưa mở. Hãy theo dõi fanpage của CLB để nhận thông báo ngay khi có lịch tuyển quân mới.'),
  ('tournament', false, 'Giải 3x3 IU 2026',
   'Đăng ký giải đấu hiện chưa mở. Theo dõi fanpage của CLB để biết thời gian mở đăng ký đội.')
on conflict (type) do nothing;

-- ============================================================
-- 3. HÀM KIỂM TRA ĐỢT CÒN MỞ
-- ------------------------------------------------------------
-- Dùng chung cho cả policy RLS lẫn truy vấn từ app, để một chỗ duy nhất
-- định nghĩa thế nào là "đang mở".
-- ============================================================
create or replace function public.is_registration_open(p_type public.registration_type)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.registration_windows
    where type = p_type
      and is_open
      and (opens_at  is null or opens_at  <= now())
      and (closes_at is null or closes_at >  now())
  );
$fn$;

comment on function public.is_registration_open is
  'true nếu đợt đăng ký đang mở: bật thủ công VÀ nằm trong khoảng opens_at..closes_at';

grant execute on function public.is_registration_open(public.registration_type)
  to anon, authenticated;

-- ============================================================
-- 4. RLS CHO registration_windows
-- ============================================================
alter table public.registration_windows enable row level security;

grant select on public.registration_windows to anon, authenticated;
grant update on public.registration_windows to authenticated;

-- Ai cũng đọc được: trang /tryout cần biết đợt mở hay đóng.
create policy "Anyone can read registration windows"
  on public.registration_windows
  for select
  to anon, authenticated
  using (true);

-- Chỉ admin và executive_board chỉnh được.
create policy "Club staff can update registration windows"
  on public.registration_windows
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

-- Không mở INSERT/DELETE: hai dòng cấu hình đã seed sẵn ở mục 2.

-- ============================================================
-- 5. CHẶN NỘP ĐƠN KHI ĐỢT ĐÃ ĐÓNG  ⚠️ chặn ở tầng database
-- ------------------------------------------------------------
-- Đây mới là chốt chặn thật: ẩn form ở giao diện không ngăn được người
-- gọi thẳng REST API. Policy dưới khiến INSERT bị từ chối khi đợt đóng,
-- kể cả khi gọi trực tiếp bằng anon key.
-- ============================================================
drop policy if exists "Anyone can submit a recruit application" on public.recruits;

create policy "Anyone can submit while tryout window is open"
  on public.recruits
  for insert
  to anon, authenticated
  with check (public.is_registration_open('tryout'));

-- ============================================================
-- 6. MỞ ĐỢT TUYỂN QUÂN KHI SẴN SÀNG
-- ------------------------------------------------------------
-- Mặc định đang ĐÓNG. Mở bằng trang /dashboard/settings, hoặc chạy:
--
-- update public.registration_windows
--    set is_open = true, opens_at = now(), closes_at = '2026-10-31 23:59+07'
--  where type = 'tryout';
-- ============================================================
