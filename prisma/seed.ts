import { db } from "../lib/db";
import { demoProducts } from "../lib/catalog";
import { defaults } from "../lib/settings";
async function main() {
  for (const p of demoProducts) {
    const { id, variants, sold, ...data } = p;
    await db.category.upsert({ where: { name: p.category }, update: {}, create: { name: p.category } });
    await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        id,
        variants: {
          create: variants.map(({ images, ...v }) => ({
            ...v,
            images: { create: images },
          })),
        },
      },
    });
  }
  await db.shopSettings.upsert({
    where: { id: "shop" },
    update: {},
    create: { id: "shop", data: defaults },
  });
  console.log(
    "Beispielkatalog angelegt. Produktbilder und Angaben vor Verkauf ersetzen.",
  );
}
main().finally(() => db.$disconnect());
