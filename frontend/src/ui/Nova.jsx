/**
 * NOVA — robot copain qui parle (voix navigateur).
 * Vocabulaire simple pour 7–12 ans. Aide en 3 niveaux, sans tout dire d'un coup.
 */
import { useEffect, useState } from "react";
import { DID_YOU_KNOW } from "../data/incidents.js";
import { novaSpeak, stopNovaSpeak, novaLine, setNovaVoiceEnabled, isNovaVoiceEnabled } from "./novaSpeak.js";

function L(obj, lang) {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[lang] || obj.fr || obj.en || "";
}

/** Textes d'aide très simples selon le niveau */
function helpFor(incident, level, lang) {
  const fr = lang === "fr";
  if (!incident) {
    if (level <= 0) return novaLine("welcome", lang);
    return fr
      ? "Regarde les barres en haut. Si une barre est basse, construis ou répare le module qui aide cette barre."
      : "Look at the bars at the top. If a bar is low, build or fix the module that helps that bar.";
  }
  const res = (incident.resources || []).join(", ");
  if (level <= 0) {
    return fr
      ? `Alerte : ${L(incident.title, lang)}. Que veux-tu faire ?`
      : `Alert: ${L(incident.title, lang)}. What do you want to do?`;
  }
  if (level === 1) {
    return fr
      ? `Petit indice : regarde surtout cette ressource : ${res || "les barres"}.`
      : `Small hint: look mostly at this resource: ${res || "the bars"}.`;
  }
  if (level === 2) {
    return fr
      ? `Voici pourquoi : ${L(incident.cause, lang)} Danger : ${L(incident.danger, lang)}`
      : `Here is why: ${L(incident.cause, lang)} Danger: ${L(incident.danger, lang)}`;
  }
  return fr
    ? `Aide complète : ${L(incident.whatToDo, lang)}`
    : `Full help: ${L(incident.whatToDo, lang)}`;
}

export function NovaPanel({
  lang = "fr",
  incident = null,
  failsInRow = 0,
  visible = true,
  autoSpeak = true,
  onHelp = null,
  onClose = null,
  onStartGreenhouse = null,
}) {
  const fr = lang === "fr";
  const [level, setLevel] = useState(0);
  const [voiceOn, setVoiceOn] = useState(() => isNovaVoiceEnabled());
  const [tip] = useState(() => DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)]);
  const [showTip, setShowTip] = useState(false);

  const text = helpFor(incident, level, lang);

  useEffect(() => {
    if (failsInRow >= 2 && level < 1) setLevel(1);
  }, [failsInRow, level]);

  // Parle quand le texte change (si voix activée)
  useEffect(() => {
    if (!visible || !autoSpeak || !voiceOn) return;
    novaSpeak(text, lang);
    return () => stopNovaSpeak();
  }, [text, lang, visible, autoSpeak, voiceOn]);

  if (!visible) return null;

  function askHelp() {
    const next = Math.min(3, level + 1);
    setLevel(next);
    onHelp?.(next);
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    setNovaVoiceEnabled(next);
    if (!next) stopNovaSpeak();
    else novaSpeak(text, lang);
  }

  function speakAgain() {
    novaSpeak(text, lang);
  }

  return (
    <div className="nova-panel" role="complementary" aria-label="NOVA">
      <div className="nova-head">
        <span className="nova-avatar" aria-hidden>🤖</span>
        <div>
          <strong>NOVA</strong>
          <div className="mut" style={{ fontSize: 11 }}>
            {fr ? "Robot qui t'aide et qui parle" : "Robot helper that talks"}
          </div>
        </div>
        <button type="button" className="icon" onClick={toggleVoice} title={voiceOn ? "mute" : "voice"}>
          {voiceOn ? "🔊" : "🔇"}
        </button>
        {onClose && (
          <button type="button" className="icon" onClick={onClose} aria-label="close">×</button>
        )}
      </div>

      <p className="nova-text">{text}</p>

      <div className="nova-actions">
        <button type="button" className="chip" onClick={speakAgain}>
          {fr ? "Écouter encore" : "Listen again"}
        </button>
        {level < 3 && (
          <button type="button" className="chip" onClick={askHelp}>
            {level === 0
              ? fr ? "Indice" : "Hint"
              : level === 1
                ? fr ? "Expliquer mieux" : "Explain more"
                : fr ? "Aide complète" : "Full help"}
          </button>
        )}
        <button type="button" className="chip ghost" onClick={() => setShowTip((v) => !v)}>
          {fr ? "Le savais-tu ?" : "Did you know?"}
        </button>
        {onStartGreenhouse && (
          <button type="button" className="chip ghost" onClick={onStartGreenhouse}>
            {fr ? "Essayer la serre" : "Try the greenhouse"}
          </button>
        )}
      </div>

      {showTip && (
        <div className="nova-tip">
          <p>{L(tip, lang)}</p>
          {tip.url && (
            <a href={tip.url} target="_blank" rel="noreferrer">
              {fr ? "Page NASA" : "NASA page"}
            </a>
          )}
        </div>
      )}

      {incident?.source?.url && (
        <div className="nova-source">
          <a href={incident.source.url} target="_blank" rel="noreferrer">
            {incident.source.name || (fr ? "Page NASA" : "NASA page")}
          </a>
        </div>
      )}
    </div>
  );
}

/** Texte d'incident simplifié pour enfants */
export function kidIncidentText(incident, lang = "fr") {
  if (!incident) return "";
  const fr = lang === "fr";
  return [
    L(incident.title, lang),
    fr ? "Pourquoi :" : "Why:",
    L(incident.cause, lang),
    fr ? "Danger :" : "Danger:",
    L(incident.danger, lang),
    fr ? "Que faire :" : "What to do:",
    L(incident.whatToDo, lang),
  ].join(". ");
}

export function IncidentPanel({
  lang = "fr",
  incident,
  timeLeft,
  stageId,
  onAdvance,
  onResolve,
  onEnterShelter,
}) {
  const fr = lang === "fr";
  if (!incident) return null;

  const urgencyColor =
    incident.urgency === "critical" ? "#ff4d4d"
      : incident.urgency === "high" ? "#ff9f43"
        : incident.urgency === "medium" ? "#feca57" : "#54a0ff";

  return (
    <div className="incident-panel" style={{ "--u": urgencyColor }}>
      <div className="inc-head">
        <span className="inc-badge" style={{ background: urgencyColor }}>
          {incident.urgency === "critical" ? (fr ? "urgent" : "urgent")
            : incident.urgency === "high" ? (fr ? "important" : "important")
              : incident.urgency === "medium" ? (fr ? "moyen" : "medium")
                : (fr ? "calme" : "calm")}
        </span>
        <h3>{L(incident.title, lang)}</h3>
        <div className="inc-timer" title={fr ? "Temps du jeu (pas un vrai temps NASA)" : "Game timer (not a real NASA time)"}>
          ⏱ {Math.max(0, Math.ceil(timeLeft))}s
          <small>{fr ? "temps du jeu" : "game time"}</small>
        </div>
      </div>
      <div className="inc-body">
        <p><strong>{fr ? "Pourquoi" : "Why"} :</strong> {L(incident.cause, lang)}</p>
        <p><strong>{fr ? "Danger" : "Danger"} :</strong> {L(incident.danger, lang)}</p>
        <p><strong>{fr ? "Que faire" : "What to do"} :</strong> {L(incident.whatToDo, lang)}</p>
        <p className="mut">
          {fr ? "Étape" : "Step"} : <b>{stageId}</b>
        </p>
        {incident.source?.url && (
          <p>
            <a href={incident.source.url} target="_blank" rel="noreferrer">
              {incident.source.name || "NASA"}
            </a>
          </p>
        )}
      </div>
      <div className="inc-actions">
        {stageId !== "result" && (
          <button type="button" className="btn" onClick={onAdvance}>
            {stageId === "repair"
              ? fr ? "Finir la réparation" : "Finish repair"
              : fr ? "Étape suivante" : "Next step"}
          </button>
        )}
        {(incident.shelterRequired || incident.shelterRecommended) && onEnterShelter && (
          <button type="button" className="btn ghost" onClick={onEnterShelter}>
            {fr ? "Entrer dans l'abri" : "Enter the shelter"}
          </button>
        )}
        {(stageId === "repair" || stageId === "result") && (
          <>
            <button type="button" className="btn good" onClick={() => onResolve(true)}>
              {fr ? "C'est réussi" : "Success"}
            </button>
            <button type="button" className="btn bad" onClick={() => onResolve(false)}>
              {fr ? "Ça a échoué" : "Failed"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ShelterView({ lang = "fr", resources = {}, incident = null, onExit }) {
  const fr = lang === "fr";
  return (
    <div className="shelter-view">
      <div className="shelter-panel">
        <h2>{fr ? "Dedans l'abri" : "Inside the shelter"}</h2>
        <p className="mut">
          {fr
            ? "Ici, on est à l'abri du vent, de la poussière et d'une partie des rayons dangereux."
            : "Here we are safe from wind, dust and some dangerous rays."}
        </p>
        <ul className="shelter-grid">
          <li>🚪 {fr ? "Porte" : "Door"} — OK</li>
          <li>🛏 {fr ? "Coin pour se reposer" : "Rest area"} — OK</li>
          <li>🫁 {fr ? "Air" : "Air"} — {resources.o2 ?? resources.oxygenKg ?? "—"}</li>
          <li>🔋 {fr ? "Énergie" : "Power"} — {resources.energy ?? resources.powerKwh ?? "—"}</li>
          <li>🛡 {fr ? "Bouclier" : "Shield"} — {resources.protection ?? resources.radiationShield ?? "—"}%</li>
          <li>🚨 {fr ? "Alerte" : "Alert"} — {incident ? L(incident.title, lang) : fr ? "aucune" : "none"}</li>
        </ul>
        <button type="button" className="btn" onClick={onExit}>
          {fr ? "Sortir de l'abri" : "Leave the shelter"}
        </button>
      </div>
    </div>
  );
}
