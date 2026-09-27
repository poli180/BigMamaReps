import { adminApi, apiError, ApiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { fulfillOrder, releaseOrder } from "@/lib/orders";
import { limit } from "@/lib/limits";

export async function POST(request: Request) {
  try {
    await adminApi(request);
    await limit("admin-payment-reconcile", 10, 1);
    if (!process.env.STRIPE_SECRET_KEY)
      throw new ApiError("Der Stripe-Schlüssel fehlt in Vercel.", 503);
    // Also verifies the configured key when there are no pending shop orders.
    await stripe().checkout.sessions.list({ limit: 1 });
    const orders = await db.order.findMany({
      where: { reservationState: "HELD", stripeSessionId: { not: null } },
      orderBy: { createdAt: "asc" },
      take: 25,
    });
    let paid = 0,
      expired = 0,
      failed = 0;
    for (const order of orders) {
      try {
        const session = await stripe().checkout.sessions.retrieve(
          order.stripeSessionId!,
        );
        if (
          session.client_reference_id !== order.id ||
          session.metadata?.orderId !== order.id
        )
          throw new Error("Session mismatch");
        if (
          session.payment_status === "paid" &&
          typeof session.payment_intent === "string"
        ) {
          await fulfillOrder(
            order.id,
            session.payment_intent,
            `reconcile:${session.id}`,
          );
          const confirmed = await db.order.findUniqueOrThrow({
            where: { id: order.id },
          });
          if (confirmed.paymentStatus === "PAID") paid++;
        } else if (session.status === "expired") {
          await releaseOrder(order.id);
          expired++;
        }
      } catch {
        failed++;
      }
    }
    return Response.json({
      checked: orders.length,
      paid,
      expired,
      failed,
      webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "type" in error &&
      String(error.type).startsWith("Stripe")
    )
      return Response.json(
        {
          error:
            "Stripe ist nicht erreichbar oder der API-Schlüssel hat nicht die benötigten Rechte. Bitte die Vercel-Konfiguration prüfen.",
        },
        { status: 502 },
      );
    return apiError(error);
  }
}
