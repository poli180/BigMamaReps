"use client";
import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { ShopProduct } from "@/lib/catalog";
import { priceFor, money } from "@/lib/pricing";
export function ProductCard({ product: p }: { product: ShopProduct }) {
  const [selectedColor, setSelectedColor] = useState("");
  const reduced = useReducedMotion();
  const variant =
    p.variants.find((v) => v.active && v.color === selectedColor) ??
    p.variants.find((v) => v.active) ??
    p.variants[0];
  const href = `/product/${p.slug}${selectedColor ? `?color=${encodeURIComponent(selectedColor)}` : ""}`;
  const image = variant?.images[0]?.url;
  const secondary = variant?.images[1]?.url;
  const price = priceFor(p, variant?.priceOverride);
  const colors = [
    ...new Map(
      p.variants.filter((v) => v.active).map((v) => [v.color, v.colorHex]),
    ).entries(),
  ];
  return (
    <article className="product-card">
      <Link
        href={href}
        className="product-image"
        aria-label={`${p.name} ansehen`}
      >
        {image ? (
          <motion.div
            key={variant.color}
            className="product-media-motion"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          >
            <Image
              src={image}
              alt={`${p.name} in ${variant.color}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"
            />
            {secondary && (
              <Image
                className="secondary-image"
                src={secondary}
                alt="Weitere Ansicht"
                fill
                sizes="25vw"
              />
            )}
          </motion.div>
        ) : (
          <div className="image-placeholder">BMR®</div>
        )}
        <div className="product-badges">
          {price.onSale ? (
            <span className="badge sale">−{price.discount}%</span>
          ) : p.featured ? (
            <span className="badge">ESSENTIAL</span>
          ) : null}
        </div>
        <span className="quick-view">
          <Plus size={18} />
        </span>
      </Link>
      <div className="product-info">
        <div>
          <p>{p.category}</p>
          <Link href={href}>
            <h3>{p.name}</h3>
          </Link>
        </div>
        <ArrowUpRight size={17} />
      </div>
      <div className="between">
        <div className="product-price">
          <span className={price.onSale ? "sale-price" : ""}>
            {money(price.price)}
          </span>
          {price.onSale && <del>{money(price.original)}</del>}
        </div>
        <div className="swatches">
          {colors.map(([name, hex]) => (
            <button
              key={name}
              className="color-preview"
              title={name}
              aria-label={`${p.name} in ${name} anzeigen`}
              aria-pressed={variant?.color === name}
              onClick={() => setSelectedColor(name)}
            >
              <span style={{ background: hex }} />
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
