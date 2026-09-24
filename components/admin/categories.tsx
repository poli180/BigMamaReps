"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, ArrowUpRight, Layers3 } from "lucide-react";
import Link from "next/link";
import { MediaUpload } from "./editors";
type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  position: number;
  _count: { products: number };
};
const blank = { name: "", description: "", image: "", position: 0 };
export function CategoryManager({ initial }: { initial: Category[] }) {
  const [draft, setDraft] = useState<{ id?: string } & typeof blank>(blank);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [moveTo, setMoveTo] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function send(remove = false) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/admin/categories", {
        method: remove ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(remove ? { id: deleting?.id, moveTo } : draft),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Speichern fehlgeschlagen.");
      setDraft(blank);
      setDeleting(null);
      setMoveTo("");
      setMessage(
        remove
          ? "Kategorie gelöscht. Produkte bleiben erhalten."
          : "Kategorie gespeichert.",
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Verbindung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">DEINE KOLLEKTIONEN</p>
          <h1>Kategorien.</h1>
          <p className="muted">
            Strukturiere deinen Shop. Änderungen erscheinen auf Home, im Menü
            und im Produktfilter.
          </p>
        </div>
      </div>
      <p role="status" aria-live="polite">
        {message}
      </p>
      <div className="category-admin-grid">
        <section className="panel category-list">
          <h2>
            <Layers3 size={20} /> Alle Kategorien{" "}
            <span className="badge">{initial.length}</span>
          </h2>
          {!initial.length && (
            <p className="muted">
              Lege deine erste Kategorie an und ordne ihr anschließend Produkte
              zu.
            </p>
          )}
          {initial.map((c) => (
            <article className="category-admin-row" key={c.id}>
              <div className="category-thumb">
                {c.image ? <img src={c.image} alt="" /> : <Layers3 size={24} />}
              </div>
              <div>
                <h3>{c.name}</h3>
                <p className="muted">
                  {c._count.products} Produkte · Position {c.position}
                </p>
              </div>
              <button
                className="icon-btn"
                aria-label={`${c.name} bearbeiten`}
                onClick={() => {
                  setDraft(c);
                  setDeleting(null);
                  setMessage("");
                }}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-btn"
                aria-label={`${c.name} löschen`}
                onClick={() => {
                  setDeleting(c);
                  setMoveTo("");
                }}
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
          {deleting && (
            <div
              className="category-delete"
              role="region"
              aria-label="Kategorie löschen"
            >
              <h3>„{deleting.name}“ löschen?</h3>
              <p>
                {deleting._count.products
                  ? "Die Produkte werden vor dem Löschen in die gewählte Kategorie verschoben."
                  : "Diese Kategorie enthält keine Produkte."}
              </p>
              {deleting._count.products > 0 && (
                <label>
                  Produkte verschieben nach
                  <select
                    value={moveTo}
                    onChange={(e) => setMoveTo(e.target.value)}
                  >
                    <option value="">Zielkategorie wählen</option>
                    {initial
                      .filter((c) => c.id !== deleting.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <div className="category-actions">
                <button
                  className="btn"
                  disabled={busy || (deleting._count.products > 0 && !moveTo)}
                  onClick={() => send(true)}
                >
                  Kategorie löschen
                </button>
                <button
                  className="btn outline"
                  onClick={() => setDeleting(null)}
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </section>
        <form
          className="panel category-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="between">
            <h2>{draft.id ? "Kategorie bearbeiten" : "Neue Kategorie"}</h2>
            {draft.id && (
              <button
                type="button"
                className="icon-btn"
                aria-label="Neue Kategorie anlegen"
                onClick={() => setDraft(blank)}
              >
                <Plus />
              </button>
            )}
          </div>
          <label>
            Name
            <input
              required
              maxLength={80}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="z. B. Outerwear"
            />
          </label>
          <label>
            Beschreibung
            <textarea
              maxLength={300}
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Ein kurzer Satz für die Kategorie-Karte."
            />
          </label>
          <label>
            Sortierung
            <input
              type="number"
              min={0}
              max={9999}
              value={draft.position}
              onChange={(e) =>
                setDraft({ ...draft, position: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Titelbild-URL
            <input
              value={draft.image}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <MediaUpload
            onUploaded={(urls) => setDraft({ ...draft, image: urls[0] })}
          />
          {draft.image && (
            <img
              className="category-image-preview"
              src={draft.image}
              alt="Kategorie-Vorschau"
            />
          )}
          <button className="btn" disabled={busy}>
            {busy ? "Wird gespeichert …" : "Kategorie speichern"}
            <ArrowUpRight size={18} />
          </button>
          <Link className="muted" href="/admin/products">
            Produkte zuordnen →
          </Link>
        </form>
      </div>
    </>
  );
}
