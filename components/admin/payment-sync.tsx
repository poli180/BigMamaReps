"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
export function PaymentSync() {
  const path = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const shown = path === "/admin" || path.startsWith("/admin/orders");
  useEffect(() => {
    if (!shown) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [shown, router]);
  if (!shown) return null;
  async function sync() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/payments/reconcile", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(
        `Stripe verbunden. ${data.checked} Bestellungen geprüft, ${data.paid} Zahlungen bestätigt, ${data.expired} abgelaufen.${data.failed ? ` ${data.failed} Bestellungen benötigen eine Prüfung.` : ""}${!data.webhookConfigured ? " Achtung: Der Webhook-Schlüssel fehlt für automatische Bestätigungen." : ""}`,
      );
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Abgleich fehlgeschlagen.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel payment-sync">
      <div>
        <strong>Stripe-Zahlungen</strong>
        <p className="muted">
          Bestätigte Zahlungen werden automatisch übernommen. Diese Ansicht
          aktualisiert sich alle 5 Sekunden.
        </p>
      </div>
      <div className="form-row">
        <button
          type="button"
          className="btn outline"
          disabled={busy}
          onClick={sync}
        >
          {busy ? "Prüft Stripe …" : "Mit Stripe abgleichen"}
        </button>
        <a
          className="btn outline"
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
        >
          Stripe-Dashboard ↗
        </a>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
