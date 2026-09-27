import { test } from "node:test";
import assert from "node:assert/strict";
import { hashSync, compare } from "bcryptjs";
import { adminConfig } from "../lib/admin-config";
import { signSession, verifySession } from "../lib/session";

test("copied dashboard values authenticate consistently without changing the password", async () => {
  const password = "test-password-only";
  const hash = hashSync(password, 4);
  process.env.ADMIN_EMAIL = ' ADMIN_EMAIL="Admin@example.invalid"\n';
  process.env.ADMIN_PASSWORD_HASH =
    'ADMIN_PASSWORD_HASH="' + hash.replace(/\$/g, "\\$") + '"';
  process.env.NEXTAUTH_SECRET =
    'NEXTAUTH_SECRET="test-secret-that-is-longer-than-32-characters"';
  const config = adminConfig();
  assert.deepEqual(config.issues, []);
  assert.equal(config.email, "admin@example.invalid");
  assert.equal(await compare(password, config.passwordHash), true);
  assert.equal(await compare("wrong-password", config.passwordHash), false);
  const token = await signSession();
  assert.equal(await verifySession(token), true);
  process.env.ADMIN_EMAIL = "another@example.invalid";
  assert.equal(await verifySession(token), false);
});

test("plaintext, truncated hashes and short session secrets fail configuration checks", () => {
  process.env.ADMIN_EMAIL = "admin@example.invalid";
  process.env.NEXTAUTH_SECRET = "short";
  for (const hash of ["plaintext-password", "$2b$12$truncated", ""]) {
    process.env.ADMIN_PASSWORD_HASH = hash;
    assert.deepEqual(adminConfig().issues, [
      "ADMIN_PASSWORD_HASH",
      "NEXTAUTH_SECRET",
    ]);
  }
});
