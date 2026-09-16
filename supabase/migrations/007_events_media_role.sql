-- 007_events_media_role.sql
-- Chuyển quyền quản lý bảng events từ is_club_staff() sang is_media_manager()
-- Phụ thuộc: 006_content.sql (bảng public.events, hàm public.is_media_manager())
--
-- IDEMPOTENT: chỉ gồm DROP POLICY IF EXISTS + CREATE POLICY, chạy lại bao
-- nhiêu lần cũng cho ra cùng một kết quả.
--
-- Sau migration này:
--   events INSERT/UPDATE/DELETE  -> admin, executive_board, media
--   events SELECT công khai      -> giữ nguyên: ai cũng đọc được sự kiện đã đăng
--
-- Chạy trong Supabase SQL Editor.


-- ============================================================
-- 1. DỌN POLICY CŨ
-- ------------------------------------------------------------
-- Xoá cả hai cách đặt tên đã từng dùng cho ba policy ghi của bảng events,
-- để migration chạy đúng dù database đang ở phiên bản 006 nào.
-- ============================================================
drop policy if exists "Club staff insert events"        on public.events;
drop policy if exists "Club staff update events"        on public.events;
drop policy if exists "Club staff delete events"        on public.events;

drop policy if exists "Club staff manage events insert" on public.events;
drop policy if exists "Club staff manage events update" on public.events;
drop policy if exists "Club staff manage events delete" on public.events;


-- ============================================================
-- 2. POLICY GHI MỚI — is_media_manager()
-- ------------------------------------------------------------
-- is_media_manager() nhận admin, executive_board VÀ media.
-- ============================================================
drop policy if exists "Media managers insert events" on public.events;
create policy "Media managers insert events"
  on public.events for insert to authenticated
  with check (public.is_media_manager());

drop policy if exists "Media managers update events" on public.events;
create policy "Media managers update events"
  on public.events for update to authenticated
  using (public.is_media_manager())
  with check (public.is_media_manager());

drop policy if exists "Media managers delete events" on public.events;
create policy "Media managers delete events"
  on public.events for delete to authenticated
  using (public.is_media_manager());


-- ============================================================
-- 3. POLICY SELECT — mở phần bản nháp cho media
-- ------------------------------------------------------------
-- BẮT BUỘC đi kèm mục 2. Sự kiện mới tạo mặc định is_published = false;
-- nếu SELECT vẫn là "is_published or is_club_staff()" thì người có role
-- media tạo xong sẽ KHÔNG đọc lại được sự kiện của chính mình để sửa
-- hoặc đăng — tính năng coi như hỏng.
--
-- Thay đổi này chỉ THÊM quyền cho media, không ai bị mất quyền:
--   is_media_manager() = is_club_staff() + media
-- Phần công khai giữ nguyên tuyệt đối: ai cũng đọc được sự kiện đã đăng,
-- kể cả khách chưa đăng nhập.
-- ============================================================
drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select to anon, authenticated
  using (is_published or public.is_media_manager());


-- ============================================================
-- 4. KIỂM TRA SAU KHI CHẠY
-- ------------------------------------------------------------
-- Xem lại toàn bộ policy của bảng events:
--
--   select policyname, cmd, roles, qual, with_check
--     from pg_policies
--    where schemaname = 'public' and tablename = 'events'
--    order by cmd, policyname;
--
-- Kết quả mong đợi — 4 policy:
--   SELECT  "Published events are public"   {anon,authenticated}
--   INSERT  "Media managers insert events"  {authenticated}
--   UPDATE  "Media managers update events"  {authenticated}
--   DELETE  "Media managers delete events"  {authenticated}
--
-- Ranh giới quyền của role 'media' sau migration này:
--   CÓ    — events, posts, albums, photos, bucket storage 'media'
--   KHÔNG — recruits, profiles, registration_windows,
--           training_sessions, attendances
-- ============================================================
