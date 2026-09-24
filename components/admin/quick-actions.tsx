"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ProductToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <>
      <button
        className="text-btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/admin/products", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id, active: !active }),
            });
            if (!r.ok) throw new Error((await r.json()).error);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Fehler");
          } finally {
            setBusy(false);
          }
        }}
      >
        {active ? "Deaktivieren" : "Aktivieren"}
      </button>
      {error && <small role="alert">{error}</small>}
    </>
  );
}
export function BulkSale({
  products,
}: {
  products: { id: string; name: string }[];
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <details className="panel">
      <summary>Aktion für mehrere Produkte erstellen oder beenden</summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          setMessage("");
          try {
            const r = await fetch("/api/admin/sales", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ids: f.getAll("ids"),
                enabled: f.get("mode") === "enable",
                discount: Number(f.get("discount")),
                start: f.get("start")
                  ? new Date(String(f.get("start")) + "Z").toISOString()
                  : null,
                end: f.get("end")
                  ? new Date(String(f.get("end")) + "Z").toISOString()
                  : null,
              }),
            });
            const b = await r.json();
            if (!r.ok) throw new Error(b.error);
            setMessage("Aktion gespeichert.");
            router.refresh();
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Fehler");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="bulk-products">
          {products.map((p) => (
            <label className="check" key={p.id}>
              <input type="checkbox" name="ids" value={p.id} />
              {p.name}
            </label>
          ))}
        </div>
        <div className="form-row">
          <label>
            Aktion
            <select name="mode">
              <option value="enable">Sale aktivieren</option>
              <option value="disable">Sale beenden</option>
            </select>
          </label>
          <label>
            Rabatt (%)
            <input
              type="number"
              name="discount"
              defaultValue="20"
              min="1"
              max="99"
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Start (UTC)
            <input name="start" type="datetime-local" />
          </label>
          <label>
            Ende (UTC)
            <input name="end" type="datetime-local" />
          </label>
        </div>
        <p role="status">{message}</p>
        <button className="btn" disabled={busy}>
          {busy ? "Speichert …" : "Aktion übernehmen"}
        </button>
      </form>
    </details>
  );
}
