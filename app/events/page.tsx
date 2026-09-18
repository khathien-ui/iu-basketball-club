import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import EventsBrowser from "@/components/EventsBrowser";
import { getPublishedEvents } from "@/lib/publicData";

export const metadata: Metadata = {
  title: "Sự kiện — IU Basketball Club",
  description:
    "Lịch tuyển quân, giải đấu, trận đấu và hoạt động của CLB Bóng rổ IU — Trường Đại học Quốc tế, ĐHQG TP.HCM.",
  openGraph: {
    title: "Sự kiện — IU Basketball Club",
    description: "Lịch tuyển quân, giải đấu và hoạt động của CLB Bóng rổ IU.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getPublishedEvents();

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="section section--first">
          <div className="section-inner">
            <p className="eyebrow">Bước lên sân</p>
            <h1 className="section__title">Events.</h1>
            <p className="section__lede">
              Toàn bộ sự kiện của CLB — từ tuyển quân, giải đấu tới các buổi sinh hoạt.
            </p>

            {events.length === 0 ? (
              <EmptyState
                title="Chưa có sự kiện nào"
                message="CLB sẽ công bố lịch tuyển quân, giải đấu và các hoạt động tại đây."
              />
            ) : (
              <EventsBrowser events={events} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
