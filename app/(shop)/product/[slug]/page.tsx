import { notFound } from "next/navigation";
import Link from "next/link";
import { products } from "@/lib/catalog";
import { settings } from "@/lib/settings";
import { ProductDetail } from "@/components/shop/product-detail";
import { ProductCard } from "@/components/shop/product-card";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = (await products()).find((p) => p.slug === slug);
  return { title: p?.name ?? "Produkt nicht gefunden" };
}
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ color?: string }>;
}) {
  const { slug } = await params;
  const all = await products();
  const p = all.find((p) => p.slug === slug);
  if (!p) notFound();
  const s = await settings();
  return (
    <div className="section">
      <nav className="breadcrumb">
        <Link href="/">Startseite</Link> / <Link href="/shop">Shop</Link> /{" "}
        {p.name}
      </nav>
      <ProductDetail
        key={p.id + ((await searchParams).color ?? "")}
        product={p}
        shippingText={s.shippingText}
        initialColor={(await searchParams).color}
      />
      <section className="related">
        <h2>Passt zu deinem Style.</h2>
        <div className="product-grid">
          {all
            .filter((v) => v.id !== p.id)
            .slice(0, 4)
            .map((v) => (
              <ProductCard key={v.id} product={v} />
            ))}
        </div>
      </section>
    </div>
  );
}
