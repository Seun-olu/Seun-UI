// CommonJS consumers: require() resolves dist/index.cjs and renders on the server.
const { createElement } = require("react");
const { renderToString } = require("react-dom/server");
const ui = require("seun-ui");
const html = renderToString(createElement(ui.Button, { variant: "secondary" }, "CJS ok"));
if (!html.includes("CJS ok") || typeof ui.DataTable !== "function") throw new Error("CJS entry broken");
console.log("cjs ok:", Object.keys(ui).length, "exports");
