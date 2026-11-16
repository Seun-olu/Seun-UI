// ESM consumers: import resolves dist/index.js; the CSS export resolves to a real file.
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { Badge } from "seun-ui";
const html = renderToString(createElement(Badge, { tone: "success" }, "ESM ok"));
if (!html.includes("ESM ok")) throw new Error("ESM entry broken");
const css = createRequire(import.meta.url).resolve("seun-ui/styles.css");
if (!existsSync(css)) throw new Error("styles.css export missing");
console.log("esm ok; css:", css.split("node_modules/")[1]);
