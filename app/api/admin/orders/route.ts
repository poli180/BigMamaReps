import { adminApi, apiError } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { enqueue, deliverNotifications } from "@/lib/notifications";
export async function POST(req: Request) {
  try {
    await adminApi(req);
    const b = z
      .object({
        id: z.string(),
        shippingStatus: z.enum(["NOT_SHIPPED", "SHIPPED", "DELIVERED"]),
        notes: z.string().max(10000),
        trackingNumber: z.string().max(150),
      })
      .parse(await req.json());
    await db.$transaction(async (tx) => {
      const o = await tx.order.findUniqueOrThrow({
        where: { id: b.id },
        include: { customer: true },
      });
      const changed = o.shippingStatus !== b.shippingStatus;
      await tx.order.update({
        where: { id: b.id },
        data: {
          shippingStatus: b.shippingStatus,
          notes: b.notes,
          trackingNumber: b.trackingNumber,
          ...(changed ? { shippingUpdatedAt: new Date() } : {}),
        },
      });
      if (changed && b.shippingStatus === "SHIPPED")
        await enqueue(
          tx,
          `${o.id}:shipped`,
          o.customer.email,
          `${o.orderNumber} ist unterwegs`,
          `Deine Bestellung ${o.orderNumber} wurde versendet.\n${b.trackingNumber ? "Trackingnummer: " + b.trackingNumber : ""}`,
        );
    });
    await deliverNotifications();
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
