import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
function run(module, args) {
  const result = spawnSync(
    process.execPath,
    [require.resolve(module), ...args],
    {
      stdio: "inherit",
      env: process.env,
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("prisma/build/index.js", ["generate"]);
// Only production deploys initialize production data. Preview builds stay isolated.
if (process.env.VERCEL_ENV === "production") {
  const url =
    process.env.SHOP_DATABASE_URL_UNPOOLED ||
    process.env.SHOP_DATABASE_URL ||
    process.env.DATABASE_URL;
  if (url) {
    process.env.DATABASE_URL = url;
    run("prisma/build/index.js", ["migrate", "deploy"]);
    run("tsx/cli", ["prisma/seed.ts", "--if-empty"]);
  }
}
run("next/dist/bin/next", ["build"]);
