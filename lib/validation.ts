import { z } from "zod";
import sanitize from "sanitize-html";
export const safeHtml = (html: string) =>
  sanitize(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "a"],
    allowedAttributes: { a: ["href", "rel"] },
    allowedSchemes: ["https", "mailto"],
    transformTags: {
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
export const mediaUrl = z
  .string()
  .max(2000)
  .refine(
    (s) =>
      !s || (s.startsWith("/") && !s.startsWith("//")) || /^https:\/\//.test(s),
    "HTTPS-URL erforderlich",
  );
const amount = z
  .number()
  .finite()
  .min(0)
  .max(999999)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.0001,
    "Maximal zwei Nachkommastellen",
  );
export const productInput = z
  .object({
    id: z.string().optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120),
    name: z.string().min(2).max(160),
    description: z.string().max(30000).transform(safeHtml),
    material: z.string().max(3000),
    care: z.string().max(3000),
    category: z.string().min(1).max(80),
    basePrice: amount,
    active: z.boolean(),
    featured: z.boolean(),
    onSale: z.boolean(),
    salePrice: amount.nullable(),
    saleStart: z.iso.datetime().nullable(),
    saleEnd: z.iso.datetime().nullable(),
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          color: z.string().min(1).max(60),
          colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
          size: z.string().min(1).max(20),
          sku: z.string().min(1).max(100),
          stock: z.number().int().min(0).max(1000000),
          priceOverride: amount.nullable(),
          active: z.boolean(),
          images: z
            .array(z.object({ url: mediaUrl, order: z.number().int().min(0) }))
            .max(20),
        }),
      )
      .min(1)
      .max(150),
  })
  .superRefine((p, ctx) => {
    if (p.onSale && (p.salePrice === null || p.salePrice >= p.basePrice))
      ctx.addIssue({
        code: "custom",
        message: "Sale-Preis muss kleiner als Basispreis sein.",
      });
    if (p.saleStart && p.saleEnd && p.saleStart >= p.saleEnd)
      ctx.addIssue({
        code: "custom",
        message: "Sale-Ende muss nach dem Start liegen.",
      });
    if (
      new Set(p.variants.map((v) => v.color + "|" + v.size)).size !==
      p.variants.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Farbe und Größe müssen eindeutig sein.",
      });
  });
export const settingsInput = z.object({
  heroType: z.enum(["image", "video"]),
  heroUrl: mediaUrl,
  heroPoster: mediaUrl,
  heroTitle: z.string().max(150),
  heroSubtitle: z.string().max(300),
  heroCta: z.string().max(60),
  heroLink: z
    .string()
    .regex(/^\/(?!\/)/)
    .max(300),
  saleTitle: z.string().max(120),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: mediaUrl,
  announcement: z.string().max(200),
  about: z.string().max(20000).transform(safeHtml),
  shippingCost: amount,
  freeShippingFrom: amount,
  shippingCountries: z.array(z.enum(["DE", "AT", "CH"])).min(1),
  shippingText: z.string().max(300),
  instagram: mediaUrl,
  tiktok: mediaUrl,
  footerText: z.string().max(300),
  emailNotifications: z.boolean(),
  telegramNotifications: z.boolean(),
  categoryBanners: z
    .array(
      z.object({
        category: z.string().min(1).max(80),
        title: z.string().min(1).max(100),
        image: mediaUrl,
      }),
    )
    .max(12)
    .default([]),
  legal: z.object({
    impressum: z.string().max(50000).transform(safeHtml),
    agb: z.string().max(50000).transform(safeHtml),
    datenschutz: z.string().max(50000).transform(safeHtml),
    widerruf: z.string().max(50000).transform(safeHtml),
    versand: z.string().max(50000).transform(safeHtml),
  }),
});
