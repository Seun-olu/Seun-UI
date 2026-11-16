// Runs axe-core against every story of the built Storybook in real Chrome,
// in the light and dark themes. Unlike jsdom, this checks colour contrast.
// Usage: npm run build-storybook && node scripts/a11y-stories.mjs
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { chromium } from "@playwright/test";

const root = join(process.cwd(), "storybook-static");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let file = join(root, path);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(0);
const base = `http://localhost:${server.address().port}`;

const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const stories = Object.values(JSON.parse(readFileSync(join(root, "index.json"), "utf8")).entries).filter((e) => e.type === "story");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
let failures = 0;
for (const theme of ["light", "dark"]) {
  for (const s of stories) {
    await page.goto(`${base}/iframe.html?id=${s.id}&viewMode=story&globals=theme:${theme}`);
    await page.waitForSelector("#storybook-root > *", { timeout: 15000 });
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished))); // measure after fade-ins
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => (await window.axe.run(document.body, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"], rules: { region: { enabled: false } } })).violations
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`));
    if (violations.length) failures++;
    console.log(`${violations.length ? "✗" : "✓"} [${theme}] ${s.title} / ${s.name}${violations.length ? "\n    " + violations.join("\n    ") : ""}`);
  }
}
await browser.close();
server.close();
console.log(`\n${stories.length * 2 - failures}/${stories.length * 2} story checks passed`);
process.exit(failures ? 1 : 0);
