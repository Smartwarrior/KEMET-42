import { useEffect, useRef, useState } from "react";
import { useGame } from "../game/useStore.js";
import { novaSpeak } from "./novaSpeak.js";
import { o2Level, o2Message, donkiAdvice } from "../kemet/space.js";

/** Données réelles NASA DONKI via le backend (GET /api/donki), rafraîchies toutes les 5 minutes. */
export function useDonki() {
  const [snap, setSnap] = useState(null);
  useEffect(() => {
    const base = import.meta.env?.VITE_API_URL; if (!base) return;
    let on = true; const go = () => fetch(base.replace(/\/$/, "") + "/api/donki").then((r) => r.json()).then((d) => on && setSnap(d)).catch(() => {});
    go(); const id = setInterval(go, 5 * 60 * 1000); return () => { on = false; clearInterval(id); };
  }, []);
  return snap;
}

/** La voix NOVA prévient quand l'oxygène passe sous 30 % puis sous 15 %. */
export function OxygenWatch({ lang = "fr" }) {
  const srv = useGame((s) => s.srv), base = useGame((s) => s.srvBase), last = useRef("ok");
  const pct = srv && base?.oxygenKg ? (100 * (srv.oxygenKg ?? 0)) / base.oxygenKg : null;
  const level = pct == null ? "ok" : o2Level(pct);
  useEffect(() => { if (level !== last.current && level !== "ok") { const m = o2Message(level, lang); if (m) novaSpeak(m, lang); } last.current = level; }, [level, lang]);
  if (level === "ok") return null;
  return <div className={"o2-alert " + level} role="alert">:i-lungs: {Math.round(pct)} % — {level === "critical" ? (lang === "fr" ? "Oxygène critique !" : "Oxygen critical!") : (lang === "fr" ? "Oxygène bas" : "Low oxygen")}</div>;
}

/** Bandeau pour la serre : la météo spatiale peut ralentir la croissance. */
export function DonkiBanner() {
  const lang = useGame((s) => s.lang), d = useDonki(); if (!d || d.radiationRisk === "low") return null;
  return <div className="donki-banner">{donkiAdvice(d.radiationRisk, lang).emoji} {lang === "fr" ? "Croissance ralentie : protège l'équipage et la serre (NASA DONKI)." : "Growth slowed: protect the crew and the greenhouse (NASA DONKI)."}</div>;
}

/** Bouton :i-sun: + panneau météo spatiale ; NOVA lit l'alerte quand le risque change. */
export function DonkiDock({ lang = "fr" }) {
  const d = useDonki(), [open, setOpen] = useState(false), prev = useRef(null), risk = d?.radiationRisk;
  const adv = donkiAdvice(risk || "low", lang);
  useEffect(() => { if (risk && prev.current && prev.current !== risk) novaSpeak(adv.text, lang); if (risk) prev.current = risk; }, [risk]);
  const fl = d?.strongestFlare;
  return (<>
    <button className="donki-btn" onClick={() => setOpen((o) => !o)} aria-label="DONKI">:i-sun: <b>DONKI</b> {risk && adv.emoji}</button>
    {open && <div className="donki-panel" role="dialog">
      <h3>{adv.emoji} {adv.title}</h3>
      {!d && <p>{lang === "fr" ? "Données indisponibles (backend NASA DONKI non joignable)." : "No data (DONKI backend unreachable)."}</p>}
      {d && <><p>{adv.text}</p>
        <ul><li>{lang === "fr" ? "Éruption la plus forte" : "Strongest flare"} : <b>{fl?.classType || "—"}</b></li><li>CME : <b>{d.cmes?.length ?? 0}</b></li><li>{d.live ? ":i-dot-green: LIVE" : ":i-box: archive"} · {d.source}</li></ul>
        <p className="mut">{lang === "fr" ? "Une CME est un nuage de plasma expulsé par le Soleil. Il peut atteindre la Terre ou Mars en 1 à 3 jours et sans atmosphère épaisse, les astronautes doivent s'abriter." : "A CME is a plasma cloud thrown out by the Sun. It can reach Earth or Mars in 1 to 3 days; with no thick atmosphere, astronauts must shelter."}</p></>}
      <button onClick={() => novaSpeak(adv.text, lang)}>:i-speaker: {lang === "fr" ? "NOVA lit l'alerte" : "NOVA reads the alert"}</button> <button onClick={() => setOpen(false)}>✕</button>
    </div>}
  </>);
}
