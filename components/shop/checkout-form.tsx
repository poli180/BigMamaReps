"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useStore } from "./store-provider";
import { money } from "@/lib/pricing";
export function CheckoutForm({
  demo,
  shippingCost,
  freeShippingFrom,
  countries,
}: {
  demo: boolean;
  shippingCost: number;
  freeShippingFrom: number;
  countries: string[];
}) {
  const { items, ready } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [key, setKey] = useState("");
  const total = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = total >= freeShippingFrom ? 0 : shippingCost;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const requestKey = key || crypto.randomUUID();
    setKey(requestKey);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: requestKey,
          email: f.get("email"),
          name: f.get("name"),
          phone: f.get("phone"),
          address: {
            street: f.get("street"),
            houseNr: f.get("houseNr"),
            zip: f.get("zip"),
            city: f.get("city"),
            country: f.get("country"),
          },
          items: items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          terms: f.get("terms") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409) setKey("");
        throw new Error(data.error);
      }
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout nicht erreichbar.");
      setBusy(false);
    }
  }
  if (!ready) return <div className="skeleton" style={{ height: 350 }} />;
  if (!items.length)
    return (
      <div className="empty">
        <h2>Dein Warenkorb ist noch leer.</h2>
        <Link href="/shop" className="btn">
          Zum Shop
        </Link>
      </div>
    );
  return (
    <div className="checkout-grid">
      <form
        className="checkout-form"
        onSubmit={submit}
        onChange={() => setKey("")}
      >
        <h2>Kontakt & Lieferadresse</h2>
        <label>
          E-Mail
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Vollständiger Name
          <input name="name" autoComplete="name" minLength={2} required />
        </label>
        <label>
          Telefon (optional)
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <div className="form-row">
          <label>
            Straße
            <input name="street" autoComplete="address-line1" required />
          </label>
          <label>
            Hausnummer
            <input name="houseNr" required />
          </label>
        </div>
        <div className="form-row">
          <label>
            PLZ
            <input name="zip" autoComplete="postal-code" required />
          </label>
          <label>
            Ort
            <input name="city" autoComplete="address-level2" required />
          </label>
        </div>
        <label>
          Land
          <select name="country" autoComplete="country">
            {countries.map((c) => (
              <option key={c} value={c}>
                {
                  (
                    {
                      DE: "Deutschland",
                      AT: "Österreich",
                      CH: "Schweiz",
                    } as Record<string, string>
                  )[c]
                }
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" name="terms" required />
          <span>
            Ich akzeptiere die{" "}
            <Link href="/legal/agb" target="_blank">
              AGB
            </Link>{" "}
            und habe die{" "}
            <Link href="/legal/widerruf" target="_blank">
              Widerrufsbelehrung
            </Link>{" "}
            sowie die{" "}
            <Link href="/legal/datenschutz" target="_blank">
              Datenschutzhinweise
            </Link>{" "}
            gelesen.
          </span>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {demo && (
          <p className="notice">
            Vorschau: Für echte Zahlungen müssen Datenbank und Stripe
            eingerichtet sein.
          </p>
        )}
        <button className="btn full" disabled={busy || demo}>
          {busy ? "Checkout wird vorbereitet …" : "Weiter zur sicheren Zahlung"}
          <ArrowRight size={18} />
        </button>
        <p className="muted">
          <LockKeyhole size={13} /> Du schließt den Kauf anschließend bei Stripe
          ab.
        </p>
      </form>
      <aside className="order-summary">
        <h2>Deine Auswahl</h2>
        {items.map((i) => (
          <div className="summary-item" key={i.variantId}>
            <div>
              <strong>{i.name}</strong>
              <p>
                {i.color} / {i.size} · {i.quantity} Stück
              </p>
            </div>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="between">
          <span>Zwischensumme</span>
          <span>{money(total)}</span>
        </div>
        <div className="between">
          <span>Versand</span>
          <span>{shipping ? money(shipping) : "Kostenlos"}</span>
        </div>
        <div className="between summary-total">
          <strong>Gesamt</strong>
          <strong>{money(total + shipping)}</strong>
        </div>
        <p className="muted">
          Preise und Verfügbarkeit werden vor der Weiterleitung serverseitig
          geprüft.
        </p>
        <Link href="/shop" className="text-btn">
          Weiter einkaufen
        </Link>
      </aside>
    </div>
  );
}
