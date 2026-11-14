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

const Btn = ({ children, onClick, kind = "primary", ...p }) => <button className={"btn " + kind} onClick={(e) => { audio.unlock(); audio.click(); onClick && onClick(e); }} {...p}>{children}</button>;
const SrcLink = ({ src, t }) => <a className="srclink" href={src.url} target="_blank" rel="noreferrer">{t("srcLabel")} : {src.name}{src.updated ? ` · ${t("updatedLbl")} ${src.updated}` : ""} ↗</a>;
const SKINS = ["#f1c27d", "#d9a066", "#a9703a", "#6b4426"], SUITS = ["#f1f3f8", "#ff9a3c", "#7fb2ff", "#8ce0a0"], VISORS = ["#2a1d0a", "#16407a", "#4a1a6a"], PATCHES = ["🌍", "🚀", "⭐", "🦅", "🐆", "☀️"];

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
        <div className="row between"><Btn kind="ghost" onClick={() => c.goIntro()}>← {t("back")}</Btn><Btn onClick={() => c.goLoadout()}>{t("next")} ▶</Btn></div>
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
        <div className="row between"><Btn kind="ghost" onClick={() => c.goHangar()}>← {t("back")}</Btn><Btn onClick={() => c.goDestination()}>{t("next")} ▶</Btn></div>
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
      <Btn onClick={onPick}>{t("chooseBody", { name: L(b.name, lang) })} ▶</Btn>
    </div>
  );
}
export function Destination() {
  const c = useCtrl(), t = useT();
  return (
    <div className="screen kemet-step">
      <div className="panel step wide3">
        <div className="eyebrow">3 / 4 · {t("destTitle")}</div><h2>{t("destTitle")}</h2><p className="mut">{t("destSub")}</p>
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
        <div className="row between"><Btn kind="ghost" onClick={() => c.goDestination()}>← {t("back")}</Btn><Btn disabled={!site} onClick={() => { audio.ok(); c.startTransit(); }}>🚀 {t("launchBtn")}</Btn></div>
      </div>
    </div>
  );
}

export function Transit() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), dest = useGame((s) => s.dest), site = useGame((s) => s.site);
  const b = BODIES[dest], st = (SITES[dest] || []).find((x) => x.id === site);
  return (
    <div className="screen transit" onClick={() => c.skipTransit()}>
      <div className="stars" />
      <div className="route"><span className="earth">🌍</span><div className="track"><i className="rocket">🚀</i></div><span className="target" style={{ filter: `drop-shadow(0 0 14px ${b.color})` }}>{b.icon}</span></div>
      <h2>{t("transitTitle")}</h2><p>{t("transitText", { name: L(b.name, lang) })}</p><p className="mut">{t("landed", { site: st ? L(st.name, lang) : "" })}</p>
      <small className="skip">{t("transitSkip")} ▸</small>
    </div>
  );
}

export function Quiz() {
  const c = useCtrl(), t = useT(); const q = useGame((s) => s.quiz), life = useGame((s) => s.life);
  if (!q) return null; const done = q.chosen != null;
  return (
    <div className="screen center quiz-screen">
      <div className="panel quiz">
        <div className="eyebrow">🎓 {t("quizTitle")}</div>
        <h2>{q.q}</h2>
        <div className="qopts">{q.options.map((o, i) => <button key={i} disabled={done} className={"qopt" + (done && i === q.correct ? " ok" : "") + (done && i === q.chosen && i !== q.correct ? " ko" : "")} onClick={() => c.answerQuiz(i)}>{o}</button>)}</div>
        {done && <div className={"qres " + (q.right ? "good" : "bad")}><b>{q.right ? "✔ " + t("quizRight") : "✖ " + t("quizWrong")}</b><p>{q.why}</p><SrcLink src={q.src} t={t} />{life <= 0 && <p className="lostline">{t("quizLifeOut")}</p>}</div>}
        {done && <div className="row"><Btn onClick={() => c.continueQuiz()}>{t("quizNext")} ▶</Btn></div>}
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
        {busy && <p>⏳ …</p>}
        {err && <p className="mut">⚠ {lang === "fr" ? "Serveur injoignable. Vérifiez que le backend tourne sur le port 3000." : "Server unreachable. Check the backend on port 3000."} <Btn kind="ghost" onClick={() => c.loadBriefing()}>↻</Btn></p>}
        <div className="loadout">{(b?.cargo || []).map((x) => { const on = cargo.includes(x.id); return (
          <button key={x.id} className={"lo-row" + (on ? " on" : "")} onClick={() => { audio.click(); c.toggleCargo(x.id); }} style={{ textAlign: "left", opacity: on ? 1 : 0.7, outline: on ? "2px solid #5ad6ff" : "none" }}>
            <span className="lo-ic">{on ? "✔" : "📦"}</span><div className="lo-txt"><b>{x.name}</b>{x.description && <small>{x.description}</small>}{x.mass !== undefined && <small>{x.mass} kg</small>}</div></button>); })}</div>
        <div className="row between"><Btn kind="ghost" onClick={() => c.goHangar()}>← {t("back")}</Btn><Btn onClick={() => c.goDestination()}>{t("next")} ▶</Btn></div>
      </div>
    </div>
  );
}
