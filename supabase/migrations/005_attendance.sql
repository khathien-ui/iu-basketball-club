-- 005_attendance.sql
-- Buổi tập & điểm danh bằng mã — CLB Bóng rổ IU
-- Phụ thuộc: 002_profiles.sql (dùng public.is_club_staff())
-- Chạy trong Supabase SQL Editor.

-- ============================================================
-- 1. ENUM
-- ============================================================
create type public.attendance_status as enum ('present', 'late', 'excused', 'absent');

-- ============================================================
-- 2. BẢNG BUỔI TẬP
-- ============================================================
create table public.training_sessions (
  id                uuid        primary key default gen_random_uuid(),
  title             text        not null,
  session_date      date        not null,
  start_time        time        not null,
  end_time          time,
  location          text,
  checkin_code      text        not null,
  checkin_opens_at  timestamptz,
  checkin_closes_at timestamptz,
  is_active         boolean     not null default true,
  created_by        uuid        references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  note              text,

  constraint training_sessions_title_not_blank
    check (length(btrim(title)) > 0),
  constraint training_sessions_code_format
    check (checkin_code ~ '^[0-9]{6}$'),
  constraint training_sessions_time_order
    check (end_time is null or end_time > start_time),
  constraint training_sessions_checkin_window
    check (
      checkin_opens_at is null
      or checkin_closes_at is null
      or checkin_closes_at > checkin_opens_at
    )
);

comment on table  public.training_sessions                   is 'Buổi tập của CLB, mỗi buổi có một mã điểm danh 6 chữ số';
comment on column public.training_sessions.checkin_code      is 'Mã 6 chữ số thành viên nhập để điểm danh';
comment on column public.training_sessions.checkin_opens_at  is 'Trước thời điểm này thì chưa cho điểm danh (NULL = không giới hạn)';
comment on column public.training_sessions.checkin_closes_at is 'Sau thời điểm này thì hết hạn điểm danh (NULL = không giới hạn)';
comment on column public.training_sessions.is_active         is 'false = buổi tập đã đóng, mã không dùng được nữa';

-- Mã phải là duy nhất trong số các buổi đang mở, nếu không việc tra cứu
-- theo mã sẽ mơ hồ. Buổi đã đóng thì cho phép dùng lại mã.
create unique index training_sessions_active_code_idx
  on public.training_sessions (checkin_code) where is_active;

create index training_sessions_date_idx
  on public.training_sessions (session_date desc, start_time desc);

-- ============================================================
-- 3. BẢNG ĐIỂM DANH
-- ============================================================
create table public.attendances (
  id            uuid                       primary key default gen_random_uuid(),
  session_id    uuid                       not null
                                           references public.training_sessions (id) on delete cascade,
  member_id     uuid                       not null
                                           references public.profiles (id) on delete cascade,
  checked_in_at timestamptz,
  status        public.attendance_status   not null default 'present',
  marked_by     uuid                       references public.profiles (id) on delete set null,
  note          text,
  created_at    timestamptz                not null default now(),

  -- Mỗi người chỉ có đúng một bản ghi cho mỗi buổi.
  constraint attendances_session_member_unique unique (session_id, member_id)
);

comment on table  public.attendances           is 'Bản ghi điểm danh của từng thành viên theo từng buổi tập';
comment on column public.attendances.marked_by is 'NULL = thành viên tự điểm danh bằng mã; có giá trị = ban điều hành điểm danh hộ';

create index attendances_member_idx  on public.attendances (member_id, created_at desc);
create index attendances_session_idx on public.attendances (session_id);

-- ============================================================
-- 4. RLS — BUỔI TẬP
-- ============================================================
alter table public.training_sessions enable row level security;

grant select on public.training_sessions to authenticated;
grant insert, update, delete on public.training_sessions to authenticated;

create policy "Members can read training sessions"
  on public.training_sessions
  for select
  to authenticated
  using (true);

create policy "Club staff can create training sessions"
  on public.training_sessions
  for insert
  to authenticated
  with check (public.is_club_staff());

create policy "Club staff can update training sessions"
  on public.training_sessions
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

create policy "Club staff can delete training sessions"
  on public.training_sessions
  for delete
  to authenticated
  using (public.is_club_staff());

-- ============================================================
-- 5. RLS — ĐIỂM DANH
-- ------------------------------------------------------------
-- CỐ Ý KHÔNG CÓ POLICY INSERT CHO THÀNH VIÊN THƯỜNG.
-- Thành viên chỉ điểm danh được qua hàm check_in_with_code() ở mục 6:
-- hàm đó SECURITY DEFINER nên bỏ qua RLS sau khi đã kiểm tra đủ điều kiện.
-- Nếu mở INSERT trực tiếp, ai cũng có thể tự tạo bản ghi "present" cho
-- bất kỳ buổi nào mà không cần biết mã.
-- ============================================================
alter table public.attendances enable row level security;

grant select on public.attendances to authenticated;
grant insert, update, delete on public.attendances to authenticated;

create policy "Members read own attendance, staff reads all"
  on public.attendances
  for select
  to authenticated
  using (member_id = auth.uid() or public.is_club_staff());

-- Chỉ ban điều hành được ghi thẳng (điểm danh hộ, đánh dấu vắng có phép).
create policy "Club staff can insert attendance"
  on public.attendances
  for insert
  to authenticated
  with check (public.is_club_staff());

create policy "Club staff can update attendance"
  on public.attendances
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

create policy "Club staff can delete attendance"
  on public.attendances
  for delete
  to authenticated
  using (public.is_club_staff());

-- ============================================================
-- 6. HÀM ĐIỂM DANH BẰNG MÃ
-- ------------------------------------------------------------
-- Toàn bộ nghiệp vụ nằm ở database, không tin vào phía client.
-- Trả jsonb với "code" là mã lỗi máy đọc được và "message" tiếng Việt
-- để hiện thẳng cho người dùng.
--
-- Các giá trị "code" có thể trả về:
--   ok                 — điểm danh thành công
--   not_authenticated  — chưa đăng nhập
--   no_profile         — không tìm thấy hồ sơ
--   locked             — tài khoản bị khoá
--   invalid_code       — mã sai định dạng / không tồn tại / buổi đã đóng
--   not_started        — chưa tới giờ điểm danh
--   expired            — đã quá hạn điểm danh
--   already_checked_in — đã điểm danh buổi này rồi
-- ============================================================
create or replace function public.check_in_with_code(code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid        uuid := auth.uid();
  v_now        timestamptz := now();
  v_code       text := regexp_replace(coalesce(code, ''), '\s', '', 'g');
  v_profile    record;
  v_session    record;
  v_start      timestamptz;
  v_status     public.attendance_status;
begin
  -- ---- Đăng nhập ----
  if v_uid is null then
    return jsonb_build_object(
      'success', false, 'code', 'not_authenticated',
      'message', 'Bạn cần đăng nhập để điểm danh.');
  end if;

  -- ---- Định dạng mã ----
  if v_code !~ '^[0-9]{6}$' then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_code',
      'message', 'Mã điểm danh phải gồm đúng 6 chữ số.');
  end if;

  -- ---- Hồ sơ người gọi ----
  select id, full_name, is_active
    into v_profile
    from public.profiles
   where id = v_uid;

  if not found then
    return jsonb_build_object(
      'success', false, 'code', 'no_profile',
      'message', 'Không tìm thấy hồ sơ thành viên của bạn. Vui lòng liên hệ ban điều hành.');
  end if;

  if not v_profile.is_active then
    return jsonb_build_object(
      'success', false, 'code', 'locked',
      'message', 'Tài khoản của bạn đang bị khoá nên không thể điểm danh. Vui lòng liên hệ ban điều hành.');
  end if;

  -- ---- Tìm buổi tập theo mã (chỉ buổi đang mở) ----
  select *
    into v_session
    from public.training_sessions
   where checkin_code = v_code
     and is_active
   limit 1;

  if not found then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_code',
      'message', 'Mã điểm danh không đúng hoặc buổi tập đã kết thúc.');
  end if;

  -- ---- Chưa tới giờ ----
  if v_session.checkin_opens_at is not null and v_now < v_session.checkin_opens_at then
    return jsonb_build_object(
      'success', false, 'code', 'not_started',
      'message', 'Chưa tới giờ điểm danh cho buổi tập này.',
      'session_title', v_session.title,
      'opens_at', v_session.checkin_opens_at);
  end if;

  -- ---- Hết giờ ----
  if v_session.checkin_closes_at is not null and v_now > v_session.checkin_closes_at then
    return jsonb_build_object(
      'success', false, 'code', 'expired',
      'message', 'Đã hết thời gian điểm danh cho buổi tập này.',
      'session_title', v_session.title,
      'closes_at', v_session.checkin_closes_at);
  end if;

  -- ---- Đã điểm danh chưa ----
  if exists (
    select 1 from public.attendances
     where session_id = v_session.id and member_id = v_uid
  ) then
    return jsonb_build_object(
      'success', false, 'code', 'already_checked_in',
      'message', 'Bạn đã điểm danh buổi tập này rồi.',
      'session_title', v_session.title);
  end if;

  -- ---- Tính present / late ----
  -- Giờ bắt đầu buổi tập được hiểu theo giờ Việt Nam; trong 15 phút đầu
  -- tính là có mặt, sau đó tính là đi trễ.
  v_start := (v_session.session_date + v_session.start_time) at time zone 'Asia/Ho_Chi_Minh';
  v_status := case
                when v_now <= v_start + interval '15 minutes' then 'present'
                else 'late'
              end;

  insert into public.attendances (session_id, member_id, checked_in_at, status, marked_by)
  values (v_session.id, v_uid, v_now, v_status, null);

  return jsonb_build_object(
    'success', true, 'code', 'ok',
    'message', case v_status
                 when 'present' then 'Điểm danh thành công. Bạn có mặt đúng giờ!'
                 else 'Điểm danh thành công, nhưng bạn đã đi trễ.'
               end,
    'status', v_status,
    'session_id', v_session.id,
    'session_title', v_session.title,
    'session_date', v_session.session_date,
    'start_time', v_session.start_time,
    'location', v_session.location,
    'checked_in_at', v_now);

exception
  -- Hai lần bấm gần như đồng thời: ràng buộc UNIQUE chặn bản ghi thứ hai.
  when unique_violation then
    return jsonb_build_object(
      'success', false, 'code', 'already_checked_in',
      'message', 'Bạn đã điểm danh buổi tập này rồi.');
end;
$fn$;

comment on function public.check_in_with_code is
  'Điểm danh bằng mã 6 chữ số; kiểm tra toàn bộ điều kiện ở database và trả jsonb {success, code, message}';

revoke execute on function public.check_in_with_code(text) from public, anon;
grant  execute on function public.check_in_with_code(text) to authenticated;

-- ============================================================
-- 7. SINH MÃ ĐIỂM DANH KHÔNG TRÙNG
-- ------------------------------------------------------------
-- Tiện cho màn hình tạo buổi tập: lấy mã 6 chữ số chưa dùng ở buổi nào
-- đang mở. Chỉ ban điều hành gọi được.
-- ============================================================
create or replace function public.generate_checkin_code()
returns text
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_code text;
  v_try  int := 0;
begin
  if not public.is_club_staff() then
    raise exception 'Chỉ ban điều hành được sinh mã điểm danh.'
      using errcode = '42501';
  end if;

  loop
    v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (
      select 1 from public.training_sessions
       where checkin_code = v_code and is_active
    );
    v_try := v_try + 1;
    if v_try > 50 then
      raise exception 'Không sinh được mã điểm danh mới, vui lòng thử lại.';
    end if;
  end loop;

  return v_code;
end;
$fn$;

revoke execute on function public.generate_checkin_code() from public, anon;
grant  execute on function public.generate_checkin_code() to authenticated;

-- ============================================================
-- 8. GHI CHÚ VẬN HÀNH
-- ------------------------------------------------------------
-- Tạo một buổi tập mẫu:
--
-- insert into public.training_sessions
--   (title, session_date, start_time, end_time, location, checkin_code,
--    checkin_opens_at, checkin_closes_at, created_by)
-- values
--   ('Tập luyện thứ Ba', current_date, '18:00', '20:00', 'Nhà thi đấu IU',
--    public.generate_checkin_code(),
--    current_date + time '17:45' at time zone 'Asia/Ho_Chi_Minh',
--    current_date + time '19:00' at time zone 'Asia/Ho_Chi_Minh',
--    auth.uid());
--
-- Thành viên điểm danh:
--   select public.check_in_with_code('123456');
-- ============================================================
