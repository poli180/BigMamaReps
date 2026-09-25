"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ShoppingBag, Truck, RotateCcw, X, ZoomIn, Check } from "lucide-react";
import type { ShopProduct } from "@/lib/catalog";
import { priceFor, money } from "@/lib/pricing";
import { useStore } from "./store-provider";
export function ProductDetail({
  product: p,
  shippingText,
  initialColor,
}: {
  product: ShopProduct;
  shippingText: string;
  initialColor?: string;
}) {
  const colors = [
    ...new Map(
      p.variants.filter((v) => v.active).map((v) => [v.color, v]),
    ).values(),
  ];
  const reduced = useReducedMotion();
  const [color, setColor] = useState(
    colors.find((v) => v.color === initialColor)?.color ??
      colors[0]?.color ??
      "",
  );
  const [size, setSize] = useState("");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [chart, setChart] = useState(false);
  const [added, setAdded] = useState(false);
  const store = useStore();
  const variants = p.variants.filter((v) => v.color === color && v.active);
  const variant = variants.find((v) => v.size === size);
  const images = (variant ?? variants[0])?.images ?? [];
  const price = priceFor(p, variant?.priceOverride);
  const available = variant ? variant.stock - variant.reserved : 0;
  function add() {
    if (!variant || available < 1) return;
    store.add({
      variantId: variant.id,
      name: p.name,
      color,
      size,
      image: images[0]?.url ?? "",
      price: price.price,
      quantity: 1,
      max: available,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }
  return (
    <div className="detail-grid">
      <div>
        <button
          className="detail-image"
          onClick={() => setZoom(true)}
          aria-label="Produktbild vergrößern"
        >
          {images[index] ? (
            <motion.span
              key={images[index].url}
              className="detail-media-motion"
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.24 }}
            >
              <Image
                src={images[index].url}
                alt={`${p.name} ${color}`}
                fill
                priority
                sizes="(max-width:800px) 100vw, 55vw"
              />
            </motion.span>
          ) : (
            <span>Bild folgt</span>
          )}
          <span className="zoom-icon">
            <ZoomIn size={20} />
          </span>
          {price.onSale && (
            <span className="badge sale detail-badge">
              SALE −{price.discount}%
            </span>
          )}
        </button>
        <div className="thumbnails">
          {images.map((image, i) => (
            <button
              key={image.url + i}
              className={index === i ? "selected" : ""}
              onClick={() => setIndex(i)}
              aria-label={`Ansicht ${i + 1}`}
            >
              <Image src={image.url} alt="" width={85} height={100} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">{p.category} / THE EVERYDAY COLLECTION</p>
        <h1>{p.name}</h1>
        <div className="detail-price">
          <strong>
            {p.id.startsWith("supplier-") && p.basePrice === 0
              ? "Preis folgt"
              : money(price.price)}
          </strong>
          {price.onSale && <del>{money(price.original)}</del>}
        </div>
        <p className="muted">
          {p.id.startsWith("supplier-") && p.basePrice === 0
            ? "Preis und Verfügbarkeit werden noch bestätigt."
            : "Endpreis zzgl. Versandkosten"}
        </p>
        <div
          className="rich-copy"
          dangerouslySetInnerHTML={{ __html: p.description }}
        />
        <div className="choice">
          <p>
            Farbe <strong>{color}</strong>
          </p>
          <div className="color-buttons">
            {colors.map((v) => (
              <button
                key={v.color}
                aria-label={v.color}
                aria-pressed={color === v.color}
                style={{ background: v.colorHex }}
                className={color === v.color ? "selected" : ""}
                onClick={() => {
                  setColor(v.color);
                  setSize("");
                  setIndex(0);
                }}
              />
            ))}
          </div>
        </div>
        <div className="choice">
          <div className="between">
            <p>
              Größe <strong>{size || "Bitte wählen"}</strong>
            </p>
            <button className="text-btn" onClick={() => setChart(true)}>
              Größenhilfe
            </button>
          </div>
          <div className="size-buttons">
            {variants.map((v) => (
              <button
                key={v.id}
                disabled={v.stock - v.reserved < 1}
                aria-pressed={size === v.size}
                className={size === v.size ? "selected" : ""}
                onClick={() => {
                  setSize(v.size);
                  setIndex(0);
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
        </div>
        <p className="stock">
          {!variant
            ? "Wähle deine Größe."
            : available === 0
              ? "Ausverkauft"
              : available <= 3
                ? `Nur noch ${available} auf Lager`
                : "Auf Lager – bereit für deinen Alltag"}
        </p>
        <button
          className="btn full add-button"
          disabled={!variant || available < 1}
          onClick={add}
        >
          <span className="add-button-icon">
            {added ? <Check size={19} /> : <ShoppingBag size={19} />}
          </span>
          <motion.span
            className="add-button-label"
            key={String(added)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          >
            {p.id.startsWith("supplier-") && p.basePrice === 0
              ? "Demnächst verfügbar"
              : added
                ? "Im Warenkorb"
                : "In den Warenkorb"}
          </motion.span>
        </button>
        <div className="detail-benefits">
          <p>
            <Truck size={18} />
            {shippingText}
          </p>
          <p>
            <RotateCcw size={18} />
            <a href="/legal/widerruf">Informationen zu Rückgabe & Widerruf</a>
          </p>
        </div>
        <details>
          <summary>Material & Details</summary>
          <p>{p.material}</p>
        </details>
        <details>
          <summary>Pflegehinweise</summary>
          <p>{p.care}</p>
        </details>
        <details>
          <summary>Versand & Rückgabe</summary>
          <p>
            {shippingText}. Weitere Informationen findest du unter{" "}
            <a href="/legal/versand">Versand</a>.
          </p>
        </details>
      </div>
      <Dialog.Root open={zoom} onOpenChange={setZoom}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="zoom-modal">
            <Dialog.Title className="sr-only">
              {p.name}: vergrößerte Ansicht
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Produktfoto in {color}
            </Dialog.Description>
            <Dialog.Close className="icon-btn close" aria-label="Schließen">
              <X />
            </Dialog.Close>
            {images[index] && (
              <Image src={images[index].url} alt={p.name} fill sizes="90vw" />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={chart} onOpenChange={setChart}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="search-modal">
            <Dialog.Title>Finde deine Größe</Dialog.Title>
            <Dialog.Description>
              Orientierung für unsere Beispielkollektion. Prüfe vor Verkauf die
              tatsächlichen Produktmaße.
            </Dialog.Description>
            <Dialog.Close className="icon-btn close" aria-label="Schließen">
              <X />
            </Dialog.Close>
            <table>
              <thead>
                <tr>
                  <th>Größe</th>
                  <th>Brustumfang</th>
                  <th>Passform</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "88–96 cm"],
                  ["M", "96–104 cm"],
                  ["L", "104–112 cm"],
                  ["XL", "112–120 cm"],
                ].map(([s, v]) => (
                  <tr key={s}>
                    <td>{s}</td>
                    <td>{v}</td>
                    <td>Relaxed</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
