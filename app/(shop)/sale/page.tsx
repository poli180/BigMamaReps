import { categories } from "@/lib/categories";
import { products } from "@/lib/catalog";
import { CatalogGrid } from "@/components/shop/catalog-grid";
export const metadata = { title: "Sale" };
export default async function Sale() {
  return (
    <div className="section catalog-page">
      <p className="eyebrow">THE GOOD FINDS</p>
      <h1>Mehr Style. Weniger Preis.</h1>
      <p className="lead">
        Aktuelle Angebote, solange dein Lieblingsstück noch da ist.
      </p>
      <CatalogGrid
        key={"sale"}
        categoryNames={(await categories()).map((c) => c.name)}
        products={await products()}
        saleOnly
      />
    </div>
  );
}
