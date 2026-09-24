import { createRequire } from "node:module";
import path from "node:path";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve("next/package.json"));
nextRequire("@next/env").loadEnvConfig(process.cwd());
const runner = path.join(
  path.dirname(require.resolve("tsx/package.json")),
  "dist/cli.mjs",
);
const result = spawnSync(process.execPath, [runner, "prisma/seed.ts"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
