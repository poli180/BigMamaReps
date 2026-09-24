import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { CheckCircle2 } from "lucide-react";
import { ClearCart } from "@/components/shop/clear-cart";
export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let number: string | undefined;
  let paid = false;
  try {
    if (session_id && process.env.STRIPE_SECRET_KEY) {
      const s = await stripe().checkout.sessions.retrieve(session_id);
      paid = s.payment_status === "paid";
      if (s.metadata?.orderId) {
        const o = await db.order.findUnique({
          where: { id: s.metadata.orderId },
        });
        number = o?.orderNumber;
      }
    }
  } catch {}
  return (
    <div className="empty success">
      <CheckCircle2 size={60} strokeWidth={1} />
      <p className="eyebrow">{number ?? "BIGMAMAREPS"}</p>
      <h1>
        {paid
          ? "Danke. Dein Style ist unterwegs."
          : "Zahlungsstatus wird geprüft."}
      </h1>
      <p>
        {paid
          ? "Deine Zahlung ist eingegangen. Sobald die Bestellung verarbeitet wurde, erhältst du eine Bestätigung per E-Mail."
          : "Bei manchen Zahlungsarten dauert die Bestätigung etwas länger. Du erhältst eine E-Mail, sobald die Zahlung bestätigt ist."}
      </p>
      {paid && <ClearCart />}
      <Link href="/shop" className="btn">
        Weiter entdecken
      </Link>
    </div>
  );
}
