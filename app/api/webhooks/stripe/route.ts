import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { fulfillOrder, releaseOrder, syncRefund } from "@/lib/orders";
import { deliverNotifications } from "@/lib/notifications";
import type Stripe from "stripe";
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET)
    return new Response("Webhook not configured", { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    const obj = event.data.object;
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const s = obj as Stripe.Checkout.Session;
      const id = s.metadata?.orderId;
      if (id) {
        await db.order.updateMany({
          where: { id, stripeSessionId: null },
          data: { stripeSessionId: s.id },
        });
        if (s.payment_status === "paid" && typeof s.payment_intent === "string")
          await fulfillOrder(id, s.payment_intent, event.id);
      }
    } else if (event.type === "payment_intent.succeeded") {
      const p = obj as Stripe.PaymentIntent;
      if (p.metadata.orderId)
        await fulfillOrder(p.metadata.orderId, p.id, event.id);
    } else if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      const s = obj as Stripe.Checkout.Session;
      if (s.metadata?.orderId) {
        const current = await stripe().checkout.sessions.retrieve(s.id);
        if (
          current.payment_status === "paid" &&
          typeof current.payment_intent === "string"
        ) {
          await fulfillOrder(
            s.metadata.orderId,
            current.payment_intent,
            event.id,
          );
        } else if (
          current.status === "expired" ||
          event.type === "checkout.session.async_payment_failed"
        ) {
          await releaseOrder(s.metadata.orderId);
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const p = obj as Stripe.PaymentIntent;
      if (p.metadata.orderId)
        await db.order.updateMany({
          where: {
            id: p.metadata.orderId,
            paymentStatus: { in: ["PENDING", "FAILED"] },
          },
          data: { paymentStatus: "FAILED", stripePaymentIntentId: p.id },
        });
    } else if (event.type === "charge.refunded") {
      const c = obj as Stripe.Charge;
      const pi =
        typeof c.payment_intent === "string"
          ? c.payment_intent
          : c.payment_intent?.id;
      if (pi) await syncRefund(pi, event.id);
    }
    await deliverNotifications();
    return Response.json({ received: true });
  } catch (e) {
    console.error(
      "Webhook processing failed",
      event.id,
      e instanceof Error ? e.name : "Error",
    );
    return new Response("Retry required", { status: 500 });
  }
}
