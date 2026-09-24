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
const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
export const demoProducts: ShopProduct[] = [
  [
    "essential-hoodie",
    "Essential Hoodie",
    "Hoodies",
    89,
    69,
    "photo-1556821840-3a63f95609a7",
    "Sand",
    "#b6aa95",
  ],
  [
    "heavyweight-tee",
    "Heavyweight Tee",
    "T-Shirts",
    39,
    0,
    "photo-1521572163474-6864f9cf17ab",
    "Off White",
    "#e8e4db",
  ],
  [
    "relaxed-denim",
    "Relaxed Denim",
    "Hosen",
    99,
    79,
    "photo-1542272604-787c3835535d",
    "Indigo",
    "#52647b",
  ],
  [
    "everyday-crewneck",
    "Everyday Crewneck",
    "Sweatshirts",
    79,
    0,
    "photo-1576566588028-4147f3842f27",
    "Cream",
    "#d6cbb7",
  ],
  [
    "studio-jacket",
    "Studio Jacket",
    "Jacken",
    149,
    119,
    "photo-1551028719-00167b16eac5",
    "Black",
    "#252525",
  ],
  [
    "signature-tee",
    "Signature Tee",
    "T-Shirts",
    45,
    0,
    "photo-1503341504253-dff4815485f1",
    "Stone",
    "#a59d91",
  ],
].map((p, i) => ({
  id: `demo-${i}`,
  slug: String(p[0]),
  name: String(p[1]),
  category: String(p[2]),
  basePrice: Number(p[3]),
  salePrice: p[4] ? Number(p[4]) : null,
  onSale: !!p[4],
  saleStart: null,
  saleEnd: null,
  active: true,
  featured: i < 4,
  createdAt: new Date(2026, 8, 20 - i).toISOString(),
  description:
    "Ein Essential für jeden Tag. Entspannter Schnitt, klare Linien und ein angenehmes Tragegefühl. Kombiniere es auf deine Art.",
  material:
    "100 % Baumwolle. Angaben sind Beispieldaten und vor Verkauf zu prüfen.",
  care: "Bei 30 °C auf links waschen. Nicht im Trockner trocknen.",
  variants: ["S", "M", "L", "XL"].map((size, j) => ({
    id: `demo-${i}-${size}`,
    color: String(p[6]),
    colorHex: String(p[7]),
    size,
    sku: `BMR-${i}-${size}`,
    stock: j === 3 ? 2 : 12,
    reserved: 0,
    priceOverride: null,
    active: true,
    images: [{ url: photo(String(p[5])), order: 0 }],
  })),
}));
export async function products(all = false): Promise<ShopProduct[]> {
  if (isDemo()) return demoProducts;
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
