// CommonJS consumers resolve dist/index.d.cts; the declarations are identical.
import { copyFileSync } from "node:fs";
copyFileSync("dist/index.d.ts", "dist/index.d.cts");
