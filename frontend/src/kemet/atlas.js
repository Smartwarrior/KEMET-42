/**
 * Cartographie réelle : tuiles NASA Solar System Treks (WMTS, projection équirectangulaire).
 * Modèle d'URL et noms de couches : https://trek.nasa.gov/tiles/apidoc/trekAPI.html (exemples Lune et Mars).
 * Coordonnées des sites : USGS Gazetteer of Planetary Nomenclature (Shackleton, Malapert) ;
 * Jezero, Gale, Faustini : coordonnées de référence de Wikipédia, issues du même catalogue de noms planétaires.
 */
export const TREK = "https://trek.nasa.gov";
export const LAYERS = {
  moon: { body: "Moon", layer: "LRO_WAC_Mosaic_Global_303ppd_v02", ext: "jpg", name: "LRO WAC (mosaïque globale)", page: TREK + "/moon/" },
  mars: { body: "Mars", layer: "Mars_MGS_MOLA_ClrShade_merge_global_463m", ext: "jpg", name: "MGS MOLA (relief coloré)", page: TREK + "/mars/" },
};
export const tileUrl = (dest, z, row, col) => { const l = LAYERS[dest]; return `${TREK}/tiles/${l.body}/EQ/${l.layer}/1.0.0/default/default028mm/${z}/${row}/${col}.${l.ext}`; };
/** latitude (°, + nord), longitude (°, + est, -180..180) */
export const SITE_COORDS = {
  jezero: { lat: 18.38, lon: 77.58, src: "https://planetarynames.wr.usgs.gov/" },
  gale: { lat: -5.4, lon: 137.8, src: "https://planetarynames.wr.usgs.gov/" },
  shackleton: { lat: -89.9, lon: 0, src: "https://planetarynames.wr.usgs.gov/Feature/5450" },
  faustini: { lat: -87.3, lon: 77.0, src: "https://planetarynames.wr.usgs.gov/" },
  malapert: { lat: -85.98, lon: -1.67, src: "https://planetarynames.wr.usgs.gov/Feature/16338" },
};
/** Position en % dans la carte plate (x: -180..180, y: 90..-90). */
export const toXY = ({ lat, lon }) => ({ x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 });
/** Niveau de zoom z : 2^(z+1) colonnes × 2^z lignes (zoom 0 = 2 colonnes, 1 ligne). */
export const grid = (z) => ({ cols: 2 ** (z + 1), rows: 2 ** z });
