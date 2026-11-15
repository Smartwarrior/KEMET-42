import { useEffect, useMemo, useState } from "react";
import { useCtrl, useGame } from "../game/useStore.js";
import { useT, Helmet, forecast } from "./HUD.jsx";
import { RES, EVENT_ICON, MOD_ACTION, ACT_ICON, L } from "./strings.js";
import { CALLSIGN_COLORS, CREW, HAZARDS } from "../game/layout.js";
import { rt } from "../world/sim.js";
import { audio } from "./audio.js";
import { INCIDENT_CATALOG } from "../data/incidents.js";
import { novaSpeak, novaLine } from "./novaSpeak.js";

const Btn = ({ children, onClick, kind = "primary", ...p }) => <button className={"btn " + kind} onClick={(e) => { audio.unlock(); audio.click(); onClick && onClick(e); }} {...p}>{children}</button>;

function catalogFor(evId) {
  return INCIDENT_CATALOG.find((i) => i.id === evId) || null;
}

export function Intro() {
  const c = useCtrl(), t = useT(); const hasSave = useGame((s) => s.hasSave), lang = useGame((s) => s.lang), best = useGame((s) => s.best);
  return (
    <div className="screen intro">
      <div className="intro-top">
        <div className="voice-choice" aria-label={lang === "fr" ? "Langue de la voix de Nova" : "Nova voice language"}>
          <span>:i-robot: {lang === "fr" ? "Voix Nova" : "Nova voice"}</span>
          <button
            className={lang === "fr" ? "on" : ""}
            onClick={() => {
              c.setLang("fr");
              novaSpeak(novaLine("langFr", "fr"), "fr");
            }}
          >
            FR
          </button>
          <button
            className={lang === "en" ? "on" : ""}
            onClick={() => {
              c.setLang("en");
              novaSpeak(novaLine("langEn", "en"), "en");
            }}
          >
            EN
          </button>
        </div>
        <button className="icon" onClick={() => { c.toggleSound(); }}>
          {useGame((s) => s.sound) ? ":i-speaker:" : ":i-speaker-off:"}
        </button>
      </div>
      <div className="intro-center">
        <img src="/logo.svg" alt="KEMET-42 Insignia" className="intro-logo" />
        <div className="eyebrow">NASA SPACE APPS CHALLENGE 2026</div>
        <h1>{t("title")}</h1>
        <p className="hello">{t("hello")}, <b>{useGame((s) => s.user)?.name}</b> · <button className="linkbtn" onClick={() => c.logout()}>{t("logout")}</button></p>
        <p className="tag">{t("tagline")}</p>
        <div className="intro-btns">
          <Btn onClick={() => c.goHangar()}>:i-rocket: {t("newMission")}</Btn>
          {hasSave && <Btn kind="ghost" onClick={() => c.resume()}>↻ {t("resume")}</Btn>}
        </div>
        {best > 0 && <p className="best">:i-trophy: {t("best")} : {best}</p>}
      </div>
      <ul className="how"><li><span>:i-joystick:</span>{t("how1")}</li><li><span>:i-crane:</span>{t("how2")}</li><li><span>:i-alert:</span>{t("how3")}</li></ul>
    </div>
  );
}

export function Briefing() {
  const c = useCtrl(), t = useT(); const callsign = useGame((s) => s.callsign);
  useEffect(() => { rt.cam.intro = false; rt.cam.follow = true; rt.cam.cine = { x: rt.ents[4].x, z: rt.ents[4].z, until: 1e9, dist: 9, pol: 1.25 }; rt.cam.az = 0.1; rt.ents[4].yaw = 0.1; rt.ents[4].target = null; return () => { rt.cam.cine = null; }; }, []);
  return (
    <div className="screen briefing">
      <div className="panel brief">
        <h2>{t("missionBriefingTitle")}</h2>
        <p>{t("missionBriefingText")}</p>
        <div className="res-expl">{Object.entries(RES).map(([k, r]) => <div key={k} style={{ "--c": r.color }}><span>{r.icon}</span><b>{t(r.key)}</b><small>{t({ o2: "resO2Desc", energy: "resEnergyDesc", food: "resFoodDesc", protection: "resProtDesc" }[k])}</small></div>)}</div>
        <h3>{t("yourCallsign")}</h3>
        <div className="callsigns">{Object.entries(CALLSIGN_COLORS).map(([n, col]) => <button key={n} className={"chip" + (n === callsign ? " on" : "")} style={{ "--c": col }} onClick={() => { audio.click(); c.setCallsign(n); }}><i />{n}</button>)}</div>
        <div className="brief-actions"><Btn kind="ghost" onClick={() => c.goIntro()}>← {t("back")}</Btn><Btn onClick={() => { audio.ok(); c.launch(); }}>{t("btnLaunchMission")} :i-play:</Btn></div>
      </div>
    </div>
  );
}

/** Accident : bannière + protocole + compte à rebours (règle de jeu) + sources NASA. */
export function Accident() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), ev = useGame((s) => s.pendingEvent), ready = useGame((s) => s.choicesReady), game = useGame((s) => s.game), plan = useGame((s) => s.plan), reached = useGame((s) => s.bonusReached);
  const [shelterOpen, setShelterOpen] = useState(false), [helpOpen, setHelpOpen] = useState(false);
  const cat = useMemo(() => (ev ? catalogFor(ev.id) : null), [ev]);
  const [timeLeft, setTimeLeft] = useState(cat?.timeLimitSec || 45);
  useEffect(() => { if (ev) { ev.negative ? audio.alarm() : audio.ok(); setTimeLeft(cat?.timeLimitSec || 45); } }, [ev, cat]);
  useEffect(() => {
    if (!ev || !ready) return;
    const full =
      (cat?.explain && (lang === "fr" ? cat.explain.fr : cat.explain.en)) ||
      (novaLine("incident", lang) +
        " " +
        (cat ? (lang === "fr" ? cat.whatToDo?.fr : cat.whatToDo?.en) : ""));
    novaSpeak(full, lang);
  }, [ev, ready, lang, cat]);
  useEffect(() => {
    if (!ev || !ready) return undefined;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [ev, ready]);
  useEffect(() => { if (reached) audio.bonus(); }, [reached]);
  const sm = useGame((s) => s.serverMode);
  if (!ev) return null;
  const hz = HAZARDS[ev.id], res = hz?.bonus ? t(RES[hz.bonus.res].key) : "", funds = game.budget - c.planCost(plan);
  const fr = lang === "fr";
  const procedures = {
    dust_storm: [fr ? "Observer la visibilité et la production solaire" : "Check visibility and solar output", fr ? "Rassembler l’équipage dans l’abri pressurisé" : "Gather crew in the pressurized shelter", fr ? "Réduire la consommation et attendre l’accalmie" : "Cut power use and wait for clearer skies"],
    solar_flare: [fr ? "Recevoir l’alerte de rayonnement" : "Receive the radiation alert", fr ? "Se réfugier derrière le blindage de l’abri" : "Shelter behind the base shielding", fr ? "Limiter les sorties jusqu’à la fin de l’événement" : "Limit EVAs until the event ends"],
    power_failure: [fr ? "Isoler le circuit qui a déclenché l’alarme" : "Isolate the circuit that triggered the alarm", fr ? "Envoyer un astronaute au tableau électrique" : "Send an astronaut to the power panel", fr ? "Rétablir l’énergie ou passer en mode économie" : "Restore power or switch to economy mode"],
    oxygen_leak: [fr ? "Localiser la chute de pression" : "Locate the pressure drop", fr ? "Fermer le sas et colmater le joint" : "Close the airlock and seal the joint", fr ? "Vérifier que le débit d’O₂ revient à la normale" : "Check that O₂ flow returns to normal"],
    food_shortage: [fr ? "Identifier le bac contaminé" : "Identify the contaminated tray", fr ? "Isoler les plantes et désinfecter la zone" : "Isolate plants and disinfect the area", fr ? "Rééquilibrer les rations et la serre" : "Rebalance rations and the greenhouse"],
    greenhouse_contam: [fr ? "Identifier le bac contaminé" : "Identify the contaminated tray", fr ? "Isoler et stériliser" : "Isolate and sterilize", fr ? "Vérifier la récolte restante" : "Check remaining harvest"],
    comm_blackout: [fr ? "Confirmer que la liaison est interrompue" : "Confirm the link is down", fr ? "Basculer sur l’autonomie locale" : "Switch to local autonomy", fr ? "Réessayer l’antenne quand la fenêtre revient" : "Retry the antenna when the window returns"],
    ice_discovery: [fr ? "Cartographier la glace détectée" : "Map the detected ice", fr ? "Choisir : eau pour la serre ou protection" : "Choose: water for greenhouse or shielding", fr ? "Mesurer le résultat" : "Measure the result"],
    life_support_fail: [fr ? "Lire l’alarme CO₂" : "Read the CO₂ alarm", fr ? "Remplacer le filtre" : "Replace the filter", fr ? "Vérifier la qualité de l’air" : "Check air quality"],
    calm_sol: [fr ? "Lire les capteurs du Sol" : "Read Sol sensors", fr ? "Profiter de la fenêtre pour charger ou explorer" : "Use the window to charge or explore", fr ? "Comparer la décision aux ressources" : "Compare the decision to remaining resources"],
  }[ev.id] || [fr ? "Identifier le signal" : "Identify the signal", fr ? "Choisir une réponse" : "Choose a response", fr ? "Vérifier les conséquences" : "Check the consequences"];
  const activeStep = reached ? 2 : ready ? 1 : 0;
  const urgencyRaw = cat?.urgency || (ev.negative ? "high" : "low");
  const urgency = ({ high: fr ? "urgence élevée" : "high urgency", medium: fr ? "urgence moyenne" : "medium urgency", low: fr ? "urgence faible" : "low urgency" })[urgencyRaw] || urgencyRaw;
  const evName = (fr ? { dust_storm: "tempête de poussière", solar_flare: "éruption solaire", power_failure: "panne d'énergie", oxygen_leak: "fuite d'oxygène", food_shortage: "pénurie de nourriture", greenhouse_contam: "serre contaminée", comm_blackout: "coupure de communication", ice_discovery: "découverte de glace", life_support_fail: "panne du support de vie", calm_sol: "Sol calme" } : { dust_storm: "dust storm", solar_flare: "solar flare", power_failure: "power failure", oxygen_leak: "oxygen leak", food_shortage: "food shortage", greenhouse_contam: "greenhouse contamination", comm_blackout: "communication blackout", ice_discovery: "ice discovery", life_support_fail: "life support failure", calm_sol: "calm Sol" })[ev.id] || ev.id.replaceAll("_", " ");
  return (
    <div className={"accident" + (ev.negative ? " bad" : " good")}>
      <div className="acc-banner">
        <span className="acc-ic">{EVENT_ICON[ev.id] || ":i-alert:"}</span>
        <div style={{ flex: 1 }}>
          <small>{ev.negative ? ":i-alert: " + t("accident") : "✦ " + t("eventTitle")} · {urgency}</small>
          <p style={{ fontWeight: 700, fontSize: "1.05rem", margin: "2px 0 4px" }}>{L(ev.text, lang)}</p>
          <div className="incident-type">{evName} · {fr ? "protocole guidé" : "guided protocol"}</div>
        </div>
        <div className="inc-timer" title={fr ? "Compte à rebours = règle de jeu" : "Countdown = game rule"}>
          :i-timer: {timeLeft}s
          <small>{fr ? "règle de jeu" : "game rule"}</small>
        </div>
      </div>

      {cat && (
        <div className="incident-meta" style={{ background: "rgba(10, 16, 28, 0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "10px 14px" }}>
          <p style={{ margin: "3px 0" }}><strong>{fr ? "Danger" : "Danger"} :</strong> {L(cat.danger, lang)}</p>
          <p style={{ margin: "3px 0", color: "#8de8dc" }}><strong>{fr ? "À faire" : "What to do"} :</strong> {L(cat.whatToDo, lang)}</p>
          {cat.source?.url && (
            <p style={{ margin: "4px 0 0", fontSize: "0.74rem" }}>
              <a href={cat.source.url} target="_blank" rel="noreferrer" style={{ color: "#7de8ff" }}>
                {cat.source.name || "NASA"} :i-external: (source officielle NASA)
              </a>
            </p>
          )}
        </div>
      )}

      <div className="incident-protocol">
        <div className="protocol-head">
          <b>:i-robot: NOVA</b>
          <span>{fr ? "étape" : "step"} {activeStep + 1}/3</span>
        </div>
        <div className="protocol-steps">
          {procedures.map((step, i) => (
            <div key={step} className={"protocol-step " + (i === activeStep ? "active" : i < activeStep ? "done" : "")}>
              <i>{i < activeStep ? "✓" : i + 1}</i>
              <span>{step}</span>
            </div>
          ))}
        </div>
        {(ev.id === "dust_storm" || ev.id === "solar_flare" || cat?.shelterRequired || cat?.shelterRecommended) && (
          <button className="shelter-btn" onClick={() => { c.enterShelter?.(); setShelterOpen(true); }}>
            :i-home: {fr ? "Voir l’intérieur de l’abri" : "View shelter interior"}
          </button>
        )}
      </div>

      {hz?.bonus && (
        <div className={"bonus" + (reached ? " got" : "")} style={{ margin: "6px auto" }}>
          {reached ? ":i-check: " + t("intervened", { res }) : ":i-target: " + t("intervene", { res })}
        </div>
      )}

      {ready && sm && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <button
            className="go"
            style={{ minWidth: 200, padding: "12px 24px", fontSize: "1.05rem" }}
            onClick={() => { audio.ok(); c.ackAlert(); }}
          >
            <b>{lang === "fr" ? "Continuer" : "Continue"} :i-play:</b>
          </button>
        </div>
      )}

      {ready && !sm && (
        <div className="choices">
          <small>{t("chooseResponse")}</small>
          <button className="coach-help" onClick={() => setHelpOpen((v) => !v)}>
            :i-robot: {helpOpen ? (fr ? "Masquer l’aide" : "Hide help") : (fr ? "NOVA, aide-moi" : "NOVA, help me")}
          </button>
          {helpOpen && (
            <div className="help-tip">
              {cat
                ? fr ? `Indice : ${L(cat.whatToDo, lang)}` : `Hint: ${L(cat.whatToDo, lang)}`
                : fr ? "Protège d'abord l'équipage." : "Protect crew first."}
            </div>
          )}
          <div className="choice-row">
            {ev.choices.map((ch) => {
              const poor = (ch.cost || 0) > funds && ev.choices.some((o) => !o.cost);
              const eff = Object.entries(ch.effects || {}).filter(([, v]) => v);
              return (
                <button key={ch.id} className={"choice " + (ch.risk || "")} disabled={poor} onClick={() => { audio.ok(); c.chooseEvent(ch.id); }}>
                  <b>{L(ch.label, lang)}</b>
                  <div className="eff">{eff.map(([k, v]) => <span key={k} className={v > 0 ? "up" : "down"} style={{ "--c": RES[k].color }}>{RES[k].icon} {v > 0 ? "+" : ""}{v}</span>)}</div>
                  <div className="meta"><span>{ch.cost ? `:i-coin: −${ch.cost}` : t("free0")}</span><span className={"risk " + ch.risk}>{t("risk_" + (ch.risk || "low"))}</span></div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {shelterOpen && <ShelterView event={ev} onClose={() => setShelterOpen(false)} />}
    </div>
  );
}

function ShelterView({ event, onClose }) {
  const c = useCtrl();
  const lang = useGame((s) => s.lang);
  const game = useGame((s) => s.game);
  const fr = lang === "fr";
  const res = game?.resources || {};
  const alert = event?.id || "none";
  const why =
    alert === "dust_storm"
      ? (fr ? "La tempete reduit la visibilite et peut couvrir les panneaux. L'equipage reste pressurise a l'interieur." : "The storm cuts visibility and can cover solar panels. The crew stays pressurized inside.")
      : alert === "solar_flare"
        ? (fr ? "Une alerte solaire augmente le risque de rayonnement. L'equipage se place derriere le blindage." : "A solar alert raises radiation risk. The crew moves behind the shielding.")
        : (fr ? "L'equipage utilise l'abri pressurise pendant l'incident." : "The crew uses the pressurized shelter during the incident.");

  function close() {
    c.exitShelter?.();
    onClose?.();
  }

  return (
    <div className="shelter-view" role="dialog" aria-label={fr ? "Vue interieure de l'abri" : "Shelter interior"}>
      <div className="shelter-card">
        <button type="button" className="x" onClick={close} aria-label="close">X</button>
        <div className="eyebrow">MODULE DE PROTECTION · VUE INTERIEURE</div>
        <h2>{fr ? "Les astronautes se mettent a l'abri" : "Astronauts take shelter"}</h2>
        <p className="mut">{why}</p>
        <div className="shelter-room">
          <div className="room-label">{fr ? "SAS / DECONTAMINATION" : "AIRLOCK / DECON"}</div>
          <div className="room-core">
            <span>A1</span><span>A2</span><span>A3</span><span>A4</span>
            <b>O2 {res.o2 ?? "—"}% · SHIELD {res.protection ?? "—"}% · PWR {res.energy ?? "—"}%</b>
          </div>
          <div className="room-label">{fr ? "ZONE DE VIE PRESSURISEE" : "PRESSURIZED LIVING AREA"}</div>
        </div>
        <ul className="shelter-status">
          <li>{fr ? "Sas" : "Airlock"} — OK</li>
          <li>{fr ? "Oxygene cabine" : "Cabin oxygen"} — {res.o2 ?? "—"}%</li>
          <li>{fr ? "Batteries" : "Batteries"} — {res.energy ?? "—"}%</li>
          <li>{fr ? "Blindage" : "Shielding"} — {res.protection ?? "—"}%</li>
          <li>{fr ? "Nourriture" : "Food"} — {res.food ?? "—"}%</li>
          <li>{fr ? "Alerte" : "Alert"} — {String(alert).replaceAll("_", " ")}</li>
        </ul>
        <div className="shelter-fact">
          <b>{fr ? "A retenir" : "Remember"}</b>
          <span>
            {fr
              ? "Un abri pressurise protege contre le vide, la poussiere et une partie du rayonnement. Il ne rend pas une sortie sure pendant une alerte."
              : "A pressurized shelter protects against vacuum, dust and some radiation. It does not make an EVA safe during an alert."}
          </span>
          <a href="https://www.nasa.gov/humans-in-space/space-radiation/" target="_blank" rel="noreferrer">NASA · Space radiation</a>
        </div>
        <button type="button" className="btn primary" onClick={close}>
          {fr ? "Sortir de l'abri / retour protocole" : "Exit shelter / back to protocol"}
        </button>
      </div>
    </div>
  );
}

export function ResolveBanner() {
  const t = useT(); const game = useGame((s) => s.game);
  return <div className="banner sweep">{t("daySweep", { n: Math.max(1, game.day - 1) })}</div>;
}

export function Summary() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), d = useGame((s) => s.lastDelta), lost = useGame((s) => s.crewLost), game = useGame((s) => s.game), label = useGame((s) => s.lastChoice), bonus = useGame((s) => s.bonusRes), effects = useGame((s) => s.lastChoiceEffects), delay = useGame((s) => s.commDelayMin), toast = useGame((s) => s.toast);
  useEffect(() => { if (lost) audio.fail(); }, [lost]);
  if (!d) return null;
  return (
    <div className="screen center" onClick={() => c.continueSummary()}>
      <div className="panel summary">
        <h2>{t("daySummaryTitle")}</h2>
        {label && <p className="chosen">«&nbsp;{L(label, lang)}&nbsp;»</p>}
        {effects && (
          <div className="tradeoff" style={{ margin: "8px 0 12px", padding: "8px 10px", background: "#ffffff10", borderRadius: 8, fontSize: 13 }}>
            <b>{t("tradeoffTitle")}</b>
            {effects.cost > 0 && <div>{t("tradeoffCost")} : :i-coin: {effects.cost}</div>}
            <div>{t("tradeoffEffect")} : {Object.entries(effects.effects || {}).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${t(RES[k]?.key || k)}`).join(" · ") || "—"}</div>
            {effects.risk === "high" && <div style={{ color: "#ff8a8a" }}>:i-alert: {t("riskyMsg")}</div>}
          </div>
        )}
        <div className="deltas">{Object.entries(RES).map(([k, r]) => <div key={k} style={{ "--c": r.color }} className={d[k] > 0 ? "up" : d[k] < 0 ? "down" : ""}><span>{r.icon}</span><small>{t(r.key)}</small><b>{d[k] > 0 ? "+" : ""}{d[k]}</b><em>{game.resources[k]}%</em></div>)}</div>
        {useGame((s) => s.riskyChoice) && <p className="lostline">:i-alert: {t("riskyMsg")}</p>}
        {bonus && <p className="bonusline">:i-target: {t("bonusMsg", { res: t(RES[bonus].key) })}</p>}
        {toast === "transmit" && <p className="bonusline">:i-antenna: {t("transmitSent", { n: delay || 14 })}</p>}
        {lost > 0 && <p className="lostline">:i-heart-broken: {t("crewLostMsg", { n: game.crew })}</p>}
        <p className="tapc">{t("tapContinue")}</p>
      </div>
    </div>
  );
}

export function Fact() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), id = useGame((s) => s.factId); const [detail, setDetail] = useState(false);
  const f = useMemo(() => c.data.facts.find((x) => x.id === id), [id, c]);
  if (!f) return null;
  return (
    <div className="screen center">
      <div className="panel fact">
        <div className="eyebrow">:i-telescope: {t("didYouKnow")}</div>
        {!detail ? (<>
          <p className="fact-text">{L(f.text, lang)}</p>
          <div className="bignum">{f.value}<small>{f.unit}</small></div>
          <div className="row"><Btn kind="ghost" onClick={() => setDetail(true)}>{t("seeData")}</Btn><Btn onClick={() => c.continueFact()}>{t("understood")}</Btn></div>
        </>) : (<>
          <dl className="datalist"><dt>{t("usedFor")}</dt><dd>{L(f.used_for, lang)}</dd><dt>{t("source")}</dt><dd>{f.source_name}{" "}<span className={"vb " + (f.verified ? "ok" : "")}>{f.verified ? ":i-check: " + t("verified") : ":i-alert: " + t("unverified")}</span></dd><dt>{t("accessed")}</dt><dd>{f.accessed}</dd></dl>
          <div className="row"><Btn kind="ghost" onClick={() => setDetail(false)}>← {t("back")}</Btn>{f.source_url && <a className="btn ghost" href={f.source_url} target="_blank" rel="noreferrer">{t("visit")} :i-external:</a>}</div>
        </>)}
      </div>
    </div>
  );
}

function Curves({ history }) {
  if (!history.length) return null; const W = 320, H = 120, n = history.length;
  const x = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - 16) + 8), y = (v) => H - 8 - (v / 100) * (H - 16);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="curves" role="img" aria-label="curves">
      {[0, 50, 100].map((v) => <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} stroke="#ffffff22" strokeDasharray="3 4" />)}
      {Object.entries(RES).map(([k, r]) => <polyline key={k} fill="none" stroke={r.color} strokeWidth="2.4" strokeLinejoin="round" points={history.map((h, i) => `${x(i)},${y(h.resources[k])}`).join(" ")} />)}
    </svg>
  );
}

export function End() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), g = useGame((s) => s.game), sc = useGame((s) => s.score), best = useGame((s) => s.best), [copied, setCopied] = useState(false);
  useEffect(() => { g.success ? audio.win() : audio.fail(); rt.cam.intro = true; rt.cam.follow = false; return () => { rt.cam.intro = false; rt.cam.follow = true; }; }, [g.success]);
  if (!sc) return null;
  let why = ""; const h = g.history; if (h.length) {
    if (!g.success) { const last = h[h.length - 1], k = Object.keys(RES).find((r) => last.resources[r] <= 0) || "o2"; why = t("whyFail", { d: last.day, res: t(RES[k].key).toLowerCase() }); }
    else { let m = { v: 101 }; h.forEach((e) => Object.keys(RES).forEach((k) => { if (e.resources[k] < m.v) m = { v: e.resources[k], k, d: e.day }; })); why = t("whyWin", { res: t(RES[m.k].key).toLowerCase(), v: m.v, d: m.d }); }
  }
  const msg = `${t("title")} — ${t(g.success ? "victory" : "defeat")} · ${t("score")} ${sc.total}/850 · ${t("rank_" + sc.rank)}`;
  const share = async () => { try { if (navigator.share) await navigator.share({ title: t("title"), text: msg, url: location.href }); else { await navigator.clipboard.writeText(msg + " " + location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } } catch (_) {} };
  return (
    <div className="screen end">
      <div className={"panel endcard " + (g.success ? "win" : "lose")}>
        <div className="eyebrow">{g.success ? ":i-rocket:" : ":i-satellite:"} {t(g.success ? "victoryDesc" : g.endReason === "life" ? "endLife" : "defeatDesc")}</div>
        <h2>{t(g.success ? "victory" : "defeat")}</h2>
        <div className="scorebig"><b>{sc.total}</b><small>/ 850</small><span className="rank">:i-medal: {t("rank_" + sc.rank)}</span></div>
        <div className="breakdown"><div><small>{t("scoreCrew")}</small><b>{sc.crewScore}</b></div><div><small>{t("scoreDays")}</small><b>{sc.daysScore}</b></div><div><small>{t("scoreResources")}</small><b>{sc.resScore}</b></div><div><small>{t("scoreBudget")}</small><b>{sc.budgetScore}</b></div></div>
        <h3>{t("curves")}</h3><Curves history={g.history} />
        <div className="legend">{Object.entries(RES).map(([k, r]) => <span key={k} style={{ color: r.color }}>● {t(r.key)}</span>)}</div>
        {why && <p className="why"><b>{t("why")} :</b> {why}</p>}
        <div style={{ margin: "12px 0", padding: "10px", background: "#ffffff0c", borderRadius: 8, fontSize: 12, textAlign: "left" }}>
          <b>{t("sourcesUsed")}</b>
          <p style={{ margin: "4px 0 0", opacity: 0.85 }}>{t("sourcesNote")}</p>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, opacity: 0.8 }}>
            <li>NASA NSSDC — Mars & Moon Fact Sheets</li>
            <li>NASA / JPL Horizons (distance & light-time)</li>
            <li>Jezero Crater · Gale Crater · Artemis III candidate regions</li>
          </ul>
        </div>
        <p className="best">:i-trophy: {t("best")} : {best}</p>
        <div className="row"><Btn onClick={() => c.launch()}>↻ {t("replay")}</Btn><Btn kind="ghost" onClick={share}>{copied ? t("copied") : ":i-external: " + t("share")}</Btn><Btn kind="ghost" onClick={() => c.goIntro()}>{t("home")}</Btn></div>
      </div>
    </div>
  );
}

export function Inspect() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), type = useGame((s) => s.inspect), built = useGame((s) => s.built), game = useGame((s) => s.game), phase = useGame((s) => s.phase);
  if (!type) return null; const a = c.defOf(MOD_ACTION[type]), n = (built[type] || []).length;
  return (
    <div className="inspect panel"><button className="x" onClick={() => c.inspect(null)}>✕</button>
      <div className="ins-h"><span>{ACT_ICON[a.id]}</span><div><b>{L(a.name, lang)}</b><small>{t("moduleCount", { n })}</small></div></div>
      <p>{L(a.description, lang)}</p>
      {phase === "plan" && n < 4 && <Btn onClick={() => { c.inspect(null); c.beginPlacing(a.id); }}>{t("inspectBuild")} · :i-coin: {a.cost}</Btn>}
    </div>
  );
}

export function Tutorial() {
  const c = useCtrl(), t = useT(); const step = useGame((s) => s.tutorial);
  if (!step) return null;
  return (
    <div className="tutorial panel"><div className="tut-n">{step}/3</div><b>{t("tut" + step + "T")}</b><p>{t("tut" + step)}</p>
      <div className="row"><Btn kind="ghost" onClick={() => c.endTutorial()}>{t("skip")}</Btn><Btn onClick={() => c.nextTutorial()}>{step < 3 ? t("next") : t("gotIt")}</Btn></div></div>
  );
}

export function Settings() {
  const c = useCtrl(), t = useT(); const open = useGame((s) => s.settings), lang = useGame((s) => s.lang), sound = useGame((s) => s.sound), q = useGame((s) => s.quality);
  if (!open) return null; const close = () => c.store.set({ settings: false });
  return (
    <div className="screen center" onClick={close}>
      <div className="panel settings" onClick={(e) => e.stopPropagation()}>
        <h2>{t("settings")}</h2>
        <div className="set-row"><span>{t("language")}</span><div className="seg"><button className={lang === "fr" ? "on" : ""} onClick={() => c.setLang("fr")}>FR</button><button className={lang === "en" ? "on" : ""} onClick={() => c.setLang("en")}>EN</button></div></div>
        <div className="set-row"><span>{t("sound")}</span><div className="seg"><button className={sound ? "on" : ""} onClick={() => !sound && c.toggleSound()}>ON</button><button className={!sound ? "on" : ""} onClick={() => sound && c.toggleSound()}>OFF</button></div></div>
        <div className="set-row"><span>{t("quality")}</span><div className="seg">{[["auto", "qAuto"], ["high", "qHigh"], ["low", "qLow"]].map(([k, l]) => <button key={k} className={q === k ? "on" : ""} onClick={() => c.setQuality(k)}>{t(l)}</button>)}</div></div>
        <div className="row"><Btn kind="ghost" onClick={() => { close(); c.goIntro(); }}>{t("btnRestartMission")}</Btn><Btn onClick={close}>{t("close")}</Btn></div>
      </div>
    </div>
  );
}

export function NoWebGL() {
  const t = useT();
  return <div className="screen center"><div className="panel"><h2>{t("noWebgl")}</h2><p>{t("noWebglHelp")}</p></div></div>;
}
