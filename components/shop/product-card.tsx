"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import type { ShopProduct } from "@/lib/catalog";
import { priceFor, money } from "@/lib/pricing";
export function ProductCard({ product: p }: { product: ShopProduct }) {
  const variant = p.variants.find((v) => v.active) ?? p.variants[0];
  const image = variant?.images[0]?.url;
  const secondary = variant?.images[1]?.url;
  const price = priceFor(p, variant?.priceOverride);
  const colors = [
    ...new Map(p.variants.map((v) => [v.color, v.colorHex])).entries(),
  ];
  return (
    <article className="product-card">
      <Link
        href={`/product/${p.slug}`}
        className="product-image"
        aria-label={`${p.name} ansehen`}
      >
        {image ? (
          <>
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
          </>
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
          <Link href={`/product/${p.slug}`}>
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
            <span key={name} title={name} style={{ background: hex }} />
          ))}
        </div>
      </div>
    </article>
  );
}
