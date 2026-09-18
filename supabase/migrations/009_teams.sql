-- 009_teams.sql
-- Đăng ký đội thi đấu giải 3x3 — CLB Bóng rổ IU
-- Phụ thuộc:
--   002_profiles.sql  (public.is_club_staff(), enum public.user_role)
--   003_registration_windows.sql (public.is_registration_open())
--   006_content.sql   (bảng public.events)
--   001_recruits.sql  (enum public.recruit_position)
--
-- IDEMPOTENT: chạy lại nhiều lần không lỗi.
--
-- THỨ TỰ BẮT BUỘC (mọi tham chiếu chỉ xuất hiện sau khi đối tượng đã tạo):
--   1. Enum
--   2. Bảng: teams -> team_members
--   3. Index (gồm ràng buộc trùng tên đội / trùng MSSV trong đội)
--   4. RLS + policy
--   5. Hàm đăng ký đội (truy vấn bảng nên phải nằm sau mục 2)
--
-- Chạy trong Supabase SQL Editor.


-- ============================================================
-- 1. ENUM
-- ============================================================
do $$ begin
  create type public.team_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 2. BẢNG
-- ============================================================
create table if not exists public.teams (
  id                  uuid                primary key default gen_random_uuid(),
  tournament_event_id uuid                references public.events (id) on delete set null,
  team_name           text                not null,
  team_code           text                not null unique,
  captain_name        text                not null,
  captain_student_id  text                not null,
  captain_email       text                not null,
  captain_phone       text                not null,
  status              public.team_status  not null default 'pending',
  note                text,
  reviewed_at         timestamptz,
  reviewed_by         uuid                references public.profiles (id) on delete set null,
  created_at          timestamptz         not null default now(),

  constraint teams_name_not_blank
    check (length(btrim(team_name)) between 2 and 60),
  constraint teams_code_format
    check (team_code ~ '^IU3X3-[A-Z0-9]{5}$'),
  constraint teams_captain_name_not_blank
    check (length(btrim(captain_name)) > 0),
  constraint teams_captain_student_id_not_blank
    check (length(btrim(captain_student_id)) > 0),
  constraint teams_captain_email_format
    check (captain_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint teams_captain_phone_format
    check (captain_phone ~ '^[0-9]{10}$')
);

comment on table  public.teams                     is 'Đội đăng ký thi đấu giải 3x3';
comment on column public.teams.tournament_event_id is 'Giải đấu cụ thể trong bảng events (NULL = chưa gắn giải nào)';
comment on column public.teams.team_code           is 'Mã đội hiển thị cho người đăng ký, dùng để tra cứu';
comment on column public.teams.status              is 'pending = chờ duyệt, approved = được nhận, rejected = từ chối';

create table if not exists public.team_members (
  id         uuid                     primary key default gen_random_uuid(),
  team_id    uuid                     not null references public.teams (id) on delete cascade,
  full_name  text                     not null,
  student_id text                     not null,
  phone      text,
  height_cm  int,
  position   public.recruit_position  not null default 'unknown',
  is_captain boolean                  not null default false,
  sort_order int                      not null default 0,
  created_at timestamptz              not null default now(),

  constraint team_members_full_name_not_blank
    check (length(btrim(full_name)) > 0),
  constraint team_members_student_id_not_blank
    check (length(btrim(student_id)) > 0),
  constraint team_members_phone_format
    check (phone is null or phone ~ '^[0-9]{10}$'),
  constraint team_members_height_range
    check (height_cm is null or height_cm between 100 and 250)
);

comment on table  public.team_members            is 'Danh sách vận động viên của một đội (3–5 người)';
comment on column public.team_members.is_captain is 'true cho đúng một người: đội trưởng của đội';
comment on column public.team_members.sort_order is 'Thứ tự hiển thị trong danh sách đội hình';


-- ============================================================
-- 3. INDEX & RÀNG BUỘC TRÙNG LẶP
-- ------------------------------------------------------------
-- Tên đội không được trùng trong cùng một giải. Postgres coi các giá trị
-- NULL là khác nhau trong unique index, nên phải tách hai index: một cho
-- đội đã gắn giải, một cho đội chưa gắn giải nào.
-- ============================================================
create unique index if not exists teams_name_per_event_idx
  on public.teams (tournament_event_id, lower(btrim(team_name)))
  where tournament_event_id is not null;

create unique index if not exists teams_name_no_event_idx
  on public.teams (lower(btrim(team_name)))
  where tournament_event_id is null;

create index if not exists teams_event_idx
  on public.teams (tournament_event_id, created_at desc);

create index if not exists teams_status_idx
  on public.teams (status, created_at desc);

-- Một MSSV chỉ xuất hiện một lần trong cùng một đội.
create unique index if not exists team_members_unique_in_team_idx
  on public.team_members (team_id, upper(btrim(student_id)));

create index if not exists team_members_team_idx
  on public.team_members (team_id, sort_order);

create index if not exists team_members_student_idx
  on public.team_members (upper(btrim(student_id)));

-- Mỗi đội chỉ có đúng một đội trưởng.
create unique index if not exists team_members_one_captain_idx
  on public.team_members (team_id) where is_captain;


-- ============================================================
-- 4. RLS
-- ------------------------------------------------------------
-- ⚠️ KHÔNG mở INSERT trực tiếp cho anon/authenticated. Đăng ký đội bắt buộc
-- đi qua hàm public.register_team() ở mục 5 — hàm đó SECURITY DEFINER nên
-- bỏ qua RLS sau khi đã kiểm tra đủ: đợt còn mở, tên đội chưa dùng, MSSV
-- không trùng nhau và không trùng đội khác trong cùng giải.
-- Nếu mở INSERT thẳng, người gọi REST API có thể tạo đội thiếu thành viên
-- hoặc lách mọi kiểm tra trên.
-- ============================================================
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;

grant select on public.teams        to authenticated;
grant select on public.team_members to authenticated;
grant update, delete on public.teams        to authenticated;
grant update, delete on public.team_members to authenticated;

-- ---- teams ----
drop policy if exists "Club staff can read teams" on public.teams;
create policy "Club staff can read teams"
  on public.teams
  for select
  to authenticated
  using (public.is_club_staff());

drop policy if exists "Club staff can update teams" on public.teams;
create policy "Club staff can update teams"
  on public.teams
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

drop policy if exists "Club staff can delete teams" on public.teams;
create policy "Club staff can delete teams"
  on public.teams
  for delete
  to authenticated
  using (public.is_club_staff());

-- ---- team_members ----
drop policy if exists "Club staff can read team members" on public.team_members;
create policy "Club staff can read team members"
  on public.team_members
  for select
  to authenticated
  using (public.is_club_staff());

drop policy if exists "Club staff can update team members" on public.team_members;
create policy "Club staff can update team members"
  on public.team_members
  for update
  to authenticated
  using (public.is_club_staff())
  with check (public.is_club_staff());

drop policy if exists "Club staff can delete team members" on public.team_members;
create policy "Club staff can delete team members"
  on public.team_members
  for delete
  to authenticated
  using (public.is_club_staff());


-- ============================================================
-- 5. HÀM ĐĂNG KÝ ĐỘI
-- ------------------------------------------------------------
-- Toàn bộ nghiệp vụ nằm ở database, không tin vào phía client. Cả đội và
-- danh sách thành viên được ghi trong cùng một transaction: sai một chỗ là
-- không có gì được lưu.
--
-- p_members là mảng jsonb, mỗi phần tử:
--   { "full_name", "student_id", "phone", "height_cm", "position", "is_captain" }
--
-- Các giá trị "code" có thể trả về:
--   ok                  — đăng ký thành công, kèm team_code
--   closed              — đợt đăng ký giải đấu đang đóng
--   invalid_team_name   — tên đội trống hoặc quá dài
--   invalid_captain     — thiếu thông tin đội trưởng / sai định dạng
--   invalid_event       — giải đấu không tồn tại hoặc chưa đăng
--   member_count        — số thành viên không nằm trong khoảng 3–5
--   invalid_member      — một dòng thành viên thiếu tên hoặc MSSV
--   duplicate_in_team   — MSSV bị lặp trong chính đội này
--   duplicate_in_event  — MSSV đã nằm trong một đội khác của cùng giải
--   team_name_taken     — tên đội đã có người dùng trong cùng giải
--   no_captain          — không đánh dấu được đội trưởng trong danh sách
-- ============================================================
create or replace function public.register_team(
  p_event_id           uuid,
  p_team_name          text,
  p_captain_name       text,
  p_captain_student_id text,
  p_captain_email      text,
  p_captain_phone      text,
  p_members            jsonb,
  p_note               text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_name       text := btrim(coalesce(p_team_name, ''));
  v_cap_name   text := btrim(coalesce(p_captain_name, ''));
  v_cap_sid    text := btrim(coalesce(p_captain_student_id, ''));
  v_cap_email  text := btrim(coalesce(p_captain_email, ''));
  v_cap_phone  text := regexp_replace(coalesce(p_captain_phone, ''), '\D', '', 'g');
  v_count      int;
  v_captains   int;
  v_member     jsonb;
  v_phone      text;
  v_clash      text;
  v_code       text;
  v_team_id    uuid;
  v_idx        int := 0;
begin
  -- ---- Đợt đăng ký còn mở không? (chốt chặn thật, không phải chỉ ẩn form) ----
  if not public.is_registration_open('tournament') then
    return jsonb_build_object(
      'success', false, 'code', 'closed',
      'message', 'Đợt đăng ký giải đấu đã đóng nên không nhận thêm đội. Vui lòng theo dõi fanpage CLB để biết đợt tiếp theo.');
  end if;

  -- ---- Tên đội ----
  if length(v_name) < 2 or length(v_name) > 60 then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_team_name',
      'message', 'Tên đội phải dài từ 2 đến 60 ký tự.');
  end if;

  -- ---- Thông tin đội trưởng ----
  if v_cap_name = '' or v_cap_sid = '' then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_captain',
      'message', 'Vui lòng nhập đầy đủ họ tên và MSSV của đội trưởng.');
  end if;

  if v_cap_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_captain',
      'message', 'Email đội trưởng không đúng định dạng.');
  end if;

  if v_cap_phone !~ '^[0-9]{10}$' then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_captain',
      'message', 'Số điện thoại đội trưởng phải có đúng 10 chữ số.');
  end if;

  -- ---- Giải đấu ----
  if p_event_id is not null then
    if not exists (
      select 1 from public.events
       where id = p_event_id and is_published
    ) then
      return jsonb_build_object(
        'success', false, 'code', 'invalid_event',
        'message', 'Giải đấu bạn chọn không còn nhận đăng ký.');
    end if;
  end if;

  -- ---- Số lượng thành viên ----
  if p_members is null or jsonb_typeof(p_members) <> 'array' then
    return jsonb_build_object(
      'success', false, 'code', 'member_count',
      'message', 'Danh sách thành viên không hợp lệ.');
  end if;

  v_count := jsonb_array_length(p_members);
  if v_count < 3 or v_count > 5 then
    return jsonb_build_object(
      'success', false, 'code', 'member_count',
      'message', 'Mỗi đội phải có từ 3 đến 5 thành viên.');
  end if;

  -- ---- Từng dòng thành viên ----
  v_captains := 0;
  for v_member in select * from jsonb_array_elements(p_members) loop
    if btrim(coalesce(v_member ->> 'full_name', '')) = ''
       or btrim(coalesce(v_member ->> 'student_id', '')) = '' then
      return jsonb_build_object(
        'success', false, 'code', 'invalid_member',
        'message', 'Mỗi thành viên phải có đủ họ tên và MSSV.');
    end if;
    if coalesce((v_member ->> 'is_captain')::boolean, false) then
      v_captains := v_captains + 1;
    end if;
  end loop;

  if v_captains <> 1 then
    return jsonb_build_object(
      'success', false, 'code', 'no_captain',
      'message', 'Danh sách đội hình phải có đúng một đội trưởng.');
  end if;

  -- ---- MSSV trùng nhau trong cùng đội ----
  select upper(btrim(m ->> 'student_id'))
    into v_clash
    from jsonb_array_elements(p_members) as m
   group by upper(btrim(m ->> 'student_id'))
  having count(*) > 1
   limit 1;

  if v_clash is not null then
    return jsonb_build_object(
      'success', false, 'code', 'duplicate_in_team',
      'message', format('MSSV %s bị nhập hai lần trong đội. Mỗi người chỉ được ghi tên một lần.', v_clash),
      'student_id', v_clash);
  end if;

  -- ---- Tên đội đã dùng trong cùng giải chưa? ----
  if exists (
    select 1
      from public.teams t
     where lower(btrim(t.team_name)) = lower(v_name)
       and t.tournament_event_id is not distinct from p_event_id
  ) then
    return jsonb_build_object(
      'success', false, 'code', 'team_name_taken',
      'message', 'Tên đội này đã có đội khác đăng ký. Vui lòng chọn tên khác.');
  end if;

  -- ---- MSSV đã nằm trong đội khác của cùng giải chưa? ----
  select upper(btrim(m ->> 'student_id'))
    into v_clash
    from jsonb_array_elements(p_members) as m
   where exists (
     select 1
       from public.team_members tm
       join public.teams t on t.id = tm.team_id
      where upper(btrim(tm.student_id)) = upper(btrim(m ->> 'student_id'))
        and t.tournament_event_id is not distinct from p_event_id
        and t.status <> 'rejected'
   )
   limit 1;

  if v_clash is not null then
    return jsonb_build_object(
      'success', false, 'code', 'duplicate_in_event',
      'message', format('MSSV %s đã có tên trong một đội khác của giải này. Mỗi người chỉ được thi đấu cho một đội.', v_clash),
      'student_id', v_clash);
  end if;

  -- ---- Sinh mã đội (bỏ các ký tự dễ nhìn nhầm: I, O, 0, 1) ----
  loop
    v_code := 'IU3X3-' || (
      select string_agg(
        substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
               floor(random() * 32)::int + 1, 1), '')
        from generate_series(1, 5)
    );
    exit when not exists (select 1 from public.teams where team_code = v_code);
  end loop;

  -- ---- Ghi đội + thành viên trong cùng một transaction ----
  insert into public.teams (
    tournament_event_id, team_name, team_code,
    captain_name, captain_student_id, captain_email, captain_phone, note
  ) values (
    p_event_id, v_name, v_code,
    v_cap_name, v_cap_sid, lower(v_cap_email), v_cap_phone,
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_team_id;

  for v_member in select * from jsonb_array_elements(p_members) loop
    v_idx := v_idx + 1;
    v_phone := regexp_replace(coalesce(v_member ->> 'phone', ''), '\D', '', 'g');

    insert into public.team_members (
      team_id, full_name, student_id, phone, height_cm, position, is_captain, sort_order
    ) values (
      v_team_id,
      btrim(v_member ->> 'full_name'),
      btrim(v_member ->> 'student_id'),
      nullif(v_phone, ''),
      nullif(btrim(coalesce(v_member ->> 'height_cm', '')), '')::int,
      coalesce(nullif(btrim(coalesce(v_member ->> 'position', '')), ''), 'unknown')::public.recruit_position,
      coalesce((v_member ->> 'is_captain')::boolean, false),
      v_idx
    );
  end loop;

  return jsonb_build_object(
    'success', true, 'code', 'ok',
    'message', 'Đã nhận đăng ký đội của bạn.',
    'team_id', v_team_id,
    'team_code', v_code,
    'team_name', v_name,
    'member_count', v_count);

exception
  -- Hai đội gửi cùng lúc: các kiểm tra ở trên đã qua nhưng unique index vẫn
  -- chặn. Không đoán được đụng ở tên đội hay MSSV nên báo chung.
  when unique_violation then
    return jsonb_build_object(
      'success', false, 'code', 'team_name_taken',
      'message', 'Vừa có đội khác đăng ký trùng tên đội hoặc trùng thành viên với bạn. Vui lòng kiểm tra lại rồi gửi lần nữa.');
  when invalid_text_representation then
    return jsonb_build_object(
      'success', false, 'code', 'invalid_member',
      'message', 'Chiều cao hoặc vị trí của một thành viên không hợp lệ.');
end;
$fn$;

comment on function public.register_team is
  'Đăng ký một đội thi đấu: kiểm tra đợt còn mở, tên đội và MSSV chưa trùng, rồi ghi teams + team_members trong cùng transaction';

revoke all on function public.register_team(
  uuid, text, text, text, text, text, jsonb, text
) from public;

grant execute on function public.register_team(
  uuid, text, text, text, text, text, jsonb, text
) to anon, authenticated;


-- ============================================================
-- 6. MỞ ĐỢT ĐĂNG KÝ GIẢI ĐẤU KHI SẴN SÀNG
-- ------------------------------------------------------------
-- Mặc định đang ĐÓNG (seed ở migration 003). Mở bằng trang
-- /dashboard/settings, hoặc chạy:
--
-- update public.registration_windows
--    set is_open = true, opens_at = now(), closes_at = '2026-12-31 23:59+07'
--  where type = 'tournament';
-- ============================================================
