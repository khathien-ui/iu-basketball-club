import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventParticipants from "@/components/EventParticipants";
import { isMediaRole, type Profile } from "@/lib/members";
import { EVENT_COLUMNS, type ClubEventRow, type EventParticipant } from "@/lib/events";

export const metadata: Metadata = {
  title: "Chi tiết sự kiện — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/events/${params.id}`);

  const { data: me } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!me || !me.is_active || !isMediaRole(me.role)) redirect("/dashboard");

  const { data: event } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  const { data: participantRows } = await supabase
    .from("event_participants")
    .select("id, event_id, member_id, joined_at, status")
    .eq("event_id", params.id)
    .order("joined_at", { ascending: true });

  const participants = (participantRows ?? []) as EventParticipant[];

  let members: Profile[] = [];
  if (participants.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, full_name, student_id, email, phone, role, position, height_cm, joined_year, avatar_url, is_active, must_change_password, created_at"
      )
      .in("id", participants.map((p) => p.member_id));
    members = (data ?? []) as Profile[];
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <EventParticipants
              event={event as ClubEventRow}
              participants={participants}
              members={members}
            />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
