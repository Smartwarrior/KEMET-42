// Géométrie du monde partagée entre la logique de jeu et la scène 3D (coordonnées en mètres, y = altitude du sol).
export const SLOT_COUNT = 4;
const arc = (cx, cz, r, a0, a1) => Array.from({ length: SLOT_COUNT }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / (SLOT_COUNT - 1);
  return [cx + Math.cos(a) * r, cz + Math.sin(a) * r];
});
// Chaque type de module a son « quartier » autour de l'habitat central.
export const SLOTS = {
  solar: arc(0, 0, 15, -0.55, 0.55),                    // est
  moxie: arc(0, 0, 13, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55), // nord
  greenhouse: arc(0, 0, 14, Math.PI - 0.55, Math.PI + 0.55),       // ouest
  shield: arc(0, 0, 14, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55),   // sud
};
export const MODULE_TYPES = Object.keys(SLOTS);
export const HABITAT = [0, 0];
export const AIRLOCK = [0, 5.2];
export const ANTENNA = [-7.5, -7.5];
export const START_POS = [3.2, 7];     // le commandant
export const CREW_HOME = [[-4, 6], [4.5, 8], [-2, 9.5], [1.2, 11]];
export const ACTOR_FOR_ACTION = { build_moxie: 0, emergency_o2: 0, build_solar: 1, emergency_energy: 1, build_greenhouse: 2, emergency_food: 2, build_shield: 3, emergency_protection: 3, repair: 1, transmit: 3 };
export const CREW = [
  { name: "Amara", role: "o2", skin: "#8D5524", pack: "#4FD1C5" },
  { name: "Kofi", role: "energy", skin: "#5C3A1E", pack: "#F6C945" },
  { name: "Lena", role: "food", skin: "#F1C27D", pack: "#7BD389" },
  { name: "Yuri", role: "protection", skin: "#C68642", pack: "#9F7AEA" },
];
export const CALLSIGN_COLORS = { Aigle: "#E2552B", Comète: "#4FD1C5", Sahel: "#F6C945", Phénix: "#FF5C8A", Boréal: "#9F7AEA", Atlas: "#7BD389" };
// Lieu de l'accident + intervention directe possible du commandant (bonus).
export const HAZARDS = {
  dust_storm: { pos: [-9, 6], bonus: { res: "energy" }, label: "hzDust" },
  solar_flare: { pos: [0, 5.2], bonus: { res: "protection" }, label: "hzFlare" },   // se mettre à l'abri au sas
  power_failure: { pos: [14, 0], bonus: { res: "energy" }, label: "hzPower" },
  oxygen_leak: { pos: [0, -12], bonus: { res: "o2" }, label: "hzLeak" },
  food_shortage: { pos: [-13, 2], bonus: { res: "food" }, label: "hzFood" },
  ice_discovery: { pos: [12, 14], bonus: { res: "o2" }, label: "hzIce" },
  comm_blackout: { pos: [-7.5, -7.5], bonus: { res: "protection" }, label: "hzComm" },
  calm_sol: { pos: null, bonus: null },
};
