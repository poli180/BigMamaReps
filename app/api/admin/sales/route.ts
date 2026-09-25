import { catalogChanged } from "@/lib/catalog-revision";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminApi, apiError } from "@/lib/auth";
const schema = z
  .object({
    ids: z.array(z.string()).min(1).max(100),
    enabled: z.boolean(),
    discount: z.number().min(1).max(99),
    start: z.iso.datetime().nullable(),
    end: z.iso.datetime().nullable(),
  })
  .refine(
    (b) => !b.start || !b.end || b.start < b.end,
    "Ende muss nach dem Start liegen",
  );
export async function POST(req: Request) {
  try {
    await adminApi(req);
    const b = schema.parse(await req.json());
    await db.$transaction(async (tx) => {
      const rows = await tx.product.findMany({ where: { id: { in: b.ids } } });
      for (const p of rows)
        await tx.product.update({
          where: { id: p.id },
          data: {
            onSale: b.enabled,
            salePrice: b.enabled
              ? Math.round(Number(p.basePrice) * (1 - b.discount / 100) * 100) /
                100
              : null,
            saleStart: b.start,
            saleEnd: b.end,
          },
        });
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
