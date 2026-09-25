import { catalogChanged } from "@/lib/catalog-revision";
import { adminApi, apiError } from "@/lib/auth";
import { settingsInput } from "@/lib/validation";
import { db } from "@/lib/db";
import { z } from "zod";
import { settings } from "@/lib/settings";
export async function GET(req: Request) {
  try {
    await adminApi(req);
    return Response.json(await settings());
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: Request) {
  try {
    await adminApi(req);
    const data = settingsInput.parse(await req.json());
    await db.shopSettings.upsert({
      where: { id: "shop" },
      create: { id: "shop", data },
      update: { data },
    });
    await catalogChanged();
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: e.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    return apiError(e);
  }
}
