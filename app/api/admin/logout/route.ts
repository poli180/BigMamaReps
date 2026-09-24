import { cookies } from "next/headers";
import { adminApi, apiError } from "@/lib/auth";
import { cookieName } from "@/lib/session";
export async function POST(req: Request) {
  try {
    await adminApi(req);
    (await cookies()).delete(cookieName);
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
