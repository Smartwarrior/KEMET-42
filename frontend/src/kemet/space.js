// Fonctions pures du simulateur (testées dans tests/space.test.js). Valeurs : NASA.
// Gravité de surface : Lune 1,62 m/s² (≈ 1/6 g), Mars 3,71 m/s² (≈ 0,38 g).
export const GRAVITY = { MOON: { ms2: 1.62, frac: 1 / 6 }, MARS: { ms2: 3.71, frac: 0.38 }, EARTH: { ms2: 9.81, frac: 1 } };
export const gravity = { frac: 1 };
export const gravityOf = (dest) => GRAVITY[String(dest || "").toUpperCase()] || GRAVITY.EARTH;
export const setGravity = (dest) => { gravity.frac = gravityOf(dest).frac; };
/** Effet « léviter en marchant » : plus la gravité est faible, plus le pas est ample et le corps flotte. */
export function floatParams(frac) {
  const f = Math.min(1, Math.max(0.05, frac));
  return { bobScale: 1 + (1 - f) * 1.6, lift: (1 - f) * 0.14 };
}
/** Niveau d'alerte oxygène (pourcentage de la réserve de départ). */
export const o2Level = (pct) => (pct < 15 ? "critical" : pct < 30 ? "warning" : "ok");
export function o2Message(level, lang = "fr") {
  const fr = lang === "fr";
  if (level === "critical") return fr ? "Alerte critique ! Il reste très peu d'oxygène. Rentre à l'abri et active le générateur d'oxygène tout de suite." : "Critical alert! Oxygen is almost gone. Get to shelter and start the oxygen generator now.";
  if (level === "warning") return fr ? "Attention, l'oxygène baisse. Dans la combinaison, le sac PLSS fournit l'air ; dans la base, le système ECLSS le recycle. Sur Mars, l'expérience MOXIE sait en fabriquer." : "Careful, oxygen is dropping. In the suit the PLSS backpack supplies air; in the base the ECLSS system recycles it. On Mars, the MOXIE experiment can make oxygen.";
  return null;
}
/** Décollage : compte à rebours T-10, puis décollage, croisière, arrivée (durées en secondes). */
export const TRANSIT_MS = 14000;
export function transitPhase(sec) {
  if (sec < 10) { const n = Math.ceil(10 - sec); return { key: "c" + n, name: "count", n }; }
  if (sec < 11.5) return { key: "lift", name: "lift", n: 0 };
  if (sec < 13) return { key: "cruise", name: "cruise", n: 0 };
  return { key: "arrive", name: "arrive", n: 0 };
}
export function transitLine(ph, dest, lang = "fr") {
  const fr = lang === "fr", moon = String(dest).toUpperCase() === "MOON";
  if (ph.name === "count") return [10, 5, 3, 2, 1].includes(ph.n) ? (fr ? `T moins ${ph.n}` : `T minus ${ph.n}`) : null;
  if (ph.name === "lift") return fr ? `Décollage ! Cap sur ${moon ? "la Lune" : "Mars"}.` : `Liftoff! Heading to ${moon ? "the Moon" : "Mars"}.`;
  if (ph.name === "cruise") return moon ? (fr ? "La Lune est à environ 384 400 kilomètres : le voyage dure environ 3 jours." : "The Moon is about 384,400 km away: the trip takes about 3 days.") : (fr ? "Vers Mars, le voyage dure 6 à 9 mois selon la fenêtre de lancement." : "The trip to Mars takes 6 to 9 months depending on the launch window.");
  return moon ? (fr ? "Arrivée. Sur la Lune, la gravité est environ 6 fois plus faible que sur Terre." : "Arrival. Lunar gravity is about 6 times weaker than on Earth.") : (fr ? "Arrivée. Sur Mars, la gravité est d'environ 0,38 g." : "Arrival. Mars gravity is about 0.38 g.");
}
/** Conseils pour enfants selon le risque radiations donné par NASA DONKI. */
export function donkiAdvice(risk, lang = "fr") {
  const fr = lang === "fr";
  if (risk === "high") return { emoji: ":i-dot-red:", level: 2, title: fr ? "Tempête solaire forte" : "Strong solar storm", text: fr ? "Météo spatiale NASA DONKI : risque élevé. Tout l'équipage à l'abri, sorties interdites, serre protégée." : "NASA DONKI space weather: high risk. Everyone to shelter, no outdoor trips, protect the greenhouse." };
  if (risk === "medium") return { emoji: ":i-dot-orange:", level: 1, title: fr ? "Activité solaire" : "Solar activity", text: fr ? "Météo spatiale NASA DONKI : risque moyen. Limite les sorties et renforce le bouclier. La croissance des plantes peut ralentir." : "NASA DONKI space weather: medium risk. Limit outdoor trips and strengthen the shield. Plant growth may slow down." };
  return { emoji: ":i-dot-green:", level: 0, title: fr ? "Soleil calme" : "Quiet Sun", text: fr ? "Météo spatiale NASA DONKI : calme pour le moment. C'est le bon moment pour les sorties et la serre." : "NASA DONKI space weather: calm for now. A good time for outdoor trips and the greenhouse." };
}
