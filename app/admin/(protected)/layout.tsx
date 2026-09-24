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
  return <AdminShell>{children}</AdminShell>;
}
