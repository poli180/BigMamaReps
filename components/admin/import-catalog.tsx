"use client";
import { saveRequest } from "./save-request";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ImportCatalog() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  async function run() {
    setBusy(true);
    setMessage("");
    try {
      const r = await saveRequest("/api/admin/import-catalog", {
        method: "POST",
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setMessage(
        `${data.created} neue Entwürfe angelegt. Vorhandene Produkte bleiben unverändert.`,
      );
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Lieferantenkatalog</h2>
      <p>
        24 Produkte mit Fotos aus sechs Kategorien. Der Import legt inaktive
        Entwürfe ohne Verkaufspreis und Bestand an und blendet die sechs alten
        Beispielprodukte aus. Anschließend Preise, Varianten und Bestand im
        Produkteditor ergänzen und veröffentlichen.
      </p>
      <button className="btn" disabled={busy} onClick={run}>
        {busy ? "Import läuft …" : "24 Produkte als Entwürfe übernehmen"}
      </button>
      <p role="status">{message}</p>
    </section>
  );
}
