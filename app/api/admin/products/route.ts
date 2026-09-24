import { adminApi, apiError, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { productInput } from "@/lib/validation";
import { z } from "zod";
export async function POST(req: Request) {
  try {
    await adminApi(req);
    const p = productInput.parse(await req.json());
    const { variants, id, ...data } = p;
    const result = await db.$transaction(async (tx) => {
      if (!(await tx.category.findUnique({ where: { name: data.category } })))
        throw new ApiError("Bitte eine vorhandene Kategorie wählen.");
      const product = id
        ? await tx.product.update({ where: { id }, data })
        : await tx.product.create({ data });
      const old = await tx.variant.findMany({
        where: { productId: product.id },
      });
      const ids = old.map((v) => v.id);
      for (const v of variants) {
        if (v.id && !ids.includes(v.id))
          throw new ApiError("Ungültige Variante");
        const { images, id: vid, ...fields } = v;
        if (vid) {
          await tx.$executeRaw`SELECT id FROM "Variant" WHERE id=${vid} FOR UPDATE`;
          const current = await tx.variant.findUniqueOrThrow({
            where: { id: vid },
          });
          if (fields.stock < current.reserved)
            throw new ApiError(
              "Bestand darf nicht unter reservierter Menge liegen.",
            );
          await tx.variant.update({
            where: { id: vid },
            data: { ...fields, images: { deleteMany: {}, create: images } },
          });
        } else
          await tx.variant.create({
            data: {
              ...fields,
              productId: product.id,
              images: { create: images },
            },
          });
      }
      await tx.variant.updateMany({
        where: {
          productId: product.id,
          id: { in: ids.filter((id) => !variants.some((v) => v.id === id)) },
        },
        data: { active: false },
      });
      return product;
    });
    return Response.json({ id: result.id });
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: e.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await adminApi(req);
    const { id } = z.object({ id: z.string() }).parse(await req.json());
    await db.product.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(req: Request) {
  try {
    await adminApi(req);
    const b = z
      .object({ id: z.string(), active: z.boolean() })
      .parse(await req.json());
    await db.product.update({
      where: { id: b.id },
      data: { active: b.active },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
