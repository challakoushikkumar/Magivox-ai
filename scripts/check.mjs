import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
let count = 0;
for (const folder of [".", "functions", "scripts", "test", "functions/test"]) {
  for (const file of readdirSync(resolve(root, folder)).filter(f => /\.(?:mjs|js)$/.test(f))) {
    const result = spawnSync(process.execPath, ["--check", resolve(root, folder, file)], { encoding: "utf8" });
    if (result.status !== 0) { process.stderr.write(result.stderr || `Cannot check ${file}`); process.exit(1); }
    count++;
  }
}
console.log(`Syntax checked: ${count} first-party JavaScript files.`);
