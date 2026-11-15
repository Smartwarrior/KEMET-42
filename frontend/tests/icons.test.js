import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ICONS } from "../src/icons/icons.js";
import { splitIcons, stripIcons, iconizeChildren, fixProps } from "../src/icons/iconize.js";

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.name === "node_modules" ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const sources = [...walk("src"), ...walk("../src"), "index.html"].filter((f) => /\.(js|jsx|json|html|css)$/.test(f) && !f.includes(path.join("src", "icons")));
const PICT = /[\p{Extended_Pictographic}]/u;

test("aucun emoji dans le code source (front et back)", () => {
  const bad = [];
  for (const f of sources) fs.readFileSync(f, "utf8").split("\n").forEach((l, i) => { const m = l.replace(/[©®™]/g, "").match(PICT); if (m) bad.push(`${f}:${i + 1} ${m[0]}`); });
  assert.deepEqual(bad, []);
});
test("chaque jeton :i-nom: utilisé existe dans le jeu d'icônes", () => {
  const missing = new Set();
  for (const f of sources) for (const m of fs.readFileSync(f, "utf8").matchAll(/:i-([a-z0-9-]+):/g)) if (!ICONS[m[1]]) missing.add(m[1] + " (" + f + ")");
  assert.deepEqual([...missing], []);
});
test("chaque icône est un SVG non vide", () => { for (const [n, m] of Object.entries(ICONS)) assert.match(m, /<(path|circle|rect|ellipse)/, n); assert.ok(Object.keys(ICONS).length >= 60); });
test("splitIcons découpe texte et icônes", () => { assert.deepEqual(splitIcons("a :i-rocket: b"), ["a ", { icon: "rocket" }, " b"]); assert.deepEqual(splitIcons("12:30:45"), ["12:30:45"]); });
test("stripIcons retire les jetons (voix, tooltips)", () => { assert.equal(stripIcons(":i-rocket: Décoller"), "Décoller"); assert.equal(stripIcons("Sans icône"), "Sans icône"); });
test("rendu : les jetons deviennent des SVG, jamais du texte brut", () => {
  const html = renderToStaticMarkup(createElement("button", null, iconizeChildren(":i-rocket: Décoller :i-check:")));
  assert.equal((html.match(/<svg/g) || []).length, 2); assert.ok(!html.includes(":i-")); assert.ok(html.includes("Décoller"));
});
test("tableaux d'enfants et attributs", () => {
  const c = iconizeChildren(["T-", 10, ":i-timer: go"]); assert.ok(Array.isArray(c));
  assert.equal(fixProps({ title: ":i-gear: Réglages" }).title, "Réglages");
  assert.equal(fixProps({ children: "rien" }).children, "rien");
});
test("jeton inconnu : aucun plantage", () => { assert.equal(renderToStaticMarkup(createElement("p", null, iconizeChildren("x :i-inconnu: y"))).includes(":i-"), false); });
