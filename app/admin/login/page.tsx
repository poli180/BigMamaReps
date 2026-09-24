import { Login } from "@/components/admin/login";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin-Anmeldung",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <Login
      configured={
        !!(
          process.env.DATABASE_URL &&
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_PASSWORD_HASH &&
          process.env.NEXTAUTH_SECRET
        )
      }
    />
  );
}
