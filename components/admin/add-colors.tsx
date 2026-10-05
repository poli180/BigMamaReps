"use client";
import { useState } from "react";
import type { ShopVariant } from "@/lib/catalog";
import {
  suggestedSizes,
  parseSizes,
  isShoeCategory,
} from "@/lib/variant-options";
const palette = [
  { name: "Schwarz", hex: "#222222" },
  { name: "Weiß", hex: "#ffffff" },
  { name: "Grau", hex: "#808080" },
  { name: "Beige", hex: "#d8c6a5" },
  { name: "Braun", hex: "#795548" },
  { name: "Blau", hex: "#2455a4" },
  { name: "Grün", hex: "#3c7550" },
  { name: "Rot", hex: "#c63535" },
  { name: "Rosa", hex: "#e8a5bc" },
  { name: "Gelb", hex: "#e5c54a" },
];
export function AddColors({
  variants,
  category,
  onAdd,
}: {
  variants: ShopVariant[];
  category: string;
  onAdd: (variants: ShopVariant[]) => void;
}) {
  const [colors, setColors] = useState<typeof palette>([]);
  const [custom, setCustom] = useState("");
  const [hex, setHex] = useState("#222222");
  const [sizes, setSizes] = useState("");
  const [feedback, setFeedback] = useState("");
  const options = [...palette];
  for (const v of variants)
    if (!options.some((c) => c.name.toLowerCase() === v.color.toLowerCase()))
      options.push({ name: v.color, hex: v.colorHex });
  for (const c of colors)
    if (!options.some((o) => o.name.toLowerCase() === c.name.toLowerCase()))
      options.push(c);
  const selectedSizes = parseSizes(sizes).filter(
    (size, index, all) =>
      all.findIndex((s) => s.toLowerCase() === size.toLowerCase()) === index,
  );
  const pending = colors.flatMap((c) =>
    selectedSizes
      .filter(
        (size) =>
          !variants.some(
            (v) =>
              v.color.toLowerCase() === c.name.toLowerCase() &&
              v.size.toLowerCase() === size.toLowerCase(),
          ),
      )
      .map((size) => ({ color: c, size })),
  );
  function addCustom() {
    const name = custom.trim();
    if (!name) return;
    if (!colors.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      setColors([...colors, { name, hex }]);
    setCustom("");
  }
  return (
    <div className="add-colors">
      <h3>1. Farben auswählen</h3>
      <p className="muted">
        Mehrere Farben anklicken – die Größen darunter gelten für alle
        ausgewählten Farben.
      </p>
      <div className="color-choices">
        {options.map((c) => (
          <button
            key={c.name}
            type="button"
            className="color-choice"
            aria-pressed={colors.some(
              (s) => s.name.toLowerCase() === c.name.toLowerCase(),
            )}
            onClick={() =>
              setColors((prev) =>
                prev.some((s) => s.name.toLowerCase() === c.name.toLowerCase())
                  ? prev.filter(
                      (s) => s.name.toLowerCase() !== c.name.toLowerCase(),
                    )
                  : [...prev, c],
              )
            }
          >
            <span style={{ backgroundColor: c.hex }} />
            {c.name}
          </button>
        ))}
      </div>
      <div className="custom-color">
        <label>
          Eigene Farbe
          <input
            value={custom}
            maxLength={60}
            placeholder="z. B. Dunkelblau"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
        </label>
        <label>
          Farbton
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn outline"
          disabled={!custom.trim()}
          onClick={addCustom}
        >
          Farbe auswählen
        </button>
      </div>
      <h3>2. Größen auswählen</h3>
      <div className="size-presets">
        {suggestedSizes(category).map((size) => (
          <button
            type="button"
            className="btn outline"
            key={size}
            aria-pressed={selectedSizes.includes(size)}
            onClick={() =>
              setSizes(
                (selectedSizes.includes(size)
                  ? selectedSizes.filter((s) => s !== size)
                  : [...selectedSizes, size]
                ).join(", "),
              )
            }
          >
            {isShoeCategory(category) ? `EU ${size}` : size}
          </button>
        ))}
      </div>
      <div className="form-row">
        <label>
          {isShoeCategory(category) ? "EU-Schuhgrößen" : "Größen"}
          <input
            value={sizes}
            placeholder="Eigene Größen mit Komma trennen"
            onChange={(e) => setSizes(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="text-btn"
          disabled={!variants.length}
          onClick={() =>
            setSizes([...new Set(variants.map((v) => v.size))].join(", "))
          }
        >
          Vorhandene Größen übernehmen
        </button>
      </div>
      <p className="muted">
        {colors.length} Farben · {selectedSizes.length} Größen ·{" "}
        {pending.length} neue Varianten. Bestehende Kombinationen bleiben
        erhalten. Neue Varianten starten mit Bestand 0.
      </p>
      <button
        type="button"
        className="btn"
        disabled={!pending.length || variants.length + pending.length > 150}
        onClick={() => {
          onAdd(
            pending.map(({ color: c, size }) => {
              const existing = variants.find(
                (v) => v.color.toLowerCase() === c.name.toLowerCase(),
              );
              return {
                id: "",
                color: existing?.color ?? c.name,
                colorHex: existing?.colorHex ?? c.hex,
                size,
                sku: `BMR-${crypto.randomUUID()}`,
                stock: 0,
                reserved: 0,
                priceOverride: null,
                active: true,
                images: existing?.images ?? [],
              };
            }),
          );
          setFeedback(
            `${pending.length} Varianten hinzugefügt. Zum Veröffentlichen oben speichern.`,
          );
          setColors([]);
        }}
      >
        {" "}
        {pending.length || "Neue"} Varianten hinzufügen
      </button>
      {variants.length + pending.length > 150 && (
        <p role="alert" className="form-error">
          Maximal 150 Varianten pro Produkt. Bitte weniger Farben oder Größen
          auswählen.
        </p>
      )}
      {feedback && (
        <p role="status" className="save-success">
          {feedback}
        </p>
      )}
      <datalist id="variant-sizes">
        {suggestedSizes(category).map((size) => (
          <option key={size} value={size} />
        ))}
      </datalist>
    </div>
  );
}
