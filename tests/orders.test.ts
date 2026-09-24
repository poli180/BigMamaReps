import { test, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { PrismaClient } from "@prisma/client";
let pg: PGlite;
let server: PGLiteSocketServer;
let db: PrismaClient;
let checkout: typeof import("../app/api/checkout/route").POST;
let fulfill: typeof import("../lib/orders").fulfillOrder;
let release: typeof import("../lib/orders").releaseOrder;
let webhook: typeof import("../app/api/webhooks/stripe/route").POST;
let stripeClient: ReturnType<typeof import("../lib/stripe").stripe>;
let sessionSequence = 0;
const sessions = new Map<string, any>();
const payments = new Map<string, any>();
before(async () => {
  pg = await PGlite.create();
  for (const entry of (
    await readdir("prisma/migrations", { withFileTypes: true })
  )
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    await pg.exec(
      await readFile(`prisma/migrations/${entry.name}/migration.sql`, "utf8"),
    );
  }
  server = new PGLiteSocketServer({
    db: pg,
    host: "127.0.0.1",
    port: 0,
    maxConnections: 1,
  });
  await server.start();
  const conn = server.getServerConn();
  process.env.DATABASE_URL = `postgresql://postgres:postgres@${conn}/postgres?connection_limit=1`;
  process.env.APP_URL = "http://localhost:3000";
  process.env.STRIPE_SECRET_KEY = "test-only-placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "webhook-test-placeholder";
  process.env.ADMIN_EMAIL = "admin@example.invalid";
  delete process.env.EMAIL_API_KEY;
  ({ db } = await import("../lib/db"));
  checkout = (await import("../app/api/checkout/route")).POST;
  ({ fulfillOrder: fulfill, releaseOrder: release } =
    await import("../lib/orders"));
  webhook = (await import("../app/api/webhooks/stripe/route")).POST;
  stripeClient = (await import("../lib/stripe")).stripe();
  mock.method(
    stripeClient.checkout.sessions,
    "create",
    async (params: any, options: any) => {
      const existing = [...sessions.values()].find(
        (s) => s.key === options.idempotencyKey,
      );
      if (existing) return existing;
      const s = {
        id: "cs_test_" + ++sessionSequence,
        url: "https://checkout.stripe.com/test/" + sessionSequence,
        status: "open",
        payment_status: "unpaid",
        key: options.idempotencyKey,
        ...params,
      };
      sessions.set(s.id, s);
      return s;
    },
  );
  mock.method(stripeClient.checkout.sessions, "retrieve", async (id: string) =>
    sessions.get(id),
  );
  mock.method(stripeClient.paymentIntents, "retrieve", async (id: string) =>
    payments.get(id),
  );
  await db.product.create({
    data: {
      id: "product",
      slug: "test-product",
      name: "Test Hoodie",
      description: "Test",
      category: "Hoodies",
      basePrice: 100,
      onSale: true,
      salePrice: 75,
      variants: {
        create: [
          {
            id: "last-one",
            color: "Black",
            size: "M",
            sku: "TEST-M",
            stock: 1,
          },
          { id: "plenty", color: "Black", size: "L", sku: "TEST-L", stock: 20 },
        ],
      },
    },
  });
});
after(async () => {
  mock.restoreAll();
  await db?.$disconnect();
  await server?.stop();
  // pglite-socket detaches handlers asynchronously after the TCP server closes.
  await new Promise((resolve) => setTimeout(resolve, 100));
  await pg?.close();
});
function body(variantId = "plenty", quantity = 1) {
  return {
    key: randomUUID(),
    email: "buyer@example.invalid",
    name: "Test Buyer",
    address: {
      street: "Teststraße",
      houseNr: "1",
      zip: "8000",
      city: "Zürich",
      country: "CH",
    },
    items: [{ variantId, quantity, price: 0.01 }],
    terms: true,
  };
}
function req(b: any, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(b),
  });
}
async function paymentFor(key: string, amount?: number) {
  const o = await db.order.findUniqueOrThrow({ where: { checkoutKey: key } });
  const id = "pi_" + o.id;
  payments.set(id, {
    id,
    status: "succeeded",
    currency: "eur",
    amount_received: amount ?? Math.round(Number(o.totalAmount) * 100),
    metadata: { orderId: o.id },
    latest_charge: { payment_method_details: { type: "card" } },
  });
  return { order: o, id };
}
test("migration loads and simultaneous checkouts cannot reserve the same last unit", async () => {
  const responses = await Promise.all([
    checkout(req(body("last-one"))),
    checkout(req(body("last-one"))),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const v = await db.variant.findUniqueOrThrow({ where: { id: "last-one" } });
  assert.equal(v.stock, 1);
  assert.equal(v.reserved, 1);
});
test("server ignores client prices and uses sale plus shipping; retry is idempotent", async () => {
  const b = body();
  const a = await checkout(req(b));
  assert.equal(a.status, 200);
  const o = await db.order.findUniqueOrThrow({
    where: { checkoutKey: b.key },
    include: { items: true },
  });
  assert.equal(Number(o.totalAmount), 79.9);
  assert.equal(Number(o.items[0].unitPrice), 75);
  assert.match(o.orderNumber, /^BMR-\d{4}-\d{6}$/);
  const v = await db.variant.findUniqueOrThrow({ where: { id: "plenty" } });
  assert.equal((await checkout(req(b))).status, 200);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: "plenty" } })).reserved,
    v.reserved,
  );
  assert.equal(
    (await checkout(req({ ...b, name: "Changed buyer" }))).status,
    409,
  );
});
test("duplicate webhook events and distinct success events consume stock only once", async () => {
  const b = body();
  assert.equal((await checkout(req(b))).status, 200);
  const { order, id } = await paymentFor(b.key);
  const before = await db.variant.findUniqueOrThrow({
    where: { id: "plenty" },
  });
  await Promise.all([
    fulfill(order.id, id, "evt-one"),
    fulfill(order.id, id, "evt-one"),
  ]);
  await fulfill(order.id, id, "evt-other-success");
  const after = await db.variant.findUniqueOrThrow({ where: { id: "plenty" } });
  assert.equal(after.stock, before.stock - 1);
  assert.equal(after.reserved, before.reserved - 1);
  assert.equal(
    (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
      .paymentStatus,
    "PAID",
  );
  assert.equal(
    await db.notification.count({ where: { key: { startsWith: order.id } } }),
    2,
  );
  await release(order.id);
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: "plenty" } })).stock,
    after.stock,
  );
});
test("wrong amount is rejected without inventory changes or payment confirmation", async () => {
  const b = body();
  await checkout(req(b));
  const { order, id } = await paymentFor(b.key, 1);
  const before = await db.variant.findUniqueOrThrow({
    where: { id: "plenty" },
  });
  await assert.rejects(fulfill(order.id, id, "evt-wrong"), /Payment mismatch/);
  assert.equal(
    (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
      .paymentStatus,
    "PENDING",
  );
  assert.equal(
    (await db.variant.findUniqueOrThrow({ where: { id: "plenty" } })).stock,
    before.stock,
  );
});
test("release is idempotent and returns only held stock", async () => {
  const b = body();
  await checkout(req(b));
  const o = await db.order.findUniqueOrThrow({ where: { checkoutKey: b.key } });
  const before = await db.variant.findUniqueOrThrow({
    where: { id: "plenty" },
  });
  await release(o.id);
  await release(o.id);
  const v = await db.variant.findUniqueOrThrow({ where: { id: "plenty" } });
  assert.equal(v.stock, before.stock);
  assert.equal(v.reserved, before.reserved - 1);
  assert.equal(
    (await db.order.findUniqueOrThrow({ where: { id: o.id } }))
      .reservationState,
    "RELEASED",
  );
});
test("unsigned webhooks and cross-origin checkouts are rejected", async () => {
  assert.equal(
    (
      await webhook(
        new Request("http://localhost:3000/api/webhooks/stripe", {
          method: "POST",
          body: "{}",
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (await checkout(req(body(), "https://evil.example"))).status,
    403,
  );
  assert.equal((await checkout(req(body("plenty", -1)))).status, 400);
});

test("signed asynchronous completion waits for payment and refund-before-success remains monotonic", async () => {
  const b = body();
  b.email = "refund@example.invalid";
  assert.equal((await checkout(req(b))).status, 200);
  const { order, id } = await paymentFor(b.key);
  async function send(type: string, object: unknown, eventId: string) {
    const payload = JSON.stringify({
      id: eventId,
      object: "event",
      type,
      data: { object },
    });
    const signature = stripeClient.webhooks.generateTestHeaderString({
      payload,
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    });
    return webhook(
      new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: payload,
      }),
    );
  }
  assert.equal(
    (
      await send(
        "checkout.session.completed",
        {
          id: order.stripeSessionId,
          metadata: { orderId: order.id },
          payment_status: "unpaid",
          payment_intent: id,
        },
        "evt-async-pending",
      )
    ).status,
    200,
  );
  assert.equal(
    (await db.order.findUniqueOrThrow({ where: { id: order.id } }))
      .paymentStatus,
    "PENDING",
  );
  const pi = payments.get(id);
  pi.latest_charge = {
    payment_method_details: { type: "klarna" },
    amount_refunded: 7990,
    refunded: true,
  };
  assert.equal(
    (await send("charge.refunded", { payment_intent: id }, "evt-early-refund"))
      .status,
    200,
  );
  let saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(saved.paymentStatus, "REFUNDED");
  assert.equal(saved.paymentMethod, "klarna");
  assert.equal(Number(saved.refundedAmount), 79.9);
  await fulfill(order.id, id, "evt-late-success");
  pi.latest_charge.amount_refunded = 1000;
  pi.latest_charge.refunded = false;
  assert.equal(
    (await send("charge.refunded", { payment_intent: id }, "evt-old-partial"))
      .status,
    200,
  );
  saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(saved.paymentStatus, "REFUNDED");
  assert.equal(Number(saved.refundedAmount), 79.9);
});

test("database refuses negative inventory even outside the API", async () => {
  await assert.rejects(
    db.variant.update({ where: { id: "plenty" }, data: { stock: -1 } }),
  );
});
