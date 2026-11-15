// frontend/src/ui/speech.js
// Synthèse vocale native pour les enfants de 7 à 12 ans (Web Speech API)
// Ne nécessite aucune connexion Internet, fonctionne à 100% dans le navigateur !

class MissionVoiceAssistant {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.enabled = true;
    this.voice = null;
    this.initVoice();
  }

  initVoice() {
    if (!this.synth) return;
    
    // Charger les voix du système
    const loadVoices = () => {
      const voices = this.synth.getVoices();
      // Chercher une voix française naturelle (ex: Google français, Thomas, Amelie...)
      this.voice = voices.find(v => v.lang.startsWith('fr')) || voices[0];
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // Fonction pour parler
  speak(text, priority = false) {
    if (!this.synth || !this.enabled || !text) return;

    // Si c'est une alerte urgente, on coupe ce qui était en train d'être dit
    if (priority) {
      this.synth.cancel();
    }

    // Nettoyer les émojis pour que la voix ne lise pas "émoji fusée"
    const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    if (this.voice) utterance.voice = this.voice;
    
    // Réglages pour une voix captivante d'ordinateur de bord
    utterance.rate = 1.05;  // Vitesse légèrement dynamique
    utterance.pitch = 1.1;  // Ton chaleureux et clair adapté aux enfants

    this.synth.speak(utterance);
  }

  // Couper la voix si besoin
  stop() {
    if (this.synth) this.synth.cancel();
  }

  // Activer / désactiver la voix (bouton dans les réglages)
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stop();
    return this.enabled;
  }
}

export const voice = new MissionVoiceAssistant();
