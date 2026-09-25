import test from "node:test";
import assert from "node:assert/strict";
import { priceFor, cents } from "../lib/pricing";
import { productInput, safeHtml, settingsInput } from "../lib/validation";
import { demoProducts } from "../lib/catalog";
import { defaults } from "../lib/settings";
import { signSession, verifySession } from "../lib/session";
const now = new Date("2026-09-23T12:00:00Z");
test("sale starts inclusively and expires exactly at end, independently of featured", () => {
  const p = {
    basePrice: 100,
    onSale: true,
    salePrice: 75,
    saleStart: now,
    saleEnd: new Date(+now + 1000),
  };
  assert.equal(priceFor(p, null, now).price, 75);
  assert.equal(priceFor(p, null, new Date(+now - 1)).price, 100);
  assert.equal(priceFor(p, null, new Date(+now + 1000)).price, 100);
  assert.equal(priceFor({ ...p, onSale: false }, null, now).price, 100);
});
test("variant overrides cannot be raised by an advertised sale", () => {
  const p = { basePrice: 100, onSale: true, salePrice: 75 };
  assert.equal(priceFor(p, 60, now).price, 60);
  assert.equal(priceFor(p, 120, now).price, 75);
  assert.equal(cents(19.99), 1999);
  assert.equal(priceFor({ ...p, salePrice: null }, null, now).price, 100);
});
test("product validation rejects negative stock, invalid sales, duplicates and malicious html", () => {
  const p = { ...demoProducts[0], basePrice: 100, onSale: true, salePrice: 75 };
  assert.equal(productInput.safeParse(p).success, true);
  assert.equal(
    productInput.safeParse({
      ...p,
      variants: p.variants.map((v) => ({ ...v, stock: -1 })),
    }).success,
    false,
  );
  assert.equal(productInput.safeParse({ ...p, salePrice: 999 }).success, false);
  assert.equal(
    productInput.safeParse({ ...p, variants: [p.variants[0], p.variants[0]] })
      .success,
    false,
  );
  assert.equal(
    productInput.safeParse({
      ...p,
      saleStart: "2026-10-01T00:00:00Z",
      saleEnd: "2026-09-01T00:00:00Z",
    }).success,
    false,
  );
  assert.equal(
    safeHtml(
      '<p>Hello<script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">click</a></p>',
    ),
    '<p>Hello<a rel="noopener noreferrer">click</a></p>',
  );
});
test("settings reject javascript links, external CTA redirect and malformed colors", () => {
  assert.equal(settingsInput.safeParse(defaults).success, true);
  assert.equal(
    settingsInput.safeParse({ ...defaults, heroLink: "//evil.example" })
      .success,
    false,
  );
  assert.equal(
    settingsInput.safeParse({ ...defaults, instagram: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    settingsInput.safeParse({
      ...defaults,
      primaryColor: "red; background:url(x)",
    }).success,
    false,
  );
});
test("admin sessions fail closed, verify audience and reject tampering", async () => {
  process.env.NEXTAUTH_SECRET =
    "unit-test-only-secret-with-at-least-32-characters";
  process.env.ADMIN_EMAIL = "admin@example.invalid";
  const token = await signSession();
  assert.equal(await verifySession(token), true);
  assert.equal(await verifySession(token.slice(0, -8) + "tampered"), false);
  assert.equal(await verifySession(), false);
  process.env.ADMIN_EMAIL = "other@example.invalid";
  assert.equal(await verifySession(token), false);
  delete process.env.NEXTAUTH_SECRET;
  assert.equal(await verifySession(token), false);
});
