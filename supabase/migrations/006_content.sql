-- 006_content.sql
-- Sự kiện, tin tức, thư viện ảnh — CLB Bóng rổ IU
-- Phụ thuộc: 002_profiles.sql (public.is_club_staff(), enum public.user_role)
--
-- IDEMPOTENT: chạy lại nhiều lần không lỗi.
--
-- THỨ TỰ BẮT BUỘC (mọi tham chiếu chỉ xuất hiện sau khi đối tượng đã tạo):
--   1. Enum
--   2. Thêm role 'media' vào public.user_role
--   3. Bảng: events -> event_participants -> posts -> albums -> photos
--   4. Index
--   5. Hàm + trigger (hàm truy vấn bảng nên phải nằm sau mục 3)
--   6. RLS + policy từng bảng
--   7. Storage bucket 'media' + policy
--
-- Chạy trong Supabase SQL Editor.


-- ============================================================
-- 1. ENUM
-- ============================================================
do $$ begin
  create type public.event_type as enum
    ('tryout', 'match', 'tournament', 'team_building', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.participant_status as enum ('going', 'maybe', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.post_category as enum
    ('recap', 'announcement', 'achievement', 'other');
exception when duplicate_object then null;
end $$;


-- ============================================================
-- 2. VAI TRÒ MỚI: media
-- ------------------------------------------------------------
-- Ban truyền thông: quản lý tin tức, album, ảnh — KHÔNG xem được đơn
-- tuyển quân và KHÔNG quản lý được thành viên.
-- ============================================================
alter type public.user_role add value if not exists 'media';


-- ============================================================
-- 3. BẢNG
-- ============================================================

-- ---- 3.1 events ----
create table if not exists public.events (
  id               uuid              primary key default gen_random_uuid(),
  title            text              not null,
  slug             text              not null unique,
  event_type       public.event_type not null default 'other',
  description      text,
  content          text,
  event_date       date,                               -- NULL = chưa chốt (TBA)
  start_time       time,
  end_time         time,
  location         text,
  cover_image_url  text,
  is_published     boolean           not null default false,
  allow_join       boolean           not null default false,
  max_participants int,
  created_by       uuid              references public.profiles (id) on delete set null,
  created_at       timestamptz       not null default now(),
  updated_at       timestamptz       not null default now(),

  constraint events_title_not_blank check (length(btrim(title)) > 0),
  constraint events_slug_format     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint events_time_order      check (end_time is null or start_time is null or end_time > start_time),
  constraint events_max_positive    check (max_participants is null or max_participants > 0)
);

comment on table  public.events                  is 'Sự kiện của CLB: tuyển quân, thi đấu, giải, team building';
comment on column public.events.event_date       is 'NULL = chưa công bố ngày (TBA)';
comment on column public.events.allow_join       is 'true = thành viên bấm tham gia được từ trang sự kiện';
comment on column public.events.max_participants is 'NULL = không giới hạn số người tham gia';

-- ---- 3.2 event_participants (tham chiếu events ở 3.1) ----
create table if not exists public.event_participants (
  id        uuid                      primary key default gen_random_uuid(),
  event_id  uuid                      not null references public.events (id)   on delete cascade,
  member_id uuid                      not null references public.profiles (id) on delete cascade,
  joined_at timestamptz               not null default now(),
  status    public.participant_status not null default 'going',

  constraint event_participants_unique unique (event_id, member_id)
);

comment on table public.event_participants is 'Thành viên đăng ký tham gia sự kiện';

-- ---- 3.3 posts ----
create table if not exists public.posts (
  id              uuid                 primary key default gen_random_uuid(),
  title           text                 not null,
  slug            text                 not null unique,
  excerpt         text,
  content         text,
  cover_image_url text,
  category        public.post_category not null default 'other',
  is_published    boolean              not null default false,
  published_at    timestamptz,
  author_id       uuid                 references public.profiles (id) on delete set null,
  created_at      timestamptz          not null default now(),
  updated_at      timestamptz          not null default now(),

  constraint posts_title_not_blank check (length(btrim(title)) > 0),
  constraint posts_slug_format     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table  public.posts              is 'Tin tức / bài viết, nội dung dạng markdown';
comment on column public.posts.excerpt      is 'Đoạn tóm tắt hiển thị ở trang chủ và danh sách tin';
comment on column public.posts.published_at is 'Tự đặt bằng now() lần đầu bài được xuất bản';

-- ---- 3.4 albums (tham chiếu events ở 3.1) ----
create table if not exists public.albums (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  slug            text        not null unique,
  description     text,
  event_id        uuid        references public.events (id) on delete set null,
  cover_image_url text,
  is_published    boolean     not null default false,
  album_date      date,
  created_by      uuid        references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),

  constraint albums_title_not_blank check (length(btrim(title)) > 0),
  constraint albums_slug_format     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on table  public.albums          is 'Album ảnh, có thể gắn với một sự kiện';
comment on column public.albums.event_id is 'NULL = album không thuộc sự kiện nào';

-- ---- 3.5 photos (tham chiếu albums ở 3.4) ----
create table if not exists public.photos (
  id            uuid        primary key default gen_random_uuid(),
  album_id      uuid        not null references public.albums (id) on delete cascade,
  image_url     text        not null,
  thumbnail_url text,
  caption       text,
  sort_order    int         not null default 0,
  uploaded_by   uuid        references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint photos_image_url_not_blank check (length(btrim(image_url)) > 0)
);

comment on table  public.photos            is 'Ảnh trong album; hiển thị công khai theo trạng thái của album';
comment on column public.photos.sort_order is 'Thứ tự hiển thị trong album, nhỏ trước';


-- ============================================================
-- 4. INDEX
-- ============================================================
create index if not exists events_published_date_idx
  on public.events (is_published, event_date desc nulls last);
create index if not exists events_type_idx
  on public.events (event_type);

create index if not exists event_participants_event_idx
  on public.event_participants (event_id, status);
create index if not exists event_participants_member_idx
  on public.event_participants (member_id);

create index if not exists posts_published_idx
  on public.posts (is_published, published_at desc nulls last);
create index if not exists posts_category_idx
  on public.posts (category);

create index if not exists albums_published_idx
  on public.albums (is_published, album_date desc nulls last);
create index if not exists albums_event_idx
  on public.albums (event_id);

create index if not exists photos_album_idx
  on public.photos (album_id, sort_order, created_at);


-- ============================================================
-- 5. HÀM & TRIGGER
-- ------------------------------------------------------------
-- Đặt SAU mục 3 vì các hàm dưới đây truy vấn public.profiles và public.albums;
-- hàm LANGUAGE sql bị kiểm tra ngay lúc tạo nên bảng phải tồn tại trước.
-- ============================================================

-- ---- 5.1 Phân quyền truyền thông ----
-- So sánh bằng ::text thay vì literal enum: giá trị 'media' vừa được thêm ở
-- mục 2, Postgres không cho dùng literal enum mới trong cùng transaction.
create or replace function public.is_media_manager()
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
      and is_active
      and role::text in ('admin', 'executive_board', 'media')
  );
$fn$;

comment on function public.is_media_manager is
  'true nếu user là admin, executive_board hoặc media — được quản lý nội dung truyền thông';

revoke execute on function public.is_media_manager() from public, anon;
grant  execute on function public.is_media_manager() to authenticated;

-- ---- 5.2 Album đã xuất bản chưa (dùng trong policy của photos) ----
-- security definer để tránh RLS lồng nhau khi policy của photos truy vấn albums.
create or replace function public.album_is_published(p_album_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.albums
    where id = p_album_id and is_published
  );
$fn$;

grant execute on function public.album_is_published(uuid) to anon, authenticated;

-- ---- 5.3 Tự cập nhật updated_at ----
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

-- ---- 5.4 Tự đóng dấu thời điểm xuất bản lần đầu ----
create or replace function public.touch_published_at()
returns trigger
language plpgsql
as $fn$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$fn$;

-- ---- 5.5 Gắn trigger ----
drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch_published_at on public.posts;
create trigger posts_touch_published_at
  before insert or update on public.posts
  for each row execute function public.touch_published_at();


-- ============================================================
-- 6. RLS & POLICY
-- ============================================================

-- ---- 6.1 events ----
-- Công khai đọc bài đã xuất bản; quản trị bởi admin/executive_board.
-- LƯU Ý: migration 007 đã chuyển quyền quản lý events sang is_media_manager()
-- (thêm role media). Nếu chạy lại từ đầu, nhớ chạy 007 sau 006.
alter table public.events enable row level security;

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

drop policy if exists "Published events are public" on public.events;
create policy "Published events are public"
  on public.events for select to anon, authenticated
  using (is_published or public.is_club_staff());

drop policy if exists "Club staff insert events" on public.events;
create policy "Club staff insert events"
  on public.events for insert to authenticated
  with check (public.is_club_staff());

drop policy if exists "Club staff update events" on public.events;
create policy "Club staff update events"
  on public.events for update to authenticated
  using (public.is_club_staff()) with check (public.is_club_staff());

drop policy if exists "Club staff delete events" on public.events;
create policy "Club staff delete events"
  on public.events for delete to authenticated
  using (public.is_club_staff());

-- ---- 6.2 event_participants ----
-- Thành viên tự đăng ký / đổi trạng thái bản ghi CỦA CHÍNH MÌNH.
-- Staff đọc và sửa được tất cả.
alter table public.event_participants enable row level security;

grant select, insert, update, delete on public.event_participants to authenticated;

drop policy if exists "Members read own participation, staff reads all" on public.event_participants;
create policy "Members read own participation, staff reads all"
  on public.event_participants for select to authenticated
  using (member_id = auth.uid() or public.is_club_staff());

drop policy if exists "Members join events themselves" on public.event_participants;
create policy "Members join events themselves"
  on public.event_participants for insert to authenticated
  with check (
    public.is_club_staff()
    or (
      member_id = auth.uid()
      -- Chỉ đăng ký được sự kiện đã xuất bản VÀ đang mở nhận tham gia,
      -- nếu không cờ allow_join chỉ là trang trí ở giao diện.
      and exists (
        select 1 from public.events e
        where e.id = event_id and e.is_published and e.allow_join
      )
    )
  );

drop policy if exists "Members update own participation" on public.event_participants;
create policy "Members update own participation"
  on public.event_participants for update to authenticated
  using (member_id = auth.uid() or public.is_club_staff())
  with check (member_id = auth.uid() or public.is_club_staff());

drop policy if exists "Members or staff delete participation" on public.event_participants;
create policy "Members or staff delete participation"
  on public.event_participants for delete to authenticated
  using (member_id = auth.uid() or public.is_club_staff());

-- ---- 6.3 posts (media quản lý được) ----
alter table public.posts enable row level security;

grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;

drop policy if exists "Published posts are public" on public.posts;
create policy "Published posts are public"
  on public.posts for select to anon, authenticated
  using (is_published or public.is_media_manager());

drop policy if exists "Media managers insert posts" on public.posts;
create policy "Media managers insert posts"
  on public.posts for insert to authenticated
  with check (public.is_media_manager());

drop policy if exists "Media managers update posts" on public.posts;
create policy "Media managers update posts"
  on public.posts for update to authenticated
  using (public.is_media_manager()) with check (public.is_media_manager());

drop policy if exists "Media managers delete posts" on public.posts;
create policy "Media managers delete posts"
  on public.posts for delete to authenticated
  using (public.is_media_manager());

-- ---- 6.4 albums (media quản lý được) ----
alter table public.albums enable row level security;

grant select on public.albums to anon, authenticated;
grant insert, update, delete on public.albums to authenticated;

drop policy if exists "Published albums are public" on public.albums;
create policy "Published albums are public"
  on public.albums for select to anon, authenticated
  using (is_published or public.is_media_manager());

drop policy if exists "Media managers insert albums" on public.albums;
create policy "Media managers insert albums"
  on public.albums for insert to authenticated
  with check (public.is_media_manager());

drop policy if exists "Media managers update albums" on public.albums;
create policy "Media managers update albums"
  on public.albums for update to authenticated
  using (public.is_media_manager()) with check (public.is_media_manager());

drop policy if exists "Media managers delete albums" on public.albums;
create policy "Media managers delete albums"
  on public.albums for delete to authenticated
  using (public.is_media_manager());

-- ---- 6.5 photos (hiển thị theo trạng thái album cha) ----
alter table public.photos enable row level security;

grant select on public.photos to anon, authenticated;
grant insert, update, delete on public.photos to authenticated;

drop policy if exists "Photos of published albums are public" on public.photos;
create policy "Photos of published albums are public"
  on public.photos for select to anon, authenticated
  using (public.album_is_published(album_id) or public.is_media_manager());

drop policy if exists "Media managers insert photos" on public.photos;
create policy "Media managers insert photos"
  on public.photos for insert to authenticated
  with check (public.is_media_manager());

drop policy if exists "Media managers update photos" on public.photos;
create policy "Media managers update photos"
  on public.photos for update to authenticated
  using (public.is_media_manager()) with check (public.is_media_manager());

drop policy if exists "Media managers delete photos" on public.photos;
create policy "Media managers delete photos"
  on public.photos for delete to authenticated
  using (public.is_media_manager());


-- ============================================================
-- 7. STORAGE: BUCKET 'media'
-- ------------------------------------------------------------
-- Ảnh bìa sự kiện, ảnh tin tức, ảnh album. public = true để <img> hiển thị
-- không cần signed URL. Giới hạn 10MB mỗi ảnh.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Media files are publicly readable" on storage.objects;
create policy "Media files are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

drop policy if exists "Media managers upload media" on storage.objects;
create policy "Media managers upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_media_manager());

drop policy if exists "Media managers update media" on storage.objects;
create policy "Media managers update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_media_manager());

drop policy if exists "Media managers delete media" on storage.objects;
create policy "Media managers delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_media_manager());


-- ============================================================
-- 8. GHI CHÚ VẬN HÀNH
-- ------------------------------------------------------------
-- Ranh giới quyền của role 'media' (sau khi chạy cả 006 và 007):
--   CÓ    — events, posts, albums, photos, bucket storage 'media'
--   KHÔNG — recruits (đơn tuyển quân), profiles (quản lý thành viên),
--           registration_windows, training_sessions, attendances
-- vì các bảng đó dùng public.is_club_staff(), hàm này chỉ nhận
-- admin và executive_board.
--
-- Cấp quyền truyền thông cho một người:
--   update public.profiles set role = 'media' where email = 'email@example.com';
--
-- Gợi ý đường dẫn file trong bucket 'media':
--   events/{event_slug}/cover.jpg
--   posts/{post_slug}/cover.jpg
--   albums/{album_slug}/{uuid}.jpg
-- ============================================================
