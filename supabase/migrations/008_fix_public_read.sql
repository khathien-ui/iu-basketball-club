-- 008_fix_public_read.sql
-- SỬA LỖI: khách chưa đăng nhập không đọc được events / posts / albums / photos
-- Phụ thuộc: 006_content.sql, 007_events_media_role.sql
--
-- IDEMPOTENT: chỉ gồm GRANT, chạy lại nhiều lần không lỗi.
-- Chạy trong Supabase SQL Editor.
--
-- ============================================================
-- TRIỆU CHỨNG
-- ------------------------------------------------------------
-- Gọi REST API bằng anon key:
--   GET /rest/v1/events?select=slug
-- trả về:
--   {"code":"42501","message":"permission denied for function is_media_manager"}
--
-- NGUYÊN NHÂN
-- ------------------------------------------------------------
-- Policy SELECT công khai có dạng:
--   using (is_published or public.is_media_manager())
-- Khi dòng chưa xuất bản, Postgres buộc phải tính vế thứ hai, tức là GỌI
-- hàm is_media_manager(). Nhưng migration 006 lại thu hồi quyền chạy hàm đó
-- của anon:
--   revoke execute on function public.is_media_manager() from public, anon;
-- Thiếu quyền EXECUTE nên cả truy vấn bị từ chối — kể cả những dòng đã
-- xuất bản đáng lẽ ai cũng đọc được.
--
-- CÁCH SỬA
-- ------------------------------------------------------------
-- Cấp quyền EXECUTE cho anon. An toàn: hàm là SECURITY DEFINER nhưng chỉ
-- trả lời "người đang gọi có phải quản trị nội dung không". Với anon thì
-- auth.uid() là NULL nên luôn trả false — không lộ bất kỳ dữ liệu nào.
-- ============================================================

grant execute on function public.is_media_manager() to anon;

-- is_club_staff() cũng bị thu hồi khỏi anon ở migration 002. Hiện không có
-- policy nào cho anon dùng tới nó, nhưng bản gốc mục 6.1 của migration 006
-- có dùng; cấp luôn để chạy lại 006 mà không dựng lại lỗi tương tự.
grant execute on function public.is_club_staff() to anon;

-- album_is_published() đã được cấp cho anon ở 006, cấp lại cho chắc.
grant execute on function public.album_is_published(uuid) to anon;


-- ============================================================
-- KIỂM TRA SAU KHI CHẠY
-- ------------------------------------------------------------
-- 1) Xem quyền EXECUTE hiện tại:
--
--    select p.proname,
--           has_function_privilege('anon',          p.oid, 'execute') as anon_ok,
--           has_function_privilege('authenticated', p.oid, 'execute') as auth_ok
--      from pg_proc p
--      join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public'
--       and p.proname in ('is_media_manager', 'is_club_staff', 'album_is_published')
--     order by p.proname;
--
--    Cả ba hàm phải có anon_ok = true.
--
-- 2) Gọi lại REST API bằng anon key — phải trả mảng JSON, không còn 42501:
--
--    GET /rest/v1/events?select=slug,is_published
--
--    Kết quả chỉ gồm các dòng is_published = true, đúng như thiết kế.
-- ============================================================
