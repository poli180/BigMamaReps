import source from "@/data/supplier-catalog.json";
import type { ShopProduct } from "./catalog";
export const supplierProducts: ShopProduct[] = source.map((p, i) => ({
  id: "supplier-" + p.albumId,
  slug: "katalog-" + p.albumId,
  name: p.name,
  category: p.category,
  description:
    "<p>" +
    p.name +
    ". Größen laut Lieferantenkatalog: " +
    p.sizeRange +
    '.</p><p>Preis und Verfügbarkeit werden noch bestätigt. Die Fotos zeigen die im Lieferantenalbum angebotenen Ausführungen.</p><p><a href="' +
    p.source +
    '">Lieferantenalbum ansehen</a></p>',
  material: "Materialangaben noch zu bestätigen.",
  care: "Pflegehinweise noch zu bestätigen.",
  basePrice: 0,
  salePrice: null,
  onSale: false,
  saleStart: null,
  saleEnd: null,
  active: true,
  featured: [0, 4, 8, 20].includes(i),
  createdAt: "2026-09-25T00:00:00.000Z",
  variants: [
    {
      id: "supplier-" + p.albumId + "-catalog",
      color: "Katalogausführung",
      colorHex: "#555555",
      size: "Größe folgt",
      sku: "SUP-" + p.albumId,
      stock: 0,
      reserved: 0,
      priceOverride: null,
      active: true,
      images: p.photos.map((url, order) => ({ url, order })),
    },
  ],
}));
