"use client";
import { useState } from "react";
import type { ShopProduct } from "@/lib/catalog";
import { priceFor } from "@/lib/pricing";
import { ProductCard } from "./product-card";
import { Reveal } from "./motion";
import { SlidersHorizontal, X } from "lucide-react";
export function CatalogGrid({
  products,
  initialCategory = "",
  initialQuery = "",
  saleOnly = false,
  initialSort = "new",
}: {
  products: ShopProduct[];
  initialCategory?: string;
  initialQuery?: string;
  saleOnly?: boolean;
  initialSort?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState(initialQuery);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [max, setMax] = useState(500);
  const [sale, setSale] = useState(saleOnly);
  const [sort, setSort] = useState(initialSort);
  const [filters, setFilters] = useState(false);
  const categories = [...new Set(products.map((p) => p.category))];
  const colors = [
    ...new Set(products.flatMap((p) => p.variants.map((v) => v.color))),
  ];
  const sizes = [
    ...new Set(products.flatMap((p) => p.variants.map((v) => v.size))),
  ];
  let filtered = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!q ||
        `${p.name} ${p.category}`.toLowerCase().includes(q.toLowerCase())) &&
      p.variants.some(
        (v) => (!size || v.size === size) && (!color || v.color === color),
      ) &&
      priceFor(p).price <= max &&
      (!sale || priceFor(p).onSale),
  );
  filtered = [...filtered].sort((a, b) =>
    sort === "price-up"
      ? priceFor(a).price - priceFor(b).price
      : sort === "price-down"
        ? priceFor(b).price - priceFor(a).price
        : sort === "discount"
          ? priceFor(b).discount - priceFor(a).discount
          : sort === "popular"
            ? (b.sold ?? 0) - (a.sold ?? 0)
            : +new Date(b.createdAt) - +new Date(a.createdAt),
  );
  const reset = () => {
    setQ("");
    setCategory("");
    setSize("");
    setColor("");
    setMax(500);
    setSale(saleOnly);
  };
  return (
    <>
      <div className="category-pills">
        <button
          className={!category ? "selected" : ""}
          onClick={() => setCategory("")}
        >
          Alle Produkte
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "selected" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="catalog-toolbar">
        <button
          className="filter-toggle"
          onClick={() => setFilters(!filters)}
          aria-expanded={filters}
        >
          <SlidersHorizontal size={16} /> Filter {filters && <X size={14} />}
        </button>
        <span className="muted">{filtered.length} Produkte</span>
        <label className="sort">
          Sortieren nach{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">Neueste zuerst</option>
            <option value="price-up">Preis aufsteigend</option>
            <option value="price-down">Preis absteigend</option>
            <option value="popular">Beliebtheit</option>
            <option value="discount">Größter Rabatt</option>
          </select>
        </label>
      </div>
      {filters && (
        <div className="filters">
          <label>
            Suche
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Produktname"
            />
          </label>
          <label>
            Größe
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="">Alle Größen</option>
              {sizes.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Farbe
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              <option value="">Alle Farben</option>
              {colors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Preis bis {max} €
            <input
              type="range"
              min="10"
              max="500"
              step="5"
              value={max}
              onChange={(e) => setMax(+e.target.value)}
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={sale}
              disabled={saleOnly}
              onChange={(e) => setSale(e.target.checked)}
            />
            Nur Sale
          </label>
          <button className="text-btn" onClick={reset}>
            Zurücksetzen
          </button>
        </div>
      )}
      {filtered.length ? (
        <div className="product-grid">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 3) * 0.05}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>Hier ist es gerade etwas leer.</h2>
          <p>Versuche andere Filter oder einen neuen Suchbegriff.</p>
          <button className="btn" onClick={reset}>
            Filter zurücksetzen
          </button>
        </div>
      )}
    </>
  );
}
