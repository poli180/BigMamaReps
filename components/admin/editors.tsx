"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Check,
  GripVertical,
  Bold,
  Italic,
  List,
} from "lucide-react";
import type { ShopProduct, ShopVariant } from "@/lib/catalog";
import type { Settings } from "@/lib/settings";
import { priceFor, money } from "@/lib/pricing";
type Message = { error?: string; ok?: string };
async function save(url: string, data: unknown) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const b = await r.json();
  if (!r.ok) throw new Error(b.error ?? "Speichern fehlgeschlagen.");
  return b;
}
function Feedback({ message }: { message: Message }) {
  return message.error ? (
    <p className="form-error" role="alert">
      {message.error}
    </p>
  ) : message.ok ? (
    <p className="save-success" role="status">
      <Check size={16} />
      {message.ok}
    </p>
  ) : null;
}
export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {[
          ["bold", Bold],
          ["italic", Italic],
          ["insertUnorderedList", List],
        ].map(([cmd, Icon]) => {
          const I = Icon as typeof Bold;
          return (
            <button
              type="button"
              key={String(cmd)}
              aria-label={String(cmd)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                ref.current?.focus();
                document.execCommand(String(cmd));
                if (ref.current) onChange(ref.current.innerHTML);
              }}
            >
              <I size={16} />
            </button>
          );
        })}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Formatierter Text"
        aria-multiline
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: value }}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
      />
    </div>
  );
}
function StableRichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [initial] = useState(value);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {[
          ["bold", "Fett"],
          ["italic", "Kursiv"],
          ["insertUnorderedList", "Liste"],
        ].map(([cmd, label]) => (
          <button
            type="button"
            key={cmd}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              ref.current?.focus();
              document.execCommand(cmd);
              if (ref.current) onChange(ref.current.innerHTML);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Formatierter Inhalt"
        aria-multiline
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: initial }}
      />
    </div>
  );
}
export function MediaUpload({
  onUploaded,
  multiple = false,
  video = false,
}: {
  onUploaded: (urls: string[]) => void;
  multiple?: boolean;
  video?: boolean;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setProgress(0);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const result = await save("/api/admin/upload", {
          type: file.type,
          size: file.size,
        });
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", result.uploadUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable)
              setProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () =>
            xhr.status < 300
              ? resolve()
              : reject(
                  new Error("Upload fehlgeschlagen. Speicher-CORS prüfen."),
                );
          xhr.onerror = () =>
            reject(new Error("Verbindung zum Speicher fehlgeschlagen."));
          xhr.send(file);
        });
        urls.push(result.url);
      }
      onUploaded(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen.");
    } finally {
      setProgress(null);
    }
  }
  return (
    <div
      className="upload-box"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <Upload size={20} />
      <label>
        Dateien auswählen oder hier ablegen
        <input
          type="file"
          accept={
            video ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp"
          }
          multiple={multiple}
          disabled={progress !== null}
          onChange={(e) => void upload(e.target.files)}
        />
      </label>
      <small>
        {video
          ? "MP4 / WebM, maximal 100 MB"
          : "JPG / PNG / WebP, maximal 10 MB pro Bild"}
      </small>
      {progress !== null && (
        <>
          <progress max="100" value={progress} />
          <span>{progress}%</span>
        </>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
const emptyProduct: ShopProduct = {
  id: "",
  slug: "",
  name: "",
  description: "<p></p>",
  category: "Hoodies",
  material: "",
  care: "",
  basePrice: 0,
  salePrice: null,
  onSale: false,
  saleStart: null,
  saleEnd: null,
  active: false,
  featured: false,
  createdAt: "",
  variants: [],
};
export function ProductEditor({ initial }: { initial?: ShopProduct }) {
  const [p, setP] = useState<ShopProduct>(initial ?? emptyProduct);
  const [message, setMessage] = useState<Message>({});
  const [busy, setBusy] = useState(false);
  const [color, setColor] = useState("Black");
  const [hex, setHex] = useState("#222222");
  const [sizes, setSizes] = useState("S, M, L, XL");
  const router = useRouter();
  function field<K extends keyof ShopProduct>(key: K, value: ShopProduct[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }
  function updateVariant(index: number, patch: Partial<ShopVariant>) {
    setP((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      ),
    }));
  }
  function addMatrix() {
    if (!color.trim()) return;
    setP((prev) => {
      const additions = sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter(
          (size) =>
            !prev.variants.some((v) => v.color === color && v.size === size),
        );
      return {
        ...prev,
        variants: [
          ...prev.variants,
          ...additions.map((size) => ({
            id: "",
            color,
            colorHex: hex,
            size,
            sku: `${prev.slug || "BMR"}-${color}-${size}-${crypto.randomUUID().slice(0, 4)}`,
            stock: 0,
            reserved: 0,
            priceOverride: null,
            active: true,
            images: [],
          })),
        ],
      };
    });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage({});
    try {
      const result = await save("/api/admin/products", {
        ...p,
        id: p.id || undefined,
        variants: p.variants.map((v) => ({ ...v, id: v.id || undefined })),
      });
      setMessage({ ok: "Produkt gespeichert." });
      if (!p.id) router.replace(`/admin/products/${result.id}`);
      router.refresh();
    } catch (e) {
      setMessage({
        error: e instanceof Error ? e.message : "Speichern fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }
  const colorGroups = [...new Set(p.variants.map((v) => v.color))];
  return (
    <form onSubmit={submit} className="admin-editor">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">KATALOG</p>
          <h1>{p.id ? "Produkt bearbeiten" : "Neues Produkt"}</h1>
        </div>
        <button className="btn" disabled={busy}>
          <Save size={16} />
          {busy ? "Speichert …" : "Speichern"}
        </button>
      </div>
      <Feedback message={message} />
      <div className="editor-columns">
        <div>
          <section className="panel">
            <h2>Produktinformationen</h2>
            <label>
              Name
              <input
                required
                value={p.name}
                onChange={(e) => {
                  field("name", e.target.value);
                  if (
                    !p.id &&
                    (!p.slug ||
                      p.slug ===
                        p.name
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""))
                  )
                    field(
                      "slug",
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    );
                }}
              />
            </label>
            <div className="form-row">
              <label>
                URL-Name
                <input
                  required
                  value={p.slug}
                  onChange={(e) => field("slug", e.target.value)}
                />
              </label>
              <label>
                Kategorie
                <input
                  required
                  value={p.category}
                  onChange={(e) => field("category", e.target.value)}
                />
              </label>
            </div>
            <label>
              Beschreibung
              <StableRichEditor
                value={p.description}
                onChange={(v) => field("description", v)}
              />
            </label>
            <label>
              Material
              <textarea
                value={p.material}
                onChange={(e) => field("material", e.target.value)}
              />
            </label>
            <label>
              Pflegehinweise
              <textarea
                value={p.care}
                onChange={(e) => field("care", e.target.value)}
              />
            </label>
          </section>
          <section className="panel">
            <h2>Varianten & Bestand</h2>
            <p className="muted">
              Farbe hinzufügen und Größen als Matrix erzeugen. Bestand
              bezeichnet die physisch vorhandene Menge.
            </p>
            <div className="matrix-form">
              <label>
                Farbe
                <input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </label>
              <label>
                Farbwert
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                />
              </label>
              <label>
                Größen (mit Komma)
                <input
                  value={sizes}
                  onChange={(e) => setSizes(e.target.value)}
                />
              </label>
              <button type="button" className="btn outline" onClick={addMatrix}>
                <Plus size={16} />
                Erzeugen
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Aktiv</th>
                    <th>Farbe / Größe</th>
                    <th>SKU</th>
                    <th>Bestand</th>
                    <th>Reserviert</th>
                    <th>Preis optional</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {p.variants.map((v, i) => (
                    <tr key={v.id || `new-${i}`}>
                      <td>
                        <input
                          type="checkbox"
                          checked={v.active}
                          onChange={(e) =>
                            updateVariant(i, { active: e.target.checked })
                          }
                        />
                      </td>
                      <td>
                        {v.color} / {v.size}
                      </td>
                      <td>
                        <input
                          aria-label={`SKU ${v.color} ${v.size}`}
                          value={v.sku}
                          onChange={(e) =>
                            updateVariant(i, { sku: e.target.value })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Bestand ${v.color} ${v.size}`}
                          type="number"
                          min={v.reserved}
                          value={v.stock}
                          onChange={(e) =>
                            updateVariant(i, { stock: +e.target.value })
                          }
                        />
                      </td>
                      <td>{v.reserved}</td>
                      <td>
                        <input
                          aria-label={`Preis ${v.color} ${v.size}`}
                          type="number"
                          min="0"
                          step=".01"
                          value={v.priceOverride ?? ""}
                          onChange={(e) =>
                            updateVariant(i, {
                              priceOverride:
                                e.target.value === "" ? null : +e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          aria-label="Variante entfernen"
                          onClick={() =>
                            field(
                              "variants",
                              p.variants.filter((_, n) => n !== i),
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {colorGroups.map((group) => {
            const images = p.variants.find((v) => v.color === group)!.images;
            const update = (urls: string[]) =>
              setP((prev) => ({
                ...prev,
                variants: prev.variants.map((v) =>
                  v.color === group
                    ? {
                        ...v,
                        images: urls.map((url, order) => ({ url, order })),
                      }
                    : v,
                ),
              }));
            const reorder = (from: number, to: number) => {
              if (to < 0 || to >= images.length) return;
              const list = images.map((i) => i.url);
              const [url] = list.splice(from, 1);
              list.splice(to, 0, url);
              update(list);
            };
            return (
              <section key={group} className="panel">
                <h2>Bilder: {group}</h2>
                <MediaUpload
                  multiple
                  onUploaded={(urls) =>
                    update([...images.map((i) => i.url), ...urls])
                  }
                />
                <div className="media-list">
                  {images.map((image, i) => (
                    <div
                      key={image.url + i}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", String(i))
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        reorder(
                          Number(e.dataTransfer.getData("text/plain")),
                          i,
                        );
                      }}
                    >
                      <GripVertical size={15} />
                      <img src={image.url} alt={`${group} ${i + 1}`} />
                      <span>Bild {i + 1}</span>
                      <button
                        type="button"
                        aria-label="Bild nach vorne"
                        onClick={() => reorder(i, i - 1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Bild nach hinten"
                        onClick={() => reorder(i, i + 1)}
                      >
                        <ArrowDown size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Bild entfernen"
                        onClick={() =>
                          update(
                            images.filter((_, n) => n !== i).map((v) => v.url),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <label>
                  Bild per HTTPS-URL hinzufügen
                  <input
                    type="url"
                    placeholder="https://…"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (e.currentTarget.value.startsWith("https://")) {
                          update([
                            ...images.map((i) => i.url),
                            e.currentTarget.value,
                          ]);
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </label>
                <p className="muted">
                  Mit Enter hinzufügen. Bilder gelten für alle Größen dieser
                  Farbe.
                </p>
              </section>
            );
          })}
        </div>
        <aside>
          <section className="panel">
            <h2>Veröffentlichung</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={p.active}
                onChange={(e) => field("active", e.target.checked)}
              />
              Im Shop sichtbar
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) => field("featured", e.target.checked)}
              />
              Auf Startseite hervorheben
            </label>
          </section>
          <section className="panel">
            <h2>Preis & Aktion</h2>
            <label>
              Basispreis (€)
              <input
                required
                type="number"
                min="0"
                step=".01"
                value={p.basePrice}
                onChange={(e) => field("basePrice", +e.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={p.onSale}
                onChange={(e) => field("onSale", e.target.checked)}
              />
              Sale aktivieren
            </label>
            {p.onSale && (
              <>
                <label>
                  Sale-Preis (€)
                  <input
                    type="number"
                    min="0"
                    step=".01"
                    value={p.salePrice ?? ""}
                    onChange={(e) =>
                      field(
                        "salePrice",
                        e.target.value === "" ? null : +e.target.value,
                      )
                    }
                  />
                </label>
                <label>
                  Rabatt (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      p.salePrice !== null && p.basePrice
                        ? Math.round((1 - p.salePrice / p.basePrice) * 100)
                        : ""
                    }
                    onChange={(e) =>
                      field(
                        "salePrice",
                        Math.round(
                          p.basePrice * (1 - +e.target.value / 100) * 100,
                        ) / 100,
                      )
                    }
                  />
                </label>
                {(["saleStart", "saleEnd"] as const).map((key) => (
                  <label key={key}>
                    {key === "saleStart" ? "Start" : "Ende"} (UTC)
                    <input
                      type="datetime-local"
                      value={p[key]?.slice(0, 16) ?? ""}
                      onChange={(e) =>
                        field(
                          key,
                          e.target.value
                            ? new Date(e.target.value + "Z").toISOString()
                            : null,
                        )
                      }
                    />
                  </label>
                ))}
                <div className="sale-preview">
                  <span className="badge sale">SALE</span>
                  <strong>{money(p.salePrice ?? p.basePrice)}</strong>
                  <del>{money(p.basePrice)}</del>
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
    </form>
  );
}
export function SettingsEditor({
  initial,
  mode,
}: {
  initial: Settings;
  mode: "content" | "settings";
}) {
  const [s, setS] = useState(initial);
  const [message, setMessage] = useState<Message>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  function field<K extends keyof Settings>(k: K, v: Settings[K]) {
    setS((prev) => ({ ...prev, [k]: v }));
  }
  function input(k: keyof Settings, title: string, type = "text") {
    return (
      <label>
        {title}
        <input
          type={type}
          value={String(s[k])}
          onChange={(e) =>
            field(
              k,
              (type === "number" ? +e.target.value : e.target.value) as never,
            )
          }
          step={type === "number" ? ".01" : undefined}
          min={type === "number" ? 0 : undefined}
        />
      </label>
    );
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage({});
    try {
      await save("/api/admin/settings", s);
      setMessage({ ok: "Änderungen sind gespeichert und im Shop sichtbar." });
      router.refresh();
    } catch (e) {
      setMessage({
        error: e instanceof Error ? e.message : "Speichern fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">DEIN SHOP</p>
          <h1>{mode === "content" ? "Inhalte & Design" : "Einstellungen"}</h1>
        </div>
        <button className="btn" disabled={busy}>
          <Save size={16} />
          {busy ? "Speichert …" : "Speichern"}
        </button>
      </div>
      <Feedback message={message} />
      {mode === "content" ? (
        <>
          <section className="panel">
            <h2>Hero-Bereich</h2>
            <label>
              Hintergrund
              <select
                value={s.heroType}
                onChange={(e) => {
                  field("heroType", e.target.value);
                  field("heroUrl", "");
                }}
              >
                <option value="image">Bild</option>
                <option value="video">Video</option>
              </select>
            </label>
            <MediaUpload
              key={s.heroType}
              video={s.heroType === "video"}
              onUploaded={(urls) => field("heroUrl", urls[0])}
            />
            {input("heroUrl", "Medien-URL")}
            {s.heroType === "video" && (
              <>
                {input("heroPoster", "Poster-Bild URL")}
                <MediaUpload
                  onUploaded={(urls) => field("heroPoster", urls[0])}
                />
                <p className="muted">
                  Videos vor dem Upload als H.264 MP4/WebM optimieren. Es
                  erfolgt keine automatische Transkodierung.
                </p>
              </>
            )}
            <div className="hero-admin-preview">
              {s.heroUrl ? (
                s.heroType === "video" ? (
                  <video
                    src={s.heroUrl}
                    poster={s.heroPoster}
                    muted
                    controls
                    preload="metadata"
                  />
                ) : (
                  <img src={s.heroUrl} alt="Hero-Vorschau" />
                )
              ) : (
                <div className="hero-placeholder">
                  Noch kein Hero-{s.heroType === "video" ? "Video" : "Bild"}{" "}
                  hinterlegt
                </div>
              )}
              <span>{s.heroTitle}</span>
            </div>
            <label>
              Headline (Zeilenumbruch erlaubt)
              <textarea
                value={s.heroTitle}
                onChange={(e) => field("heroTitle", e.target.value)}
              />
            </label>
            {input("heroSubtitle", "Unterzeile")}
            <div className="form-row">
              {input("heroCta", "Button-Text")}
              {input("heroLink", "Button-Link (interner Pfad)")}
            </div>
          </section>
          <section className="panel">
            <h2>Startseite & Marke</h2>
            {input("announcement", "Hinweisleiste")}
            {input("saleTitle", "Titel der Aktionen-Sektion")}
            {input("logoUrl", "Logo-URL")}
            <MediaUpload onUploaded={(urls) => field("logoUrl", urls[0])} />
            <div className="form-row">
              {input("primaryColor", "Primärfarbe", "color")}
              {input("accentColor", "Akzentfarbe", "color")}
            </div>
            {input("footerText", "Footer-Text")}
            {input("instagram", "Instagram-URL")}
            {input("tiktok", "TikTok-URL")}
            <p className="muted">
              Featured-Produkte über den Schalter im Produkteditor auswählen.
              Kategorien entstehen aus deinen Produkten.
            </p>
          </section>
          <section className="panel">
            <h2>Kategorie-Banner</h2>
            <p className="muted">
              Ohne eigene Banner verwendet die Startseite die ersten drei
              Produktkategorien.
            </p>
            {s.categoryBanners.map((banner, i) => (
              <div className="category-banner-editor" key={i}>
                <div className="form-row">
                  <label>
                    Kategorie
                    <input
                      value={banner.category}
                      onChange={(e) =>
                        field(
                          "categoryBanners",
                          s.categoryBanners.map((b, n) =>
                            n === i ? { ...b, category: e.target.value } : b,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Anzeigetitel
                    <input
                      value={banner.title}
                      onChange={(e) =>
                        field(
                          "categoryBanners",
                          s.categoryBanners.map((b, n) =>
                            n === i ? { ...b, title: e.target.value } : b,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  Bild-URL
                  <input
                    value={banner.image}
                    onChange={(e) =>
                      field(
                        "categoryBanners",
                        s.categoryBanners.map((b, n) =>
                          n === i ? { ...b, image: e.target.value } : b,
                        ),
                      )
                    }
                  />
                </label>
                <MediaUpload
                  onUploaded={(urls) =>
                    field(
                      "categoryBanners",
                      s.categoryBanners.map((b, n) =>
                        n === i ? { ...b, image: urls[0] } : b,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="text-btn"
                  onClick={() =>
                    field(
                      "categoryBanners",
                      s.categoryBanners.filter((_, n) => n !== i),
                    )
                  }
                >
                  Banner entfernen
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn outline"
              onClick={() =>
                field("categoryBanners", [
                  ...s.categoryBanners,
                  { category: "", title: "", image: "" },
                ])
              }
            >
              Banner hinzufügen
            </button>
          </section>
          <section className="panel">
            <h2>Über uns</h2>
            <StableRichEditor
              value={s.about}
              onChange={(v) => field("about", v)}
            />
          </section>
          <section className="panel">
            <h2>Rechtliches & Versandinformationen</h2>
            {Object.entries(s.legal).map(([key, value]) => (
              <details className="legal-editor" key={key}>
                <summary>
                  {
                    (
                      {
                        impressum: "Impressum",
                        agb: "AGB",
                        datenschutz: "Datenschutz",
                        widerruf: "Widerruf",
                        versand: "Versand",
                      } as Record<string, string>
                    )[key]
                  }
                </summary>
                <StableRichEditor
                  value={value}
                  onChange={(v) => field("legal", { ...s.legal, [key]: v })}
                />
              </details>
            ))}
          </section>
        </>
      ) : (
        <>
          <section className="panel">
            <h2>Versand</h2>
            <div className="form-row">
              {input("shippingCost", "Standardversand (€)", "number")}
              {input(
                "freeShippingFrom",
                "Kostenloser Versand ab (€)",
                "number",
              )}
            </div>
            {input("shippingText", "Lieferhinweis")}
            {["DE", "AT", "CH"].map((country) => (
              <label className="check" key={country}>
                <input
                  type="checkbox"
                  checked={s.shippingCountries.includes(country)}
                  onChange={(e) =>
                    field(
                      "shippingCountries",
                      e.target.checked
                        ? [...s.shippingCountries, country]
                        : s.shippingCountries.filter((c) => c !== country),
                    )
                  }
                />
                {country}
              </label>
            ))}
          </section>
          <section className="panel">
            <h2>Benachrichtigungen</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={s.emailNotifications}
                onChange={(e) => field("emailNotifications", e.target.checked)}
              />
              E-Mail an Shop-Betreiber bei bezahlten Bestellungen
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={s.telegramNotifications}
                onChange={(e) =>
                  field("telegramNotifications", e.target.checked)
                }
              />
              Telegram-Benachrichtigung aktivieren
            </label>
            <p className="muted">
              Kundenbestätigungen werden immer eingereiht. E-Mail- und
              Telegram-Zugangsdaten werden ausschließlich in den
              Server-Umgebungsvariablen hinterlegt.
            </p>
          </section>
          <section className="panel">
            <h2>Zahlungsarten</h2>
            <p>
              Stripe zeigt automatisch die für den Kunden verfügbaren
              Zahlungsarten. Verwalte Karte, Klarna und weitere Methoden direkt
              im Stripe-Dashboard.
            </p>
            <a
              className="btn outline"
              href="https://dashboard.stripe.com/settings/payment_methods"
              target="_blank"
              rel="noreferrer"
            >
              Stripe-Einstellungen öffnen ↗
            </a>
          </section>
        </>
      )}
    </form>
  );
}
export function OrderEditor({
  order,
}: {
  order: {
    id: string;
    shippingStatus: string;
    notes: string | null;
    trackingNumber: string | null;
  };
}) {
  const [message, setMessage] = useState<Message>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage({});
    const f = new FormData(e.currentTarget);
    try {
      await save("/api/admin/orders", {
        id: order.id,
        shippingStatus: f.get("shippingStatus"),
        notes: f.get("notes"),
        trackingNumber: f.get("trackingNumber"),
      });
      setMessage({ ok: "Bestellung aktualisiert." });
      router.refresh();
    } catch (e) {
      setMessage({
        error: e instanceof Error ? e.message : "Speichern fehlgeschlagen.",
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="panel">
      <h2>Versand & interne Notizen</h2>
      <Feedback message={message} />
      <label>
        Versandstatus
        <select name="shippingStatus" defaultValue={order.shippingStatus}>
          <option value="NOT_SHIPPED">Nicht versendet</option>
          <option value="SHIPPED">Versendet</option>
          <option value="DELIVERED">Zugestellt</option>
        </select>
      </label>
      <label>
        Trackingnummer
        <input
          name="trackingNumber"
          defaultValue={order.trackingNumber ?? ""}
        />
      </label>
      <label>
        Interne Notizen
        <textarea name="notes" defaultValue={order.notes ?? ""} />
      </label>
      <button className="btn" disabled={busy}>
        <Save size={16} />
        {busy ? "Speichert …" : "Aktualisieren"}
      </button>
    </form>
  );
}
