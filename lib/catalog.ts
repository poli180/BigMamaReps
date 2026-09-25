import { db, isDemo } from "./db";
import { priceFor } from "./pricing";
export type ShopVariant = {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  reserved: number;
  priceOverride: number | null;
  active: boolean;
  images: { url: string; order: number }[];
};
export type ShopProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  material: string;
  care: string;
  basePrice: number;
  active: boolean;
  featured: boolean;
  onSale: boolean;
  salePrice: number | null;
  saleStart: string | null;
  saleEnd: string | null;
  createdAt: string;
  variants: ShopVariant[];
  sold?: number;
};
export { supplierProducts as demoProducts } from "./supplier-catalog";
import { supplierProducts } from "./supplier-catalog";
export async function products(all = false): Promise<ShopProduct[]> {
  if (isDemo()) return supplierProducts;
  const rows = await db.product.findMany({
    where: all ? {} : { active: true },
    include: {
      variants: {
        where: all ? {} : { active: true },
        include: {
          images: { orderBy: { order: "asc" } },
          items: {
            select: {
              quantity: true,
              order: { select: { paymentStatus: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((p) => ({
    ...p,
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice === null ? null : Number(p.salePrice),
    saleStart: p.saleStart?.toISOString() ?? null,
    saleEnd: p.saleEnd?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    sold: p.variants.reduce(
      (n, v) =>
        n +
        v.items
          .filter((i) => i.order.paymentStatus === "PAID")
          .reduce((s, i) => s + i.quantity, 0),
      0,
    ),
    variants: p.variants.map((v) => ({
      ...v,
      items: undefined,
      priceOverride: v.priceOverride === null ? null : Number(v.priceOverride),
    })),
  }));
}
export function publicProduct(p: ShopProduct) {
  return { ...p, ...priceFor(p) };
}
