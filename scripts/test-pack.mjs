// M7: pack the library exactly as npm would publish it, install the tarball into
// examples/consumer (a separate app), then typecheck, bundle and run CJS + ESM smoke tests there.
import { execSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";

const run = (cmd, cwd = ".") => { console.log(`$ ${cmd}`); execSync(cmd, { cwd, stdio: "inherit" }); };
for (const f of readdirSync(".")) if (f.endsWith(".tgz")) rmSync(f);
run("npm run build");
run("npm pack --silent");
const tgz = readdirSync(".").find((f) => f.endsWith(".tgz"));
const app = "examples/consumer";
rmSync(`${app}/node_modules/seun-ui`, { recursive: true, force: true });
run(`npm install --no-audit --no-fund --no-save ../../${tgz}`, app);
run("npx tsc --noEmit", app);
run("npx vite build --logLevel warn", app);
run("node smoke.cjs", app);
run("node smoke.mjs", app);
console.log(`\nPacked ${tgz} works in a separate app (types, Vite bundle, require and import).`);
