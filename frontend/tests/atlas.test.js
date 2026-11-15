import test from "node:test"; import assert from "node:assert/strict";
import { tileUrl, toXY, grid, SITE_COORDS } from "../src/kemet/atlas.js";
test("URL de tuile identique aux exemples NASA Trek", () => {
  assert.equal(tileUrl("moon", 0, 0, 1), "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/0/0/1.jpg");
  assert.equal(tileUrl("mars", 0, 0, 0), "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/0/0/0.jpg");
});
test("grille et projection plate", () => {
  assert.deepEqual(grid(0), { cols: 2, rows: 1 }); assert.deepEqual(grid(2), { cols: 8, rows: 4 });
  assert.deepEqual(toXY({ lat: 0, lon: 0 }), { x: 50, y: 50 }); assert.equal(toXY({ lat: -90, lon: 180 }).y, 100);
  for (const s of ["jezero", "gale", "shackleton", "faustini", "malapert"]) assert.ok(SITE_COORDS[s]);
});
