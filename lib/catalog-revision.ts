import { randomUUID } from "node:crypto";
import { db, isDemo } from "./db";
export async function catalogRevision() {
  if (isDemo()) return "preview";
  const row = await db.shopSettings.findUnique({
    where: { id: "catalog-revision" },
  });
  const data = row?.data as { revision?: string } | undefined;
  return data?.revision ?? "initial";
}
export async function catalogChanged() {
  const data = { revision: randomUUID() };
  await db.shopSettings.upsert({
    where: { id: "catalog-revision" },
    create: { id: "catalog-revision", data },
    update: { data },
  });
}
