import { db } from "./db";
import type { Prisma } from "@prisma/client";
export async function enqueue(
  tx: Prisma.TransactionClient,
  key: string,
  to: string,
  subject: string,
  body: string,
  channel = "email",
) {
  await tx.notification.upsert({
    where: { key },
    create: { key, to, subject, body, channel },
    update: {},
  });
}
export async function deliverNotifications() {
  const rows = await db.notification.findMany({
    where: { sentAt: null, attempts: { lt: 20 } },
    orderBy: { createdAt: "asc" },
    take: 30,
  });
  let sent = 0;
  for (const n of rows) {
    try {
      if (n.channel === "email") {
        if (!process.env.EMAIL_API_KEY || !process.env.EMAIL_FROM) continue;
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": n.id,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [n.to],
            subject: n.subject,
            text: n.body,
          }),
        });
        if (!response.ok) throw new Error("Email failed");
      } else {
        if (!process.env.TELEGRAM_BOT_TOKEN) continue;
        const response = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: n.to, text: n.body }),
          },
        );
        if (!response.ok) throw new Error("Telegram failed");
      }
      await db.notification.update({
        where: { id: n.id },
        data: { sentAt: new Date(), attempts: { increment: 1 } },
      });
      sent++;
    } catch {
      await db.notification.update({
        where: { id: n.id },
        data: { attempts: { increment: 1 } },
      });
    }
  }
  return sent;
}
