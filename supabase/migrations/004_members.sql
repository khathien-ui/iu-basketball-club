-- 004_members.sql
-- Quản lý thành viên: đổi mật khẩu lần đầu, khoá tài khoản, ảnh đại diện, kết nạp từ đơn
-- Phụ thuộc: 001_recruits.sql, 002_profiles.sql, 003_registration_windows.sql
-- Chạy trong Supabase SQL Editor.

-- ============================================================
-- 1. CỘT MỚI
-- ============================================================
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

comment on column public.profiles.must_change_password is
  'true = tài khoản đang dùng mật khẩu tạm, bắt buộc đổi trước khi dùng hệ thống';

-- Đánh dấu đơn đã được kết nạp thành thành viên.
alter table public.recruits
  add column if not exists enrolled_at         timestamptz,
  add column if not exists enrolled_profile_id uuid references public.profiles (id) on delete set null;

comment on column public.recruits.enrolled_at is
  'Thời điểm đơn được kết nạp thành thành viên; khác NULL thì ẩn nút Kết nạp';

create index if not exists profiles_must_change_password_idx
  on public.profiles (must_change_password) where must_change_password;

-- ============================================================
-- 2. CHO PHÉP TỰ TẮT CỜ ĐỔI MẬT KHẨU
-- ------------------------------------------------------------
-- Trigger ở migration 002 chỉ cho member tự sửa phone + avatar_url.
-- must_change_password vẫn phải nằm ngoài danh sách đó (nếu không member
-- có thể tự tắt mà không đổi mật khẩu), nên dùng RPC security definer:
-- chỉ gọi được sau khi đã đổi mật khẩu thành công.
-- ============================================================
create or replace function public.mark_password_changed()
returns void
language sql
security definer
set search_path = public
as $fn$
  update public.profiles
     set must_change_password = false
   where id = auth.uid();
$fn$;

comment on function public.mark_password_changed is
  'Tắt cờ must_change_password cho chính user đang đăng nhập';

revoke execute on function public.mark_password_changed() from public, anon;
grant  execute on function public.mark_password_changed() to authenticated;

-- ============================================================
-- 3. BẢO VỆ: KHÔNG TỰ KHOÁ MÌNH, KHÔNG HẠ ADMIN CUỐI CÙNG
-- ============================================================
create or replace function public.protect_admin_and_self()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  remaining_admins int;
begin
  -- Không cho tự khoá tài khoản của chính mình.
  if auth.uid() is not null
     and new.id = auth.uid()
     and old.is_active
     and not new.is_active then
    raise exception 'Bạn không thể tự khoá tài khoản của chính mình.'
      using errcode = '42501';
  end if;

  -- Không cho hạ vai trò hoặc khoá admin cuối cùng còn hoạt động.
  if old.role = 'admin'
     and (new.role <> 'admin' or (old.is_active and not new.is_active)) then
    select count(*) into remaining_admins
      from public.profiles
     where role = 'admin' and is_active and id <> old.id;

    if remaining_admins = 0 then
      raise exception 'Không thể hạ quyền hoặc khoá admin cuối cùng của hệ thống.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$fn$;

drop trigger if exists profiles_protect_admin_and_self on public.profiles;
create trigger profiles_protect_admin_and_self
  before update on public.profiles
  for each row execute function public.protect_admin_and_self();

-- ============================================================
-- 4. STORAGE: BUCKET ẢNH ĐẠI DIỆN
-- ------------------------------------------------------------
-- public = true để <img> hiển thị được không cần signed URL.
-- Giới hạn 5MB và chỉ nhận jpg/png/webp ngay ở tầng storage.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Quy ước đường dẫn: avatars/{user_id}/{tên file}
drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar or staff uploads any" on storage.objects;
create policy "Users upload own avatar or staff uploads any"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_club_staff()
    )
  );

drop policy if exists "Users update own avatar or staff updates any" on storage.objects;
create policy "Users update own avatar or staff updates any"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_club_staff()
    )
  );

drop policy if exists "Users delete own avatar or staff deletes any" on storage.objects;
create policy "Users delete own avatar or staff deletes any"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_club_staff()
    )
  );

-- ============================================================
-- 5. GHI CHÚ VẬN HÀNH
-- ------------------------------------------------------------
-- Tài khoản thành viên được tạo qua Supabase Admin API trong API route
-- /api/members (dùng SUPABASE_SERVICE_ROLE_KEY phía server, không bao giờ
-- lộ ra client). Service role bỏ qua RLS nên không cần policy INSERT ở đây.
--
-- Nếu chưa có admin nào, nâng quyền thủ công:
--   update public.profiles set role = 'admin' where email = 'email-cua-ban@example.com';
-- ============================================================
