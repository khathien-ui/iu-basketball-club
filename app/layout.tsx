import type { Metadata } from "next";
import "../css/styles.css";

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23ff5c1a'/%3E%3Cpath d='M2 16h28M16 2v28M6 6c6 6 14 6 20 0M6 26c6-6 14-6 20 0' stroke='%23131313' stroke-width='2' fill='none'/%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "IU Basketball Club",
  description:
    "Official website of the IU Basketball Club — International University, VNU-HCM. Portal, member management, events and tournaments.",
  icons: { icon: FAVICON },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
