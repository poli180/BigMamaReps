import { Login } from "@/components/admin/login";
import { databaseUrl } from "@/lib/db";
import { adminConfig } from "@/lib/admin-config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin-Anmeldung",
  robots: { index: false, follow: false },
};
export default function Page() {
  const issues = [...adminConfig().issues];
  if (!databaseUrl()) issues.push("DATABASE_URL");
  return <Login configured={!issues.length} configIssues={issues} />;
}
