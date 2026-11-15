/**
 * Voix de NOVA — Web Speech API (navigateur).
 * Phrases courtes, débit un peu ralenti, pour les enfants 7–12 ans.
 */
let enabled = true;
let speaking = false;

export function setNovaVoiceEnabled(v) {
  enabled = !!v;
  if (!enabled) stopNovaSpeak();
}

export function isNovaVoiceEnabled() {
  return enabled;
}

export function stopNovaSpeak() {
  try {
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  } catch (_) {}
  speaking = false;
}

/**
 * Fait parler NOVA.
 * @param {string} text
 * @param {"fr"|"en"} lang
 */
export function novaSpeak(text, lang = "fr") {
  text = String(text || "").replace(/:i-[a-z0-9-]+:/g, "").replace(/\s{2,}/g, " ").trim();
  if (!enabled || !text || typeof window === "undefined") return;
  if (typeof speechSynthesis === "undefined") return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, " ").trim());
    u.lang = lang === "en" ? "en-US" : "fr-FR";
    u.rate = 1.0; // Vitesse naturelle standard
    u.pitch = 1.0; // Tonalité naturelle (évite l'effet robot criard sur Linux/eSpeak)
    u.volume = 1;

    // Préférer une voix française naturelle / non-robotique si disponible
    const voices = speechSynthesis.getVoices?.() || [];
    const isLang = (v) => v.lang?.toLowerCase().replace("_", "-").startsWith(lang === "en" ? "en" : "fr");
    // Préfère voix sans "espeak" ou avec "natural"/"google"
    const prefer = voices.find((v) => isLang(v) && !v.name?.toLowerCase().includes("espeak") && !v.name?.toLowerCase().includes("klatt"))
      || voices.find(isLang);

    if (prefer) u.voice = prefer;
    speaking = true;
    u.onend = () => { speaking = false; };
    u.onerror = () => { speaking = false; };
    speechSynthesis.speak(u);
  } catch (_) {
    speaking = false;
  }
}

export function isNovaSpeaking() {
  return speaking;
}

/** Petites phrases NOVA, vocabulaire simple 7–12 ans */
export const NOVA_LINES = {
  welcome: {
    fr: "Bonjour ! Je suis NOVA, ton robot copain. Je t'aide à comprendre la mission. Si tu bloques, demande-moi un indice !",
    en: "Hi! I am NOVA, your robot friend. I help you understand the mission. If you are stuck, ask me for a hint!",
  },
  incident: {
    fr: "Attention ! Il se passe quelque chose. Je t'explique, puis tu choisis ce que tu veux faire.",
    en: "Watch out! Something is happening. I will explain, then you choose what to do.",
  },
  shelter: {
    fr: "Vite ! On va dans l'abri. Dedans, on est mieux protégés.",
    en: "Quick! Let's go into the shelter. Inside, we are safer.",
  },
  greenhouse: {
    fr: "Les plantes ont besoin d'une boîte fermée, d'eau, de lumière et de chaleur. Pas dehors, sur Mars ou la Lune !",
    en: "Plants need a closed box, water, light and warmth. Not outside on Mars or the Moon!",
  },
  goodJob: {
    fr: "Bravo ! Tu as bien réagi. On continue.",
    en: "Great job! You did well. Let's keep going.",
  },
  tryAgain: {
    fr: "Ce n'est pas grave. On regarde ce qui s'est passé, et on réessaie.",
    en: "That's okay. We look at what happened, and we try again.",
  },
  langFr: {
    fr: "D'accord. Je parlerai en français pendant toute la mission.",
    en: "Okay. I will speak French for the whole mission.",
  },
  langEn: {
    fr: "D'accord. Je parlerai en anglais pendant toute la mission.",
    en: "Okay. I will speak English for the whole mission.",
  },
};

export function novaLine(key, lang = "fr") {
  const row = NOVA_LINES[key];
  if (!row) return "";
  return row[lang] || row.fr || "";
}
