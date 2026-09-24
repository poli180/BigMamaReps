import { db, isDemo } from "./db";
import { demoProducts } from "./catalog";
export async function categories() {
  if (isDemo())
    return [...new Set(demoProducts.map((p) => p.category))].map(
      (name, position) => ({
        id: `demo-${position}`,
        name,
        description: "Entdecke deine neuen Lieblingsstücke.",
        image: "",
        position,
        _count: {
          products: demoProducts.filter((p) => p.category === name).length,
        },
      }),
    );
  return db.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}
