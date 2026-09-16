import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AlbumDetail from "@/components/AlbumDetail";
import { isMediaRole } from "@/lib/members";
import { ALBUM_COLUMNS, PHOTO_COLUMNS, type AlbumRow, type PhotoRow } from "@/lib/albums";

export const metadata: Metadata = {
  title: "Chi tiết album — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function AlbumDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/albums/${params.id}`);

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isMediaRole(me.role)) redirect("/dashboard");

  const { data: album } = await supabase
    .from("albums")
    .select(ALBUM_COLUMNS)
    .eq("id", params.id)
    .single();

  if (!album) notFound();

  const { data: photoRows } = await supabase
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("album_id", params.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  let eventTitle: string | null = null;
  if ((album as AlbumRow).event_id) {
    const { data: ev } = await supabase
      .from("events")
      .select("title")
      .eq("id", (album as AlbumRow).event_id!)
      .single();
    eventTitle = ev?.title ?? null;
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <AlbumDetail
              initialAlbum={album as AlbumRow}
              initialPhotos={(photoRows ?? []) as PhotoRow[]}
              eventTitle={eventTitle}
              currentUserId={user.id}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
