/**
 * Activité serre pédagogique (Veggie / Advanced Plant Habitat).
 * Jamais de culture à l'air libre sur Mars ou la Lune : enceinte pressurisée contrôlée.
 * En mode serveur, appelle /api/mission/greenhouse/* ; sinon règles locales.
 */
import { useState, useEffect } from "react";
import { useCtrl, useGame } from "../game/useStore.js";
import { audio } from "./audio.js";

const CROPS = [
  {
    id: "lettuce",
    name: "Laitue Rouge Outredgeous",
    enName: "Outredgeous Red Romaine",
    icon: "🥬",
    cycleDays: "28 jours réels",
    nasaNote: "Première culture consommée par l'équipage de l'ISS en 2015 (système Veggie).",
    src: "NASA Science — Veggie Plant Growth System",
    url: "https://science.nasa.gov/mission/veggie/",
    bonusFood: 15,
    bonusLife: 5,
    plantId: "lettuce",
  },
  {
    id: "radish",
    name: "Radis Cherry Belle",
    enName: "Cherry Belle Radish",
    icon: "🌱",
    cycleDays: "27 jours réels",
    nasaNote: "Testé dans l'Advanced Plant Habitat (APH) de la NASA en 2020.",
    src: "NASA — Radish Harvest in Space (APH-02)",
    url: "https://www.nasa.gov/missions/station/iss-research/radish-harvest-space/",
    bonusFood: 12,
    bonusLife: 6,
    plantId: "mizuna",
  },
  {
    id: "zinnia",
    name: "Zinnia",
    enName: "Zinnia",
    icon: "🌸",
    cycleDays: "≈ 60 jours réels",
    nasaNote: "Première fleur cultivée dans Veggie (2016). Sensible à l'humidité dans l'enceinte.",
    src: "NASA — Veggie Zinnia",
    url: "https://www.nasa.gov/mission/veggie-plant-growth-system/",
    bonusFood: 8,
    bonusLife: 4,
    plantId: "zinnia",
  },
];

export function SpaceAgriculture({ onClose }) {
  const c = useCtrl();
  const lang = useGame((s) => s.lang);
  const fr = lang === "fr";
  const env = useGame((s) => s.dest) || "mars";
  const serverMode = useGame((s) => s.serverMode);
  const energy = useGame((s) => s.game?.resources?.energy ?? 50);

  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [perchlorateRinsed, setPerchlorateRinsed] = useState(env === "moon");
  const [ledSpectrum, setLedSpectrum] = useState(false);
  const [waterDosed, setWaterDosed] = useState(false);
  const [nutrients, setNutrients] = useState(false);
  const [temperature, setTemperature] = useState(false);
  const [growing, setGrowing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [harvested, setHarvested] = useState(false);
  const [error, setError] = useState(null);
  const [srvNote, setSrvNote] = useState(null);

  const mission = c.mission || null;

  useEffect(() => {
    let timer;
    if (growing && progress < 100) {
      timer = setTimeout(() => {
        setProgress((p) => {
          const next = p + 25;
          if (next >= 100) {
            audio.ok();
            setGrowing(false);
            setHarvested(true);
            return 100;
          }
          return next;
        });
      }, 550);
    }
    return () => clearTimeout(timer);
  }, [growing, progress]);

  async function backend(action, body = {}) {
    if (!serverMode || !mission) return null;
    try {
      if (action === "start") return await mission.greenhouseStart(body);
      return await mission.greenhouseAction(body);
    } catch (e) {
      setSrvNote(fr ? "Backend indisponible — mode local." : "Backend unavailable — local mode.");
      return null;
    }
  }

  const ready =
    (env !== "mars" || perchlorateRinsed) &&
    ledSpectrum &&
    waterDosed &&
    nutrients &&
    temperature &&
    energy > 10;

  async function handleStartGrowth() {
    setError(null);
    if (env === "mars" && !perchlorateRinsed) {
      setError(fr ? "Sur Mars, rince d'abord les perchlorates du régolithe (toxiques)." : "On Mars, first rinse perchlorates from the regolith (toxic).");
      return;
    }
    if (!ledSpectrum || !waterDosed || !nutrients || !temperature) {
      setError(fr ? "Il manque lumière LED, eau, nutriments ou température contrôlée." : "Missing LED light, water, nutrients or controlled temperature.");
      return;
    }
    if (energy <= 10) {
      setError(fr ? "Pas assez d'énergie pour la serre pressurisée." : "Not enough power for the pressurized greenhouse.");
      return;
    }
    audio.click();
    await backend("start", { plantId: selectedCrop.plantId });
    for (const a of ["light", "water", "nutrients", "temperature"]) {
      await backend("action", { action: a });
    }
    await backend("action", { action: "grow" });
    setGrowing(true);
    setProgress(15);
  }

  async function handleHarvest() {
    audio.ok();
    await backend("action", { action: "harvest" });
    c.harvestAgriculture(selectedCrop);
    onClose?.();
  }

  return (
    <div className="screen center agri-modal-screen">
      <div className="panel agri-panel">
        <div className="eyebrow">
          🌱 {fr ? "SERRE PRESSURISÉE" : "PRESSURIZED GREENHOUSE"} · NASA Veggie / APH
        </div>
        <h2>
          {fr
            ? `Cultiver sur ${env === "moon" ? "la Lune" : "Mars"} (enceinte contrôlée)`
            : `Farming on the ${env === "moon" ? "Moon" : "Mars"} (controlled enclosure)`}
        </h2>
        <p className="sub mut" style={{ fontSize: "0.85rem", margin: "4px 0 12px" }}>
          {fr
            ? "Important : sur Mars ou la Lune, les plantes ne poussent pas dehors. Il faut une boîte fermée, avec de la lumière, de l'eau, de la nourriture pour les plantes, et une bonne température."
            : "Important: on Mars or the Moon, plants do not grow outside. You need a closed box, with light, water, plant food, and a good temperature."}
        </p>

        <div className="agri-crop-picker">
          {CROPS.map((crop) => (
            <button
              key={crop.id}
              type="button"
              className={"crop-card" + (selectedCrop.id === crop.id ? " active" : "")}
              onClick={() => {
                audio.click();
                setSelectedCrop(crop);
                setProgress(0);
                setHarvested(false);
                setGrowing(false);
              }}
              disabled={growing}
            >
              <span className="crop-ic">{crop.icon}</span>
              <b>{fr ? crop.name : crop.enName}</b>
              <small>{crop.cycleDays}</small>
            </button>
          ))}
        </div>

        <div className="agri-note">
          <p>{selectedCrop.nasaNote}</p>
          <a href={selectedCrop.url} target="_blank" rel="noreferrer">
            {selectedCrop.src} ↗
          </a>
          <br />
          <a href="https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/" target="_blank" rel="noreferrer">
            {fr ? "Agence spatiale canadienne (CSA) : production d'aliments sur la Lune et en région isolée" : "Canadian Space Agency (CSA): food production on the Moon and in remote areas"} ↗
          </a>
        </div>

        <div className="agri-controls">
          <h3>{fr ? "Ce qu'il faut dans la boîte" : "What the box needs"}</h3>
          {env === "mars" && (
            <label className={"agri-check" + (perchlorateRinsed ? " on" : "")}>
              <input
                type="checkbox"
                checked={perchlorateRinsed}
                disabled={growing || harvested}
                onChange={(e) => setPerchlorateRinsed(e.target.checked)}
              />
              {fr ? "Régolithe rincé (perchlorates)" : "Regolith rinsed (perchlorates)"}
            </label>
          )}
          <label className={"agri-check" + (ledSpectrum ? " on" : "")}>
            <input type="checkbox" checked={ledSpectrum} disabled={growing || harvested} onChange={(e) => setLedSpectrum(e.target.checked)} />
            {fr ? "Lumière LED rouge + bleue (Veggie)" : "Red + blue LED light (Veggie)"}
          </label>
          <label className={"agri-check" + (waterDosed ? " on" : "")}>
            <input type="checkbox" checked={waterDosed} disabled={growing || harvested} onChange={(e) => setWaterDosed(e.target.checked)} />
            {fr ? "Eau dosée (racines)" : "Water dosed (roots)"}
          </label>
          <label className={"agri-check" + (nutrients ? " on" : "")}>
            <input type="checkbox" checked={nutrients} disabled={growing || harvested} onChange={(e) => setNutrients(e.target.checked)} />
            {fr ? "Nutriments / substrat" : "Nutrients / substrate"}
          </label>
          <label className={"agri-check" + (temperature ? " on" : "")}>
            <input type="checkbox" checked={temperature} disabled={growing || harvested} onChange={(e) => setTemperature(e.target.checked)} />
            {fr ? "Température contrôlée" : "Controlled temperature"}
          </label>
          <p className="mut" style={{ fontSize: 12 }}>
            ⚡ {fr ? "Énergie base" : "Base power"} : {energy}%
            {energy <= 10 ? (fr ? " — insuffisante" : " — too low") : ""}
          </p>
        </div>

        {(growing || progress > 0) && (
          <div className="agri-progress">
            <div className="bar"><i style={{ width: progress + "%" }} /></div>
            <span>
              {harvested
                ? fr
                  ? "Prêt à récolter (règle de jeu : cycle accéléré)"
                  : "Ready to harvest (game rule: accelerated cycle)"
                : fr
                  ? `Croissance… ${progress}% (simplification pédagogique)`
                  : `Growing… ${progress}% (pedagogical simplify)`}
            </span>
          </div>
        )}

        {error && <p className="agri-error">{error}</p>}
        {srvNote && <p className="mut" style={{ fontSize: 12 }}>{srvNote}</p>}

        <div className="row between" style={{ marginTop: 14, gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn ghost" onClick={() => { audio.click(); onClose?.(); c.closeAgriculture?.(); }}>
            {fr ? "Fermer" : "Close"}
          </button>
          {!harvested && !growing && (
            <button type="button" className="btn primary" disabled={!ready} onClick={handleStartGrowth}>
              {fr ? "Lancer la culture" : "Start growing"}
            </button>
          )}
          {harvested && (
            <button type="button" className="btn primary" onClick={handleHarvest}>
              {fr ? "Récolter (+nourriture)" : "Harvest (+food)"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
