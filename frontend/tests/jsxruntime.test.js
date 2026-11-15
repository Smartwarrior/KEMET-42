import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("la vraie config Vite transforme les jetons JSX en SVG (bout en bout)", async () => {
  const vite = await createServer({ configFile: "./vite.config.js", server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    const { Smoke } = await vite.ssrLoadModule("/src/icons/Smoke.jsx");
    const html = renderToStaticMarkup(createElement(Smoke, { n: 7 }));
    assert.equal((html.match(/<svg/g) || []).length, 2, html);
    assert.ok(!html.includes(":i-") && html.includes("Décoller") && html.includes("T-7"));
    assert.ok(html.includes('title="Réglages"'));
  } finally { await vite.close(); }
});
