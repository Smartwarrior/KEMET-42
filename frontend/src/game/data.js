import config from "../data/config.json";
import actions from "../data/actions.json";
import events from "../data/events.json";
import facts from "../data/mars-facts.json";
import i18n from "../data/i18n.json";
// Aucune fiche non vérifiée n'est affichée : seuls les faits marqués verified:true (aucun pour l'instant) peuvent apparaître.
export const data = { config, actions, events, facts: facts.filter((f) => f.verified === true) };
export { i18n };
