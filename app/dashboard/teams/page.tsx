import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TeamsTable from "@/components/TeamsTable";
import { isStaffRole } from "@/lib/members";
import {
  TEAM_COLUMNS,
  TEAM_MEMBER_COLUMNS,
  type TeamMemberRow,
  type TeamRow,
  type TeamWithMembers,
} from "@/lib/teams";

export const metadata: Metadata = {
  title: "Đội đăng ký giải — IU Basketball Club",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/teams");

  // Lớp bảo vệ thứ hai sau middleware; RLS là lớp thứ ba.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!isStaffRole(profile?.role)) redirect("/dashboard");

  const { data: teamData, error } = await supabase
    .from("teams")
    .select(TEAM_COLUMNS)
    .order("created_at", { ascending: false });

  const teamRows = (teamData ?? []) as unknown as TeamRow[];

  // Đội hình và tên giải tải rời rồi ghép, tránh phụ thuộc vào cú pháp join
  // lồng của PostgREST khi cả hai bảng đều bật RLS.
  const [members, events] = await Promise.all([
    loadMembers(supabase, teamRows.map((t) => t.id)),
    loadEventTitles(
      supabase,
      teamRows.map((t) => t.tournament_event_id).filter((id): id is string => !!id)
    ),
  ]);

  const teams: TeamWithMembers[] = teamRows.map((t) => ({
    ...t,
    members: members.get(t.id) ?? [],
    event_title: t.tournament_event_id ? events.get(t.tournament_event_id) ?? null : null,
  }));

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <a href="/dashboard" className="back-link">← Dashboard</a>

            <p className="eyebrow">Quản trị</p>
            <h1 className="section__title">Registered Teams.</h1>
            <p className="section__lede">
              Danh sách đội đăng ký giải đấu, mới nhất trước. Bấm vào một đội để xem
              đội hình và duyệt hoặc từ chối.
            </p>

            {error ? (
              <p className="form-alert" role="alert">
                Không tải được danh sách đội: {error.message}
              </p>
            ) : (
              <TeamsTable initialTeams={teams} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

type Client = ReturnType<typeof createClient>;

async function loadMembers(
  supabase: Client,
  teamIds: string[]
): Promise<Map<string, TeamMemberRow[]>> {
  const map = new Map<string, TeamMemberRow[]>();
  if (teamIds.length === 0) return map;

  const { data } = await supabase
    .from("team_members")
    .select(TEAM_MEMBER_COLUMNS)
    .in("team_id", teamIds)
    .order("sort_order");

  ((data ?? []) as TeamMemberRow[]).forEach((m) => {
    const list = map.get(m.team_id);
    if (list) list.push(m);
    else map.set(m.team_id, [m]);
  });

  return map;
}

async function loadEventTitles(
  supabase: Client,
  eventIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(new Set(eventIds));
  if (unique.length === 0) return map;

  const { data } = await supabase.from("events").select("id, title").in("id", unique);
  ((data ?? []) as { id: string; title: string }[]).forEach((e) => map.set(e.id, e.title));

  return map;
}
