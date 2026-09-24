import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName, verifySession } from "./session";
export async function requireAdmin() {
  if (!(await verifySession((await cookies()).get(cookieName)?.value)))
    redirect("/admin/login");
}
export async function adminApi(request: Request) {
  if (!(await verifySession((await cookies()).get(cookieName)?.value)))
    throw new ApiError("Nicht angemeldet", 401);
  if (request.method !== "GET") checkOrigin(request);
}
export function checkOrigin(request: Request) {
  const configured = process.env.APP_URL;
  if (
    !configured ||
    request.headers.get("origin") !== new URL(configured).origin
  )
    throw new ApiError("Ungültiger Ursprung", 403);
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function apiError(e: unknown) {
  if (e instanceof ApiError)
    return Response.json({ error: e.message }, { status: e.status });
  console.error(e instanceof Error ? e.name : "RequestError");
  return Response.json(
    {
      error:
        "Die Anfrage konnte nicht verarbeitet werden. Bitte erneut versuchen.",
    },
    { status: 500 },
  );
}
