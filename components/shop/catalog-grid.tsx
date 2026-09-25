"use client";
import { useId, useState } from "react";
import type { ShopProduct } from "@/lib/catalog";
import { priceFor } from "@/lib/pricing";
import { ProductCard } from "./product-card";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
export function CatalogGrid({
  products,
  categoryNames,
  initialCategory = "",
  initialQuery = "",
  saleOnly = false,
  initialSort = "new",
}: {
  products: ShopProduct[];
  categoryNames?: string[];
  initialCategory?: string;
  initialQuery?: string;
  saleOnly?: boolean;
  initialSort?: string;
}) {
  const groupId = useId();
  const reduced = useReducedMotion();
  const [category, setCategory] = useState(initialCategory);
  const [q, setQ] = useState(initialQuery);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [max, setMax] = useState(500);
  const [sale, setSale] = useState(saleOnly);
  const [sort, setSort] = useState(initialSort);
  const [filters, setFilters] = useState(false);
  const categories = categoryNames ?? [
    ...new Set(products.map((p) => p.category)),
  ];
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
      <LayoutGroup id={groupId}>
        <div className="category-pills catalog-categories">
          <button
            className={!category ? "selected" : ""}
            aria-pressed={!category}
            onClick={() => setCategory("")}
          >
            {!category && (
              <motion.span
                className="category-indicator"
                layoutId="selected-category"
                transition={{
                  duration: reduced ? 0 : 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            )}
            <span className="category-label">Alle Produkte</span>
          </button>
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {category === c && (
                <motion.span
                  className="category-indicator"
                  layoutId="selected-category"
                  transition={{
                    duration: reduced ? 0 : 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
              <span className="category-label">{c}</span>
            </button>
          ))}
        </div>
      </LayoutGroup>
      <div className="catalog-toolbar">
        <button
          className="filter-toggle"
          onClick={() => setFilters(!filters)}
          aria-expanded={filters}
        >
          <SlidersHorizontal size={16} /> Filter {filters && <X size={14} />}
        </button>
        <span className="muted result-count" role="status" aria-live="polite">
          <motion.span
            key={filtered.length}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            {filtered.length}
          </motion.span>{" "}
          Produkte
        </span>
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
      <AnimatePresence initial={false}>
        {filters && (
          <motion.div
            className="filter-reveal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
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
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                >
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
          </motion.div>
        )}
      </AnimatePresence>
      {filtered.length ? (
        <div className="product-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <motion.div
                className="catalog-card-motion"
                layout={reduced ? false : "position"}
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{
                  duration: reduced ? 0 : 0.24,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </AnimatePresence>
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
