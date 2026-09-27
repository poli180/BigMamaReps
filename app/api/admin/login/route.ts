import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { apiError, checkOrigin, ApiError } from "@/lib/auth";
import { signSession, cookieName } from "@/lib/session";
import { limit } from "@/lib/limits";
import { databaseUrl } from "@/lib/db";
import { adminConfig } from "@/lib/admin-config";
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const config = adminConfig();
    if (!databaseUrl() || config.issues.length)
      throw new ApiError("Admin-Zugang ist noch nicht konfiguriert.", 503);
    const input = z
      .object({
        email: z.string().trim().pipe(z.email().max(254)),
        password: z
          .string()
          .min(1)
          .max(72)
          .refine((v) => Buffer.byteLength(v, "utf8") <= 72),
      })
      .parse(await req.json());
    await limit("admin-login", 30);
    await limit("admin:" + input.email.toLowerCase(), 8);
    const valid = await compare(input.password, config.passwordHash);
    if (!valid || input.email.toLowerCase() !== config.email)
      throw new ApiError("E-Mail oder Passwort ist falsch.", 401);
    (await cookies()).set(cookieName, await signSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 3600,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
