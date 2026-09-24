import { z } from "zod";
import { db } from "./db";
import { mediaUrl } from "./validation";
import { ApiError } from "./auth";
export const categoryInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300),
  image: mediaUrl,
  position: z.number().int().min(0).max(9999),
});
export async function saveCategory(input: unknown) {
  const { id, ...data } = categoryInput.parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(740219)`;
    const duplicate = await tx.category.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        ...(id ? { id: { not: id } } : {}),
      },
    });
    if (duplicate)
      throw new ApiError("Dieser Kategoriename ist bereits vergeben.", 409);
    return id
      ? tx.category.update({ where: { id }, data })
      : tx.category.create({ data });
  });
}
export async function deleteCategory(input: unknown) {
  const { id, moveTo } = z
    .object({ id: z.string(), moveTo: z.string().optional() })
    .parse(input);
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(740219)`;
    const category = await tx.category.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (category._count.products) {
      const target =
        moveTo && moveTo !== id
          ? await tx.category.findUnique({ where: { id: moveTo } })
          : null;
      if (!target)
        throw new ApiError(
          "Bitte zuerst eine Zielkategorie für die vorhandenen Produkte auswählen.",
          409,
        );
      await tx.product.updateMany({
        where: { category: category.name },
        data: { category: target.name },
      });
    }
    await tx.category.delete({ where: { id } });
    return { ok: true };
  });
}
