import { useEffect, useMemo, useState } from "react";
import { useCtrl, useGame } from "../game/useStore.js";
import { useT, Helmet, forecast } from "./HUD.jsx";
import { RES, EVENT_ICON, MOD_ACTION, ACT_ICON, L } from "./strings.js";
import { CALLSIGN_COLORS, CREW, HAZARDS } from "../game/layout.js";
import { rt } from "../world/sim.js";
import { audio } from "./audio.js";

const Btn = ({ children, onClick, kind = "primary", ...p }) => <button className={"btn " + kind} onClick={(e) => { audio.unlock(); audio.click(); onClick && onClick(e); }} {...p}>{children}</button>;

export function Intro() {
  const c = useCtrl(), t = useT(); const hasSave = useGame((s) => s.hasSave), lang = useGame((s) => s.lang), best = useGame((s) => s.best);
  return (
    <div className="screen intro">
      <div className="intro-top"><button className="icon" onClick={() => c.setLang(lang === "fr" ? "en" : "fr")}>{lang === "fr" ? "EN" : "FR"}</button><button className="icon" onClick={() => { c.toggleSound(); }}>{useGame((s) => s.sound) ? "🔊" : "🔇"}</button></div>
      <div className="intro-center">
        <div className="eyebrow">NASA SPACE APPS CHALLENGE 2026</div>
        <h1>{t("title")}</h1>
        <p className="hello">{t("hello")}, <b>{useGame((s) => s.user)?.name}</b> · <button className="linkbtn" onClick={() => c.logout()}>{t("logout")}</button></p>
        <p className="tag">{t("tagline")}</p>
        <div className="intro-btns">
          <Btn onClick={() => c.goHangar()}>🚀 {t("newMission")}</Btn>
          {hasSave && <Btn kind="ghost" onClick={() => c.resume()}>↻ {t("resume")}</Btn>}
        </div>
        {best > 0 && <p className="best">🏆 {t("best")} : {best}</p>}
      </div>
      <ul className="how"><li><span>🕹️</span>{t("how1")}</li><li><span>🏗️</span>{t("how2")}</li><li><span>⚠️</span>{t("how3")}</li></ul>
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
        <div className="brief-actions"><Btn kind="ghost" onClick={() => c.goIntro()}>← {t("back")}</Btn><Btn onClick={() => { audio.ok(); c.launch(); }}>{t("btnLaunchMission")} ▶</Btn></div>
      </div>
    </div>
  );
}

/** Accident : bannière dramatique, puis choix de réponse ; l'intervention directe se fait en marchant jusqu'à la balise. */
export function Accident() {
  const c = useCtrl(), t = useT(); const lang = useGame((s) => s.lang), ev = useGame((s) => s.pendingEvent), ready = useGame((s) => s.choicesReady), game = useGame((s) => s.game), plan = useGame((s) => s.plan), reached = useGame((s) => s.bonusReached);
  useEffect(() => { if (ev) { ev.negative ? audio.alarm() : audio.ok(); } }, [ev]);
  useEffect(() => { if (reached) audio.bonus(); }, [reached]);
  const sm = useGame((s) => s.serverMode);
  if (!ev) return null;
  const hz = HAZARDS[ev.id], res = hz?.bonus ? t(RES[hz.bonus.res].key) : "", funds = game.budget - c.planCost(plan);
  return (
    <div className={"accident" + (ev.negative ? " bad" : " good")}>
      <div className="acc-banner"><span className="acc-ic">{EVENT_ICON[ev.id]}</span><div><small>{ev.negative ? "⚠ " + t("accident") : "✦ " + t("eventTitle")}</small><p>{L(ev.text, lang)}</p></div></div>
      {hz?.bonus && <div className={"bonus" + (reached ? " got" : "")}>{reached ? "✔ " + t("intervened", { res }) : "🎯 " + t("intervene", { res })}</div>}
      {ready && sm && <div className="choices"><div className="choice-row"><button className="choice" onClick={() => { audio.ok(); c.ackAlert(); }}><b>{lang === "fr" ? "Continuer" : "Continue"} ▶</b></button></div></div>}
      {ready && !sm && (
        <div className="choices"><small>{t("chooseResponse")}</small>
          <div className="choice-row">{ev.choices.map((ch) => {
            const poor = (ch.cost || 0) > funds && ev.choices.some((o) => !o.cost); const eff = Object.entries(ch.effects || {}).filter(([, v]) => v);
            return (
              <button key={ch.id} className={"choice " + (ch.risk || "")} disabled={poor} onClick={() => { audio.ok(); c.chooseEvent(ch.id); }}>
                <b>{L(ch.label, lang)}</b>
                <div className="eff">{eff.map(([k, v]) => <span key={k} className={v > 0 ? "up" : "down"} style={{ "--c": RES[k].color }}>{RES[k].icon} {v > 0 ? "+" : ""}{v}</span>)}{ch.status?.name === "dust" && <span className="down">🌪️ {ch.status.days} {lang === "fr" ? "j" : "d"}</span>}</div>
                <div className="meta"><span>{ch.cost ? `🪙 −${ch.cost}` : t("free0")}</span><span className={"risk " + ch.risk}>{t("risk_" + (ch.risk || "low"))}</span></div>
                {poor && <em>{t("noFunds")}</em>}
              </button>);
          })}</div>
        </div>)}
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
            {effects.cost > 0 && <div>{t("tradeoffCost")} : 🪙 {effects.cost}</div>}
            <div>{t("tradeoffEffect")} : {Object.entries(effects.effects || {}).filter(([, v]) => v).map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${t(RES[k]?.key || k)}`).join(" · ") || "—"}</div>
            {effects.risk === "high" && <div style={{ color: "#ff8a8a" }}>⚠ {t("riskyMsg")}</div>}
          </div>
        )}
        <div className="deltas">{Object.entries(RES).map(([k, r]) => <div key={k} style={{ "--c": r.color }} className={d[k] > 0 ? "up" : d[k] < 0 ? "down" : ""}><span>{r.icon}</span><small>{t(r.key)}</small><b>{d[k] > 0 ? "+" : ""}{d[k]}</b><em>{game.resources[k]}%</em></div>)}</div>
        {useGame((s) => s.riskyChoice) && <p className="lostline">⚠ {t("riskyMsg")}</p>}
        {bonus && <p className="bonusline">🎯 {t("bonusMsg", { res: t(RES[bonus].key) })}</p>}
        {toast === "transmit" && <p className="bonusline">📡 {t("transmitSent", { n: delay || 14 })}</p>}
        {lost > 0 && <p className="lostline">💔 {t("crewLostMsg", { n: game.crew })}</p>}
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
        <div className="eyebrow">🔭 {t("didYouKnow")}</div>
        {!detail ? (<>
          <p className="fact-text">{L(f.text, lang)}</p>
          <div className="bignum">{f.value}<small>{f.unit}</small></div>
          <div className="row"><Btn kind="ghost" onClick={() => setDetail(true)}>{t("seeData")}</Btn><Btn onClick={() => c.continueFact()}>{t("understood")}</Btn></div>
        </>) : (<>
          <dl className="datalist"><dt>{t("usedFor")}</dt><dd>{L(f.used_for, lang)}</dd><dt>{t("source")}</dt><dd>{f.source_name}{" "}<span className={"vb " + (f.verified ? "ok" : "")}>{f.verified ? "✔ " + t("verified") : "⚠ " + t("unverified")}</span></dd><dt>{t("accessed")}</dt><dd>{f.accessed}</dd></dl>
          <div className="row"><Btn kind="ghost" onClick={() => setDetail(false)}>← {t("back")}</Btn>{f.source_url && <a className="btn ghost" href={f.source_url} target="_blank" rel="noreferrer">{t("visit")} ↗</a>}</div>
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
        <div className="eyebrow">{g.success ? "🚀" : "🛰️"} {t(g.success ? "victoryDesc" : g.endReason === "life" ? "endLife" : "defeatDesc")}</div>
        <h2>{t(g.success ? "victory" : "defeat")}</h2>
        <div className="scorebig"><b>{sc.total}</b><small>/ 850</small><span className="rank">🎖️ {t("rank_" + sc.rank)}</span></div>
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
        <p className="best">🏆 {t("best")} : {best}</p>
        <div className="row"><Btn onClick={() => c.launch()}>↻ {t("replay")}</Btn><Btn kind="ghost" onClick={share}>{copied ? t("copied") : "↗ " + t("share")}</Btn><Btn kind="ghost" onClick={() => c.goIntro()}>{t("home")}</Btn></div>
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
      {phase === "plan" && n < 4 && <Btn onClick={() => { c.inspect(null); c.beginPlacing(a.id); }}>{t("inspectBuild")} · 🪙 {a.cost}</Btn>}
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
