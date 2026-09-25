import { db } from "./db";
import { supplierProducts } from "./supplier-catalog";

export async function importSupplierCatalog() {
  return db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(740219)`;
      let created = 0;
      for (const p of supplierProducts) {
        await tx.category.upsert({
          where: { name: p.category },
          update: {},
          create: { name: p.category },
        });
        if (await tx.product.findUnique({ where: { id: p.id } })) continue;
        const { variants, sold, ...data } = p;
        await tx.product.create({
          data: {
            ...data,
            active: false,
            variants: {
              create: variants.map(({ images, ...v }) => ({
                ...v,
                images: { create: images },
              })),
            },
          },
        });
        created++;
      }
      await tx.product.updateMany({
        where: {
          id: {
            in: ["demo-0", "demo-1", "demo-2", "demo-3", "demo-4", "demo-5"],
          },
        },
        data: { active: false },
      });
      return { created, total: supplierProducts.length };
    },
    { timeout: 30000 },
  );
}
