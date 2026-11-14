// scripts/test.mjs
// Starts Vitest. Used by "npm test"; extra arguments are passed on, and with
// none given the tests run once.
//
// The reason for a script: on Windows a shell can start in "d:\..." with a
// lower-case drive letter, as the VS Code terminal does. Vitest then loads
// itself twice, once per spelling of the path, and every test file fails at
// its first describe() with "Cannot read properties of undefined (reading
// 'config')". The drive letter has to be upper-case before Vitest is loaded,
// which is too early for vitest.config.mts to fix.

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let root = fileURLToPath(new URL("..", import.meta.url));
if (process.platform === "win32") {
  root = root[0].toUpperCase() + root.slice(1);
}

const args = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", ...(args.length ? args : ["run"])],
  { cwd: root, stdio: "inherit" }
);
process.exit(result.status ?? 1);
