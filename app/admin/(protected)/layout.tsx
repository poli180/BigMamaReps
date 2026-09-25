import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/shell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Shop-Verwaltung",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <AdminShell>
      {process.env.NODE_ENV === "development" && (
        <p className="demo-banner">
          Lokaler Admin: Änderungen gelten für die hier verbundene Datenbank.
          Für den öffentlichen Shop den Admin auf deiner Vercel-Domain
          verwenden.
        </p>
      )}
      {children}
    </AdminShell>
  );
}
