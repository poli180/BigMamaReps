import { categories } from "@/lib/categories";
import { products } from "@/lib/catalog";
import { CatalogGrid } from "@/components/shop/catalog-grid";
export const metadata = { title: "Shop" };
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  return (
    <div className="section catalog-page">
      <p className="eyebrow">FIND YOUR EVERYDAY</p>
      <h1>Der Shop.</h1>
      <p className="lead">Gute Pieces. Unendlich viele Möglichkeiten.</p>
      <CatalogGrid
        key={p.category ?? "all"}
        categoryNames={(await categories()).map((c) => c.name)}
        products={await products()}
        initialCategory={p.category}
        initialQuery={p.q}
        initialSort={p.sort}
      />
    </div>
  );
}
