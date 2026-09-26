import { db } from "../lib/db";
import { importSupplierCatalog } from "../lib/import-supplier";
import { defaults } from "../lib/settings";
async function main() {
  if (
    process.argv.includes("--if-empty") &&
    (await db.shopSettings.findUnique({ where: { id: "shop" } }))
  ) {
    console.log(
      "Shop bereits eingerichtet; bestehende Produkte bleiben unverändert.",
    );
    return;
  }
  const result = await importSupplierCatalog();
  await db.shopSettings.upsert({
    where: { id: "shop" },
    update: {},
    create: { id: "shop", data: defaults },
  });
  console.log(
    result.created +
      " Lieferantenprodukte als inaktive Entwürfe importiert. Preise, Größen und Bestände vor Veröffentlichung ergänzen.",
  );
}
main()
  .catch((e) => {
    console.error(e.name);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
