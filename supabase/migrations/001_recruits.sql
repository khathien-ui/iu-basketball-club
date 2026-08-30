-- 001_recruits.sql
-- Bảng đăng ký tuyển quân (tryout) — CLB Bóng rổ IU
-- Chạy trong Supabase SQL Editor.

-- ---------- Enums ----------
create type public.recruit_position as enum ('PG', 'SG', 'SF', 'PF', 'C', 'unknown');
create type public.recruit_status   as enum ('pending', 'passed', 'rejected');

-- ---------- Bảng ----------
create table public.recruits (
  id          uuid                     primary key default gen_random_uuid(),
  full_name   text                     not null,
  student_id  text                     not null unique,
  email       text                     not null,
  phone       text,
  height_cm   smallint,
  position    public.recruit_position  not null default 'unknown',
  experience  text,
  note        text,
  status      public.recruit_status    not null default 'pending',
  created_at  timestamptz              not null default now(),

  constraint recruits_full_name_not_blank check (length(btrim(full_name)) > 0),
  constraint recruits_student_id_not_blank check (length(btrim(student_id)) > 0),
  constraint recruits_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint recruits_height_range check (height_cm is null or height_cm between 100 and 250)
);

comment on table  public.recruits            is 'Đơn đăng ký tuyển quân của sinh viên';
comment on column public.recruits.student_id is 'MSSV — duy nhất, mỗi sinh viên chỉ đăng ký một lần';
comment on column public.recruits.status     is 'Trạng thái duyệt đơn, mặc định pending';

create index recruits_status_created_at_idx on public.recruits (status, created_at desc);

-- ---------- Row Level Security ----------
alter table public.recruits enable row level security;

-- Ai cũng nộp được đơn (form công khai, chưa đăng nhập).
create policy "Anyone can submit a recruit application"
  on public.recruits
  for insert
  to anon, authenticated
  with check (true);

-- Chỉ user đã đăng nhập mới xem được danh sách đơn.
create policy "Authenticated users can read applications"
  on public.recruits
  for select
  to authenticated
  using (true);

-- Chỉ user đã đăng nhập mới cập nhật được (duyệt/từ chối).
create policy "Authenticated users can update applications"
  on public.recruits
  for update
  to authenticated
  using (true)
  with check (true);

-- Không tạo policy DELETE: mặc định RLS chặn, không ai xoá được đơn qua API.
