import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlbumsAdmin from "@/components/AlbumsAdmin";
import { isMediaRole } from "@/lib/members";
import { ALBUM_COLUMNS, type AlbumRow } from "@/lib/albums";

export const metadata: Metadata = {
  title: "Album ảnh — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function AlbumsAdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/albums");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isMediaRole(me.role)) redirect("/dashboard");

  const { data: albumRows, error } = await supabase
    .from("albums")
    .select(ALBUM_COLUMNS)
    .order("album_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const albums = (albumRows ?? []) as AlbumRow[];

  // Đếm ảnh từng album.
  const photoCounts: Record<string, number> = {};
  if (albums.length > 0) {
    const { data: rows } = await supabase
      .from("photos")
      .select("album_id")
      .in("album_id", albums.map((a) => a.id));
    for (const row of rows ?? []) {
      photoCounts[row.album_id] = (photoCounts[row.album_id] ?? 0) + 1;
    }
  }

  // Sự kiện để chọn liên kết + hiển thị tên trong bảng.
  const { data: eventRows } = await supabase
    .from("events")
    .select("id, title")
    .order("event_date", { ascending: false, nullsFirst: false })
    .limit(200);

  const events = (eventRows ?? []) as { id: string; title: string }[];
  const eventTitles: Record<string, string> = {};
  for (const e of events) eventTitles[e.id] = e.title;

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Albums.</h1>
            <p className="section__lede">
              Tạo album ảnh, tải nhiều ảnh cùng lúc và sắp xếp thứ tự hiển thị.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách album: {error.message}
              </p>
            ) : (
              <AlbumsAdmin
                initialAlbums={albums}
                photoCounts={photoCounts}
                eventTitles={eventTitles}
                events={events}
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
