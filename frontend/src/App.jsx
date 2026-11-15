import { useEffect, useMemo, useState } from "react";
import Scene from "./world/Scene.jsx";
import { createController } from "./game/controller.js";
import { data } from "./game/data.js";
import { GameCtx, useGame } from "./game/useStore.js";
import { HUD } from "./ui/HUD.jsx";
import { Login, Hangar, Loadout, CargoStep, Destination, SiteStep, Transit, Quiz } from "./ui/Kemet.jsx";
import { createApi } from "./kemet/api.js";
import { createMissionClient } from "./kemet/mission.js";
import { Intro, Briefing, Accident, ResolveBanner, Summary, Fact, End, Inspect, Tutorial, Settings, NoWebGL } from "./ui/Screens.jsx";
import { SpaceAgriculture } from "./ui/SpaceAgriculture.jsx";
import { NovaPanel } from "./ui/Nova.jsx";
import { INCIDENT_CATALOG } from "./data/incidents.js";
import { audio } from "./ui/audio.js";
import { DonkiDock, OxygenWatch } from "./ui/SafetyWatch.jsx";
import { setGravity } from "./kemet/space.js";
import { rt, resetEnts } from "./world/sim.js";
import { HAZARDS } from "./game/layout.js";

const safeStorage = (() => { try { const k = "__t"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return localStorage; } catch (_) { return undefined; } })();
const hasWebGL = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (_) { return false; } };

function Shell({ ctrl }) {
  const phase = useGame((s) => s.phase), lang = useGame((s) => s.lang), sound = useGame((s) => s.sound), quality = useGame((s) => s.quality), agriOpen = useGame((s) => s.agriOpen);
  const pendingEvent = useGame((s) => s.pendingEvent);
  const destG = useGame((s) => s.dest); useEffect(() => { setGravity(destG); }, [destG]);
  const incident = pendingEvent ? INCIDENT_CATALOG.find((i) => i.id === pendingEvent.id) || null : null;
  const [low, setLow] = useState(false); const env = useGame((s) => s.env);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { audio.set(sound); }, [sound]);
  useEffect(() => { rt.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; }, []);
  // le moment où l'on quitte l'accueil : fin du survol cinématique
  useEffect(() => { if (phase === "plan") rt.cam.intro = false; if (phase === "intro") { rt.cam.intro = true; rt.cam.cine = null; } }, [phase]);
  const q = quality === "auto" ? (low ? "low" : "high") : quality;
  return (
    <>
      <Scene key={env} ctrl={ctrl} env={env} quality={q} onLow={() => setLow(true)} />
      <div className="vignette" />
      <div className={"fx-flash" + (phase === "accident" ? " on" : "")} />
      {phase === "intro" && <Intro />}
      {phase === "login" && <Login />}
      {phase === "hangar" && <Hangar />}
      {phase === "loadout" && <Loadout />}
      {phase === "cargo" && <CargoStep />}
      {phase === "destination" && <Destination />}
      {phase === "site" && <SiteStep />}
      {phase === "transit" && <Transit />}
      {phase === "quiz" && <Quiz />}
      <HUD />
      {(phase === "plan") && <Tutorial />}
      {phase === "plan" && <Inspect />}
      {phase === "accident" && <Accident />}
      {phase === "execute" && <div className="banner sweep" onClick={() => ctrl.skip()}>:i-ff: {lang === "fr" ? "Touchez pour accélérer" : "Tap to speed up"}</div>}
      {phase === "resolve" && <ResolveBanner />}
      {phase === "summary" && <Summary />}
      {phase === "fact" && <Fact />}
      {phase === "end" && <End />}
      {phase === "plan" && <><DonkiDock lang={lang} /><OxygenWatch lang={lang} /></>}
      <Settings />
      {agriOpen && <SpaceAgriculture onClose={() => ctrl.closeAgriculture()} />}
      {phase === "plan" && (
        <NovaPanel
          lang={lang}
          autoSpeak={false}
          onStartGreenhouse={() => ctrl.openAgriculture?.()}
        />
      )}
    </>
  );
}

export default function App() {
  const ctrl = useMemo(() => { resetEnts(); const url = import.meta.env?.VITE_API_URL; let ref = null;
    const mission = url ? createMissionClient(url, () => ref?.store.get().user?.token) : null;
    ref = createController({ data, storage: safeStorage, backend: createApi(), mission }); return ref; }, []);
  useEffect(() => { window.__ctrl = ctrl; window.__rt = rt; window.__hz = HAZARDS; return () => ctrl.destroy(); }, [ctrl]);
  const [ok] = useState(hasWebGL);
  if (!ok) return <GameCtx.Provider value={ctrl}><NoWebGL /></GameCtx.Provider>;
  return <GameCtx.Provider value={ctrl}><Shell ctrl={ctrl} /></GameCtx.Provider>;
}
