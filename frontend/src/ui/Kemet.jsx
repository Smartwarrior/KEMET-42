import { useState as useStateT, useEffect as useEffectT } from "react";
import { novaSpeak as novaSpeakT } from "./novaSpeak.js";
import { transitPhase, transitLine } from "../kemet/space.js";
import { useEffect, useState } from "react";
import { useCtrl, useGame } from "../game/useStore.js";
import { useT } from "./HUD.jsx";
import { RES, L } from "./strings.js";
import { CALLSIGN_COLORS } from "../game/layout.js";
import { BODIES, SITES } from "../kemet/facts.js";
import { fetchHorizons } from "../kemet/api.js";
import { RULES } from "../game/controller.js";
import { rt } from "../world/sim.js";
import { audio } from "./audio.js";
import { LAYERS, SITE_COORDS, tileUrl, toXY, grid } from "../kemet/atlas.js";
import { novaSpeak, stopNovaSpeak } from "./novaSpeak.js";

const Btn = ({ children, onClick, kind = "primary", ...p }) => <button className={"btn " + kind} onClick={(e) => { audio.unlock(); audio.click(); onClick && onClick(e); }} {...p}>{children}</button>;
const SrcLink = ({ src, t }) => <a className="srclink" href={src.url} target="_blank" rel="noreferrer">{t("srcLabel")} : {src.name}{src.updated ? ` · ${t("updatedLbl")} ${src.updated}` : ""} :i-external:</a>;
const SKINS = ["#f1c27d", "#d9a066", "#a9703a", "#6b4426"], SUITS = ["#f1f3f8", "#ff9a3c", "#7fb2ff", "#8ce0a0"], VISORS = ["#2a1d0a", "#16407a", "#4a1a6a"], PATCHES = [":i-earth:", ":i-rocket:", ":i-star:", ":i-eagle:", ":i-paw:", ":i-sun:"];

/** Aperçu SVG de l'astronaute en cours d'habillage (mêmes couleurs que le personnage 3D). */
export function SuitPreview({ suit, accent }) {
  return (
    <svg viewBox="0 0 200 260" className="suit-prev" role="img" aria-label="astronaut">
      <ellipse cx="100" cy="246" rx="56" ry="9" fill="#00000055" />
      <rect x="40" y="96" width="34" height="84" rx="14" fill={accent} /><rect x="64" y="104" width="72" height="92" rx="30" fill={suit.suit} />
      <rect x="70" y="190" width="24" height="52" rx="11" fill={suit.suit} /><rect x="106" y="190" width="24" height="52" rx="11" fill={suit.suit} /><rect x="66" y="236" width="32" height="12" rx="5" fill="#1b2030" /><rect x="102" y="236" width="32" height="12" rx="5" fill="#1b2030" />
      <rect x="40" y="110" width="26" height="70" rx="12" fill={suit.suit} transform="rotate(8 53 110)" /><rect x="134" y="110" width="26" height="70" rx="12" fill={suit.suit} transform="rotate(-8 147 110)" /><circle cx="46" cy="186" r="12" fill="#8b93a3" /><circle cx="154" cy="186" r="12" fill="#8b93a3" />
      <rect x="86" y="132" width="28" height="20" rx="4" fill={accent} /><text x="100" y="172" fontSize="22" textAnchor="middle">{suit.patch}</text>
      <circle cx="100" cy="64" r="52" fill={suit.suit} stroke="#00000022" strokeWidth="2" /><ellipse cx="100" cy="68" rx="38" ry="34" fill={suit.visor} /><ellipse cx="100" cy="70" rx="30" ry="26" fill={suit.skin} />
      <circle cx="89" cy="66" r="3.5" fill="#10131c" /><circle cx="111" cy="66" r="3.5" fill="#10131c" /><path d="M90 80q10 8 20 0" stroke="#10131c" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="82" cy="50" rx="16" ry="8" fill="#ffffff" opacity=".28" transform="rotate(-24 82 50)" />
      {suit.name && <text x="100" y="155" fontSize="11" fontWeight="700" textAnchor="middle" fill="#1b2030">{suit.name.slice(0, 10).toUpperCase()}</text>}
    </svg>
  );
}

export function Login() {
  const c = useCtrl(), t = useT(); const err = useGame((s) => s.authError), busy = useGame((s) => s.authBusy), lang = useGame((s) => s.lang);
  const [mode, setMode] = useState("login"), [name, setName] = useState(""), [pw, setPw] = useState("");
  const errMsg = err && t("err" + err[0].toUpperCase() + err.slice(1));
  const submit = (e) => { e?.preventDefault?.(); audio.unlock(); c.auth(mode, name, pw); };
  const enter = (e) => { if (e.key === "Enter") submit(e); };
  return (
    <div className="screen center login-screen">
      <div className="panel login" onKeyDown={enter}>
        <div className="eyebrow">NASA SPACE APPS CHALLENGE 2026</div>
        <h1 className="logo">KEMET-42</h1>
        <p className="sub">{t("tagline")}</p>
        <h2>{t("authTitle")}</h2><p className="mut">{t("authSub")}</p>
        <label>{t("userName")}<input value={name} onChange={(e) => setName(e.target.value)} autoComplete="username" maxLength={24} autoFocus /></label>
        <label>{t("password")}<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
        {errMsg && <div className="err">{errMsg}</div>}
        <button className="btn primary wide" disabled={busy} type="button" onClick={submit}>{mode === "login" ? t("login") : t("register")}</button>
        <button type="button" className="linkbtn" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? t("noAccount") + " " + t("register") : t("haveAccount")}</button>
        <button type="button" className="btn ghost wide" style={{ marginTop: 10 }} onClick={() => { audio.click(); c.playAsGuest(); }}>{t("playGuest")}</button>
        <small className="demo">{t("playGuestHint")}</small>
        {c.backend?.mode === "demo" && <small className="demo">{t("demoMode")}</small>}
        <div className="langrow"><button type="button" className="icon" onClick={() => c.setLang(lang === "fr" ? "en" : "fr")}>{lang === "fr" ? "EN" : "FR"}</button></div>
      </div>
    </div>
  );
}

export function Hangar() {
  const c = useCtrl(), t = useT(); const suit = useGame((s) => s.suit), callsign = useGame((s) => s.callsign);
  const accent = CALLSIGN_COLORS[callsign];
  useEffect(() => { rt.cam.intro = true; }, []);
  return (
    <div className="screen kemet-step">
      <div className="panel step wide2">
        <div className="eyebrow">1 / 4 · {t("hangarTitle")}</div><h2>{t("hangarSub")}</h2>
        <div className="hangar-grid">
          <SuitPreview suit={suit} accent={accent} />
          <div className="opts">
            <h3>{t("callsignLbl")}</h3><div className="callsigns">{Object.entries(CALLSIGN_COLORS).map(([n, col]) => <button key={n} className={"chip" + (n === callsign ? " on" : "")} style={{ "--c": col }} onClick={() => { audio.click(); c.setCallsign(n); }}><i />{n}</button>)}</div>
            <h3>{t("suitColor")}</h3><div className="swatches">{SUITS.map((x) => <button key={x} className={suit.suit === x ? "on" : ""} style={{ background: x }} onClick={() => c.setSuit({ suit: x })} aria-label={x} />)}</div>
            <h3>{t("visorColor")}</h3><div className="swatches">{VISORS.map((x) => <button key={x} className={suit.visor === x ? "on" : ""} style={{ background: x }} onClick={() => c.setSuit({ visor: x })} aria-label={x} />)}</div>
            <h3>{t("skinTone")}</h3><div className="swatches">{SKINS.map((x) => <button key={x} className={suit.skin === x ? "on" : ""} style={{ background: x }} onClick={() => c.setSuit({ skin: x })} aria-label={x} />)}</div>
            <h3>{t("patch")}</h3><div className="patches">{PATCHES.map((x) => <button key={x} className={suit.patch === x ? "on" : ""} onClick={() => c.setSuit({ patch: x })}>{x}</button>)}</div>
            <label className="lbl">{t("displayName")}<input value={suit.name} maxLength={10} onChange={(e) => c.setSuit({ name: e.target.value })} /></label>
          </div>
        </div>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goIntro()}>← {t("back")}</Btn><Btn onClick={() => c.goLoadout()}>{t("next")} :i-play:</Btn></div>
      </div>
    </div>
  );
}

export function Loadout() {
  const c = useCtrl(), t = useT(); const lo = useGame((s) => s.loadout);
  const sum = Object.values(lo).reduce((a, b) => a + b, 0), left = RULES.loadoutTotal - sum;
  const desc = { o2: "resO2Desc", energy: "resEnergyDesc", food: "resFoodDesc", protection: "resProtDesc" };
  return (
    <div className="screen kemet-step">
      <div className="panel step wide2">
        <div className="eyebrow">2 / 4 · {t("loadoutTitle")}</div>
        <h2>{t("loadoutTitle")}</h2><p className="mut">{t("loadoutSub", { total: RULES.loadoutTotal, min: RULES.loadoutMin, max: RULES.loadoutMax })}</p>
        <div className="loadout">{Object.entries(RES).map(([k, r]) => (
          <div key={k} className="lo-row" style={{ "--c": r.color }}>
            <span className="lo-ic">{r.icon}</span><div className="lo-txt"><b>{t(r.key)}</b><small>{t(desc[k])}</small><div className="bar"><i style={{ width: lo[k] + "%" }} /></div></div>
            <div className="lo-ctl"><button onClick={() => { audio.click(); c.adjustLoadout(k, -10); }} aria-label="-">−</button><b>{lo[k]}</b><button onClick={() => { c.adjustLoadout(k, 10) ? audio.click() : audio.error(); }} aria-label="+">+</button></div>
          </div>))}</div>
        <div className={"left" + (left === 0 ? " zero" : "")}>{t("pointsLeft")} : <b>{left}</b> <em>({t("gameRule")})</em></div>
        <p className="mut">{t("loadoutHint")}</p>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goHangar()}>← {t("back")}</Btn><Btn onClick={() => c.goDestination()}>{t("next")} :i-play:</Btn></div>
      </div>
    </div>
  );
}

function useHorizons(id) {
  const [d, setD] = useState(null);
  useEffect(() => { let on = true; setD(null); fetchHorizons(id).then((r) => on && setD(r)); return () => { on = false; }; }, [id]);
  return d;
}
function BodyCard({ b, onPick }) {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), hz = useHorizons(b.horizonsId);
  const fmt = (n, dg = 0) => n.toLocaleString(lang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: dg });
  return (
    <div className="body-card" style={{ "--c": b.color }}>
      <div className="body-h"><span>{b.icon}</span><h3>{L(b.name, lang)}</h3></div>
      <div className="hz">{hz === null ? <small>…</small> : hz.ok ? <><b>{fmt(hz.km)} km</b> <small>({fmt(hz.au, 3)} UA · {t("distLive")} {hz.date})</small><div>{t("lightTime")} <b>{fmt(hz.lightMin, 1)} {t("minutes")}</b></div></> : <small>{t("distOffline")}</small>}<div className="hzt">{t("distNow")}</div></div>
      <dl>{b.facts.map((f, i) => <div key={i}><dt>{L(f.k, lang)}</dt><dd>{typeof f.v === "string" ? f.v : L(f.v, lang)}</dd></div>)}</dl>
      <SrcLink src={b.src} t={t} />
      <Btn onClick={onPick}>{t("chooseBody", { name: L(b.name, lang) })} :i-play:</Btn>
    </div>
  );
}
export function Destination() {
  const c = useCtrl(), t = useT();
  const lang = useGame((s) => s.lang);
  const fr = lang === "fr";
  const moon = BODIES.moon, mars = BODIES.mars;
  const fact = (body, keyFr) => {
    const row = (body.facts || []).find((f) => (f.k?.fr || f.k) === keyFr || (typeof f.k === "string" && f.k.includes(keyFr.slice(0, 6))));
    if (!row) return "—";
    return typeof row.v === "string" ? row.v : L(row.v, lang);
  };
  const rows = [
    { label: fr ? "Gravité" : "Gravity", moon: fact(moon, "Gravité à la surface") || "1,62 m/s²", mars: fact(mars, "Gravité à la surface") || "3,71 m/s²" },
    { label: fr ? "Atmosphère" : "Atmosphere", moon: fact(moon, "Atmosphère") || (fr ? "extrêmement ténue" : "extremely tenuous"), mars: fact(mars, "Atmosphère") || "95 % CO₂" },
    { label: fr ? "Jour / nuit" : "Day / night", moon: fr ? "~14 j de jour / 14 j de nuit" : "~14 d day / 14 d night", mars: fr ? "Sol ≈ 24 h 40 min" : "Sol ≈ 24 h 40 min" },
    { label: fr ? "Température" : "Temperature", moon: fact(moon, "Température à l'équateur") || "95–390 K", mars: fr ? "≈ −90 °C à +20 °C (typique)" : "≈ −90 °C to +20 °C (typical)" },
    { label: fr ? "Distance Terre" : "Distance from Earth", moon: "384 400 km", mars: fr ? "~55–400 millions km" : "~55–400 million km" },
    { label: fr ? "Délai signal (aller)" : "Signal delay (one way)", moon: "≈ 1,3 s", mars: fr ? "≈ 4–24 min" : "≈ 4–24 min" },
    { label: fr ? "Risques principaux" : "Main risks", moon: fr ? "Nuit longue, radiations, régolithe" : "Long night, radiation, regolith", mars: fr ? "Tempêtes de poussière, radiations, perchlorates" : "Dust storms, radiation, perchlorates" },
    { label: fr ? "Glace d'eau" : "Water ice", moon: fr ? "Pôles ombragés (Artemis)" : "Polar shadowed regions (Artemis)", mars: fr ? "Pôles et sous-sol (MRO, Phoenix)" : "Poles and subsurface (MRO, Phoenix)" },
  ];
  return (
    <div className="screen kemet-step">
      <div className="panel step wide3">
        <div className="eyebrow">3 / 4 · {t("destTitle")}</div>
        <h2>{t("destTitle")}</h2>
        <p className="mut">{t("destSub")}</p>

        <div className="dest-compare">
          <h3>{fr ? "Lune ou Mars ? Regarde les différences" : "Moon or Mars? See the differences"}</h3>
          <table className="compare-table">
            <thead>
              <tr>
                <th>{fr ? "Critère" : "Criterion"}</th>
                <th>:i-moon: {fr ? "Lune" : "Moon"}</th>
                <th>:i-dot-red: Mars</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <td><b>{r.label}</b></td>
                  <td>{r.moon}</td>
                  <td>{r.mars}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="compare-sources">
            {moon?.src && <a href={moon.src.url} target="_blank" rel="noreferrer">{moon.src.name}</a>}
            {" · "}
            {mars?.src && <a href={mars.src.url} target="_blank" rel="noreferrer">{mars.src.name}</a>}
            {" · "}
            <a href="https://www.nasa.gov/artemis/" target="_blank" rel="noreferrer">NASA Artemis</a>
            {" · "}
            <a href="https://mars.nasa.gov/" target="_blank" rel="noreferrer">NASA Mars Exploration</a>
          </p>
          <small className="mut">
            {fr
              ? "Ces infos viennent de la NASA. Dans le jeu, le temps d'attente radio est plus simple (Lune ≈ 2 min, Mars ≈ 14 min)."
              : "These facts come from NASA. In the game, radio wait time is simpler (Moon ≈ 2 min, Mars ≈ 14 min)."}
          </small>
        </div>

        <div className="bodies">{Object.values(BODIES).map((b) => <BodyCard key={b.id} b={b} onPick={() => { audio.ok(); c.pickDestination(b.id); }} />)}</div>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goLoadout()}>← {t("back")}</Btn><span /></div>
      </div>
    </div>
  );
}

export function SiteStep() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), dest = useGame((s) => s.dest), site = useGame((s) => s.site);
  const sites = SITES[dest] || [], cur = sites.find((x) => x.id === site);
  return (
    <div className="screen kemet-step">
      <div className="panel step wide3">
        <div className="eyebrow">4 / 4 · {L(BODIES[dest].name, lang)}</div><h2>{t("siteTitle")}</h2><p className="mut">{t("siteSub")}</p>
        <div className="mission-constraints"><b>:i-compass: {lang === "fr" ? "Avant le départ : contraintes réelles" : "Before launch: real constraints"}</b><span>:i-lungs: {lang === "fr" ? "Atmosphère : " : "Atmosphere: "}{dest === "mars" ? "95,1 % CO₂ · pression 6,36 mb" : "vide spatial (atmosphère extrêmement ténue)"}</span><span>:i-sun: {lang === "fr" ? "Jour : " : "Day: "}{dest === "mars" ? "24,6597 h (un sol)" : "≈ 14 jours de jour / 14 jours de nuit"}</span><span>:i-antenna: {lang === "fr" ? "Délai aller simple : " : "One-way delay: "}{dest === "mars" ? "environ 3–22 min selon la position" : "≈ 1,3 s"}</span><small>{lang === "fr" ? "Les valeurs scientifiques sont sourcées ci-dessous. Les bonus restent des règles de jeu." : "Scientific values are sourced below. Bonuses remain game rules."}</small></div>
        <AtlasMap dest={dest} sites={sites} site={site} onPick={(id) => { audio.click(); c.pickSite(id); }} lang={lang} />
        {dest === "moon" && <small className="mut">{lang === "fr" ? "Projection plate : près du pôle Sud, les sites sont écrasés sur le bord bas de la carte." : "Flat projection: near the South Pole, sites are squashed along the bottom edge."}</small>}
        <div className="site-grid">
          <div className="site-list">{sites.map((s) => <button key={s.id} className={"site" + (s.id === site ? " on" : "")} onClick={() => { audio.click(); c.pickSite(s.id); }}><span>{s.icon}</span><b>{L(s.name, lang)}</b></button>)}</div>
          <div className="site-detail">{cur ? (<>
            <h3>{cur.icon} {L(cur.name, lang)}</h3>
            <h4>{t("siteKnown")}</h4><ul>{cur.known.map((k, i) => <li key={i}>{L(k, lang)}</li>)}</ul>
            <h4>{t("siteTerrain")}</h4><p>{L(cur.risk, lang)}</p>
            <div className="bonus-box"><b>{t("siteBonus")} : +{cur.gameBonus.amount} {t(RES[cur.gameBonus.res].key)}</b><small>{L(cur.gameBonus.why, lang)} — <em>{t("siteRule")}</em></small></div>
            <SrcLink src={cur.src} t={t} />
          </>) : <p className="mut">←</p>}</div>
        </div>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goDestination()}>← {t("back")}</Btn><Btn disabled={!site} onClick={() => { audio.ok(); c.startTransit(); }}>:i-rocket: {t("launchBtn")}</Btn></div>
      </div>
    </div>
  );
}

export function Transit() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), dest = useGame((s) => s.dest), site = useGame((s) => s.site);
  const [sec, setSec] = useStateT(0); useEffectT(() => { const t0 = Date.now(), id = setInterval(() => setSec((Date.now() - t0) / 1000), 200); return () => clearInterval(id); }, []);
  const ph = transitPhase(sec); useEffectT(() => { const l = transitLine(ph, dest, lang); if (l) novaSpeakT(l, lang); }, [ph.key]);
  const b = BODIES[dest], st = (SITES[dest] || []).find((x) => x.id === site);
  return (
    <div className="screen transit" onClick={() => c.skipTransit()}>
      <div className="stars" />
      <div className="route"><span className="earth">:i-earth:</span><div className="track"><i className="rocket">:i-rocket:</i></div><span className="target" style={{ filter: `drop-shadow(0 0 14px ${b.color})` }}>{b.icon}</span></div>
      {ph.name === "count" && <div className="countdown">T-{ph.n}</div>}{ph.name === "lift" && <div className="countdown go">:i-rocket:</div>}
      <h2>{t("transitTitle")}</h2><p>{t("transitText", { name: L(b.name, lang) })}</p><p className="mut">{t("landed", { site: st ? L(st.name, lang) : "" })}</p>
      <small className="skip">{t("transitSkip")} ▸</small>
    </div>
  );
}

export function Quiz() {
  const c = useCtrl(), t = useT();
  const q = useGame((s) => s.quiz), life = useGame((s) => s.life), lang = useGame((s) => s.lang);
  const fr = lang === "fr";

  // Nova lit la question, puis les choix (numérotés), de façon progressive pour les enfants.
  useEffect(() => {
    if (!q || q.chosen != null) return;
    const letters = ["A", "B", "C", "D"];
    const optsText = (q.options || [])
      .map((o, i) => `${letters[i] || i + 1}. ${o}`)
      .join(". ");
    const intro = fr
      ? `Question. ${q.q} Voici les choix. ${optsText}`
      : `Question. ${q.q} Here are the choices. ${optsText}`;
    novaSpeak(intro, lang);
    return () => stopNovaSpeak();
  }, [q?.id, q?.q, q?.chosen, lang]);

  // Après la réponse : Nova lit le résultat + l’explication + la source NASA.
  useEffect(() => {
    if (!q || q.chosen == null) return;
    const right = q.right;
    const goodLine = fr ? "Bravo ! C’est la bonne réponse." : "Great! That is the right answer.";
    const badLine = fr
      ? "Ce n’est pas la bonne réponse. Écoute bien l’explication."
      : "That is not the right answer. Listen carefully to the explanation.";
    const explain = `${right ? goodLine : badLine} ${q.why || ""}`;
    novaSpeak(explain, lang);
    return () => stopNovaSpeak();
  }, [q?.chosen, q?.right, q?.why, lang]);

  if (!q) return null;
  const done = q.chosen != null;
  return (
    <div className="screen center quiz-screen">
      <div className="panel quiz">
        <div className="eyebrow">:i-cap: {t("quizTitle")}</div>
        <h2>{q.q}</h2>
        <div className="qopts">
          {q.options.map((o, i) => (
            <button
              key={i}
              disabled={done}
              className={
                "qopt" +
                (done && i === q.correct ? " ok" : "") +
                (done && i === q.chosen && i !== q.correct ? " ko" : "")
              }
              onClick={() => c.answerQuiz(i)}
            >
              {o}
            </button>
          ))}
        </div>
        {done && (
          <div className={"qres " + (q.right ? "good" : "bad")}>
            <b>{q.right ? ":i-check: " + t("quizRight") : ":i-x: " + t("quizWrong")}</b>
            <p>{q.why}</p>
            <SrcLink src={q.src} t={t} />
            {life <= 0 && <p className="lostline">{t("quizLifeOut")}</p>}
          </div>
        )}
        {done && (
          <div className="row">
            <Btn onClick={() => c.continueQuiz()}>{t("quizNext")} :i-play:</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

/** Mode serveur : la cargaison vient de GET /briefing (aucune valeur inventée côté front). */
export function CargoStep() {
  const c = useCtrl(), t = useT(); const b = useGame((s) => s.srvBriefing), busy = useGame((s) => s.srvBusy), err = useGame((s) => s.srvError), cargo = useGame((s) => s.cargo), lang = useGame((s) => s.lang);
  return (
    <div className="screen kemet-step">
      <div className="panel step wide2">
        <div className="eyebrow">2 / 4 · {lang === "fr" ? "Cargaison" : "Cargo"}</div>
        <h2>{lang === "fr" ? "Choisissez votre cargaison" : "Choose your cargo"}</h2>
        <p className="mut">{lang === "fr" ? "Liste fournie par le serveur KEMET-42 (GET /briefing). Elle sera envoyée au lancement." : "List provided by the KEMET-42 server (GET /briefing). Sent at launch."}</p>
        {busy && <p>:i-hourglass: …</p>}
        {err && <p className="mut">:i-alert: {lang === "fr" ? "Serveur injoignable. Vérifiez que le backend tourne sur le port 3000." : "Server unreachable. Check the backend on port 3000."} <Btn kind="ghost" onClick={() => c.loadBriefing()}>↻</Btn></p>}
        <div className="loadout">{(b?.cargo || []).map((x) => { const on = cargo.includes(x.id); return (
          <button key={x.id} className={"lo-row" + (on ? " on" : "")} onClick={() => { audio.click(); c.toggleCargo(x.id); }} style={{ textAlign: "left", opacity: on ? 1 : 0.7, outline: on ? "2px solid #5ad6ff" : "none" }}>
            <span className="lo-ic">{on ? ":i-check:" : ":i-box:"}</span><div className="lo-txt"><b>{x.name}</b>{x.description && <small>{x.description}</small>}{x.mass !== undefined && <small>{x.mass} kg</small>}</div></button>); })}</div>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goHangar()}>← {t("back")}</Btn><Btn onClick={() => c.goDestination()}>{t("next")} :i-play:</Btn></div>
      </div>
    </div>
  );
}

/** Carte réelle (tuiles NASA Trek) avec les sites d'atterrissage placés à leurs vraies coordonnées. */
function AtlasMap({ dest, sites, site, onPick, lang }) {
  const [bad, setBad] = useState(0); const L0 = LAYERS[dest]; const { cols, rows } = grid(2);
  if (!L0) return null;
  const cells = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([r, c]);
  return (
    <div className="atlas" style={{ position: "relative", aspectRatio: "2 / 1", maxHeight: "30vh", margin: "6px auto 10px", borderRadius: 12, overflow: "hidden", background: "#1a1d2b", border: "1px solid #ffffff22" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)` }}>
        {cells.map(([r, c]) => <img key={r + "-" + c} src={tileUrl(dest, 2, r, c)} alt="" draggable={false} onError={() => setBad((n) => n + 1)} style={{ width: "100%", height: "100%", display: "block", objectFit: "fill" }} />)}
      </div>
      {bad > cells.length / 2 && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "#0b0e1acc", color: "#cfd3dc", fontSize: 13, textAlign: "center", padding: 12 }}>{lang === "fr" ? "Carte NASA Trek indisponible (hors ligne ?). Les sites restent disponibles dans la liste." : "NASA Trek map unavailable (offline?). Sites remain available in the list."}</div>}
      {sites.map((s) => { const co = SITE_COORDS[s.id]; if (!co) return null; const p = toXY(co), on = s.id === site; return (
        <button key={s.id} onClick={() => onPick(s.id)} title={L(s.name, lang)} aria-label={L(s.name, lang)} style={{ position: "absolute", left: p.x + "%", top: p.y + "%", transform: "translate(-50%,-50%)", width: on ? 22 : 16, height: on ? 22 : 16, borderRadius: "50%", border: "2px solid #fff", background: on ? "#ff7a2f" : "#ffd24a", boxShadow: "0 0 0 3px #0008", cursor: "pointer", padding: 0 }} />); })}
      <small style={{ position: "absolute", left: 6, top: 4, background: "#0009", color: "#fff", padding: "2px 6px", borderRadius: 6, fontSize: 10 }}>{lang === "fr" ? "Carte réelle : " : "Real map: "}<a href={L0.page} target="_blank" rel="noreferrer" style={{ color: "#8fd3ff" }}>NASA Solar System Treks · {L0.name}</a></small>
    </div>
  );
}
