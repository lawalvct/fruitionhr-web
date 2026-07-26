import { KioskDisplayPage } from "@/features/attendance/kiosk-display-page";

export default async function AttendanceKioskRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <KioskDisplayPage kioskId={Number(id)} />;
}
