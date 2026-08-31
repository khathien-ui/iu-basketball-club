-- 002_profiles.sql
-- Bảng hồ sơ thành viên + phân quyền — CLB Bóng rổ IU
-- Phụ thuộc: 001_recruits.sql (dùng lại enum public.recruit_position)
-- Chạy trong Supabase SQL Editor.

-- ============================================================
-- 1. ENUM VAI TRÒ
-- ============================================================
create type public.user_role as enum ('admin', 'executive_board', 'member');

-- ============================================================
-- 2. BẢNG PROFILES
-- ============================================================
create table public.profiles (
  id           uuid                     primary key
                                        references auth.users (id) on delete cascade,
  full_name    text,
  student_id   text                     unique,
  email        text,
  phone        text,
  role         public.user_role         not null default 'member',
  position     public.recruit_position  not null default 'unknown',
  height_cm    smallint,
  joined_year  smallint,
  avatar_url   text,
  is_active    boolean                  not null default true,
  created_at   timestamptz              not null default now(),

  constraint profiles_height_range
    check (height_cm is null or height_cm between 100 and 250),
  constraint profiles_joined_year_range
    check (joined_year is null or joined_year between 2000 and 2100)
);

comment on table  public.profiles            is 'Hồ sơ thành viên CLB, quan hệ 1-1 với auth.users';
comment on column public.profiles.student_id is 'MSSV — unique nhưng cho phép NULL vì hồ sơ tạo tự động lúc đăng ký, sinh viên điền sau';
comment on column public.profiles.role       is 'admin | executive_board | member (mặc định member)';
comment on column public.profiles.is_active  is 'false = đã rời CLB, giữ lịch sử thay vì xoá';

create index profiles_role_idx      on public.profiles (role);
create index profiles_is_active_idx on public.profiles (is_active);

-- ============================================================
-- 3. TRIGGER: tự tạo profile khi có user mới trong auth.users
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. HELPER FUNCTIONS — chống đệ quy vô hạn trong RLS
-- ------------------------------------------------------------
-- Policy trên profiles mà truy vấn thẳng profiles để lấy role sẽ gây lỗi
-- "infinite recursion detected in policy for relation profiles".
-- Hàm SECURITY DEFINER chạy dưới quyền owner (postgres) nên bỏ qua RLS,
-- cắt được vòng lặp.
-- ============================================================
create or replace function public.is_club_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'executive_board')
      and is_active
  );
$fn$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active
  );
$fn$;

comment on function public.is_club_staff is 'true nếu user hiện tại là admin hoặc executive_board đang hoạt động';
comment on function public.is_admin      is 'true nếu user hiện tại là admin đang hoạt động';

revoke execute on function public.is_club_staff() from public, anon;
revoke execute on function public.is_admin()      from public, anon;
grant  execute on function public.is_club_staff() to authenticated;
grant  execute on function public.is_admin()      to authenticated;

-- ============================================================
-- 5. TRIGGER: giới hạn cột mà member được tự sửa
-- ------------------------------------------------------------
-- RLS chỉ chặn được theo DÒNG, không chặn theo CỘT. Member chỉ được sửa
-- phone + avatar_url của chính mình, nên phải chặn bằng trigger.
-- ============================================================
create or replace function public.enforce_profile_update_rules()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  -- auth.uid() IS NULL = ngữ cảnh server (service_role / SQL Editor) → cho qua.
  -- Staff (admin, executive_board) sửa được mọi trường.
  if auth.uid() is null or public.is_club_staff() then
    return new;
  end if;

  if new.id          is distinct from old.id
  or new.full_name   is distinct from old.full_name
  or new.student_id  is distinct from old.student_id
  or new.email       is distinct from old.email
  or new.role        is distinct from old.role
  or new.position    is distinct from old.position
  or new.height_cm   is distinct from old.height_cm
  or new.joined_year is distinct from old.joined_year
  or new.is_active   is distinct from old.is_active
  or new.created_at  is distinct from old.created_at
  then
    raise exception 'Bạn chỉ được cập nhật số điện thoại và ảnh đại diện của mình.'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

drop trigger if exists profiles_enforce_update_rules on public.profiles;
create trigger profiles_enforce_update_rules
  before update on public.profiles
  for each row execute function public.enforce_profile_update_rules();

-- ============================================================
-- 6. RLS CHO PROFILES
-- ============================================================
alter table public.profiles enable row level security;

grant select, update on public.profiles to authenticated;

-- Đọc: hồ sơ của chính mình, hoặc staff đọc tất cả.
create policy "Read own profile or staff reads all"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_club_staff());

-- Sửa: chính mình (bị giới hạn cột bởi trigger mục 5), hoặc staff sửa tất cả.
create policy "Update own profile or staff updates all"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_club_staff())
  with check (id = auth.uid() or public.is_club_staff());

-- Không mở INSERT/DELETE cho client: hồ sơ do trigger tạo tự động,
-- và xoá theo cascade khi auth.users bị xoá.

-- ============================================================
-- 7. SIẾT LẠI POLICY BẢNG RECRUITS
--    (việc bảo mật bắt buộc đã ghi trong ROADMAP, Giai đoạn 3)
-- ------------------------------------------------------------
-- Trước: MỌI authenticated user đọc/sửa được toàn bộ đơn tuyển quân
--        — dữ liệu chứa email, SĐT, MSSV của sinh viên.
-- Sau:   chỉ admin và executive_board.
-- ============================================================
drop policy if exists "Authenticated users can read applications"   on public.recruits;
drop policy if exists "Authenticated users can update applications" on public.recruits;

create policy "Club staff can read applications"
  on public.recruits
  for select
  to authenticated
  using (public.is_club_staff());

create policy "Club staff can update applications"
  on public.recruits
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

-- Giữ nguyên policy INSERT cho anon: form /tryout công khai vẫn nộp đơn được.

-- ============================================================
-- 8. SAU KHI CHẠY XONG: tự nâng quyền cho tài khoản admin đầu tiên
-- ------------------------------------------------------------
-- Đăng ký một tài khoản qua Supabase Auth trước, rồi chạy dòng dưới
-- (bỏ comment và thay email) trong SQL Editor:
--
-- update public.profiles set role = 'admin' where email = 'email-cua-ban@example.com';
-- ============================================================
