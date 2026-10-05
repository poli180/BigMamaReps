"use client";
import { useState } from "react";
import type { ShopVariant } from "@/lib/catalog";
import { isShoeCategory } from "@/lib/variant-options";

export function VariantCards({
  variants,
  category,
  onChange,
}: {
  variants: ShopVariant[];
  category: string;
  onChange: (variants: ShopVariant[]) => void;
}) {
  const [allStock, setAllStock] = useState("");
  const [feedback, setFeedback] = useState("");
  const [invalid, setInvalid] = useState(false);
  function applyAllStock() {
    const amount = Number(allStock);
    if (
      !allStock.trim() ||
      !Number.isInteger(amount) ||
      amount < 0 ||
      amount > 1000000
    ) {
      setInvalid(true);
      setFeedback("Bitte eine ganze Zahl zwischen 0 und 1.000.000 eingeben.");
      return;
    }
    const minimum = Math.max(0, ...variants.map((v) => v.reserved));
    if (amount < minimum) {
      setInvalid(true);
      setFeedback(
        `Mindestens ${minimum} Stück erforderlich: Eine Variante hat bereits so viele reservierte Artikel. Es wurde nichts geändert.`,
      );
      return;
    }
    onChange(variants.map((v) => ({ ...v, stock: amount })));
    setInvalid(false);
    setFeedback(
      `Bestand auf ${amount} Stück je Variante gesetzt (${variants.length} Varianten). Zum Veröffentlichen oben speichern.`,
    );
  }
  const groups = [...new Set(variants.map((v) => v.color))];
  return (
    <div className="variant-cards">
      {variants.length > 0 && (
        <section className="variant-color-card">
          <h3>Bestand für alle Varianten</h3>
          <p className="muted">
            Gilt für alle {variants.length} Varianten dieses Produkts – über
            alle Farben und Größen. Die Menge wird pro Variante gesetzt, nicht
            aufgeteilt.
          </p>
          <div className="variant-bulk-stock">
            <label>
              Stück je Variante
              <input
                type="number"
                min="0"
                max="1000000"
                step="1"
                value={allStock}
                placeholder="z. B. 10"
                onChange={(e) => setAllStock(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyAllStock();
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="btn"
              disabled={!allStock.trim()}
              onClick={applyAllStock}
            >
              Auf alle Varianten anwenden
            </button>
          </div>
          {feedback && (
            <p
              role={invalid ? "alert" : "status"}
              className={invalid ? "form-error" : "save-success"}
            >
              {feedback}
            </p>
          )}
        </section>
      )}
      {groups.map((color) => (
        <ColorCard
          key={color}
          color={color}
          variants={variants}
          category={category}
          onChange={onChange}
        />
      ))}
      {!variants.length && (
        <p className="muted">
          Wähle oben eine Farbe und die gewünschten Größen aus.
        </p>
      )}
    </div>
  );
}
function ColorCard({
  color,
  variants,
  category,
  onChange,
}: {
  color: string;
  variants: ShopVariant[];
  category: string;
  onChange: (variants: ShopVariant[]) => void;
}) {
  const [name, setName] = useState(color);
  const [stock, setStock] = useState("");
  const [error, setError] = useState("");
  const group = variants.filter((v) => v.color === color);
  const patch = (target: ShopVariant, changes: Partial<ShopVariant>) =>
    onChange(variants.map((v) => (v === target ? { ...v, ...changes } : v)));
  function rename() {
    const next = name.trim();
    if (
      !next ||
      (next.toLowerCase() !== color.toLowerCase() &&
        variants.some((v) => v.color.toLowerCase() === next.toLowerCase()))
    ) {
      setError("Bitte einen eindeutigen Farbnamen eingeben.");
      setName(color);
      return;
    }
    setError("");
    onChange(
      variants.map((v) => (v.color === color ? { ...v, color: next } : v)),
    );
  }
  return (
    <section className="variant-color-card">
      <div className="variant-color-heading">
        <label>
          Farbe
          <input
            aria-label={`Farbe ${color}`}
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onBlur={rename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                rename();
              }
            }}
          />
        </label>
        <label>
          Farbton
          <input
            type="color"
            aria-label={`Farbton ${color}`}
            value={group[0].colorHex}
            onChange={(e) =>
              onChange(
                variants.map((v) =>
                  v.color === color ? { ...v, colorHex: e.target.value } : v,
                ),
              )
            }
          />
        </label>
        <span>{group.length} Größen</span>
      </div>
      <div className="variant-bulk-stock">
        <label>
          Bestand für alle Größen
          <input
            type="number"
            min="0"
            max="1000000"
            step="1"
            value={stock}
            placeholder="z. B. 10"
            onChange={(e) => setStock(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn outline"
          disabled={!stock}
          onClick={() => {
            const amount = Number(stock);
            if (
              !Number.isInteger(amount) ||
              amount < 0 ||
              amount > 1000000 ||
              group.some((v) => v.reserved > amount)
            ) {
              setError(
                "Der Bestand muss eine ganze Zahl sein und darf nicht unter reservierten Mengen liegen.",
              );
              return;
            }
            setError("");
            onChange(
              variants.map((v) =>
                v.color === color ? { ...v, stock: amount } : v,
              ),
            );
          }}
        >
          Übernehmen
        </button>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {group.map((v) => (
        <div className="variant-size-row" key={v.id || v.sku}>
          <label>
            {isShoeCategory(category) ? "EU-Größe" : "Größe"}
            <input
              required
              list="variant-sizes"
              value={v.size}
              maxLength={20}
              onChange={(e) => patch(v, { size: e.target.value })}
            />
          </label>
          <label>
            Bestand
            <input
              type="number"
              required
              min={v.reserved}
              max="1000000"
              value={v.stock}
              onChange={(e) => patch(v, { stock: Number(e.target.value) })}
            />
            <small>{v.reserved} reserviert</small>
          </label>
          <label className="variant-active">
            <input
              type="checkbox"
              checked={v.active}
              onChange={(e) => patch(v, { active: e.target.checked })}
            />
            Aktiv
          </label>
          <button
            type="button"
            className="text-btn"
            disabled={v.reserved > 0}
            onClick={() => onChange(variants.filter((row) => row !== v))}
            aria-label={`${color} ${v.size} entfernen`}
          >
            Entfernen
          </button>
          <details className="variant-extra">
            <summary>SKU & abweichender Preis</summary>
            <div className="form-row">
              <label>
                SKU
                <input
                  required
                  value={v.sku}
                  onChange={(e) => patch(v, { sku: e.target.value })}
                />
              </label>
              <label>
                Eigener Preis (€)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Produktpreis verwenden"
                  value={v.priceOverride ?? ""}
                  onChange={(e) =>
                    patch(v, {
                      priceOverride:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          </details>
        </div>
      ))}
    </section>
  );
}
