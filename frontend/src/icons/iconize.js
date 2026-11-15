import { createElement } from "react";
import { ICONS } from "./icons.js";
export const TOKEN = /:i-([a-z0-9-]+):/g;
/** "a :i-rocket: b" -> ["a ", {icon:"rocket"}, " b"] */
export function splitIcons(text) {
  const out = []; let last = 0; text.replace(TOKEN, (m, n, i) => { if (i > last) out.push(text.slice(last, i)); out.push({ icon: n }); last = i + m.length; return m; });
  if (last < text.length) out.push(text.slice(last)); return out;
}
export const stripIcons = (s) => (typeof s === "string" ? s.replace(TOKEN, "").replace(/\s{2,}/g, " ").trim() : s);
export function Icon({ name }) {
  const m = ICONS[name]; if (!m) return null;
  return createElement("svg", { className: "ic", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, dangerouslySetInnerHTML: { __html: m } });
}
const conv = (s) => { const p = splitIcons(s); return p.length === 1 && typeof p[0] === "string" ? s : p.map((x, i) => (typeof x === "string" ? x : createElement(Icon, { name: x.icon, key: i }))); };
export function iconizeChildren(c) {
  if (typeof c === "string") return c.includes(":i-") ? conv(c) : c;
  if (Array.isArray(c)) { let ch = false; const r = c.map((x) => { if (typeof x === "string" && x.includes(":i-")) { ch = true; const p = conv(x); return Array.isArray(p) ? p : x; } return x; }); return ch ? r.flat() : c; }
  return c;
}
const ATTR = ["title", "aria-label", "placeholder", "alt"];
export function fixProps(p) {
  if (!p) return p; let q = p; const n = iconizeChildren(p.children); if (n !== p.children) q = { ...q, children: n };
  for (const k of ATTR) if (typeof p[k] === "string" && p[k].includes(":i-")) q = { ...q, [k]: stripIcons(p[k]) };
  return q;
}
