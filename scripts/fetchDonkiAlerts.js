// scripts/fetchDonkiAlerts.js
// Wrapper CLI / compat — la logique live est dans src/donki.js
const { getDonkiSnapshot, donkiToAlert } = require('../src/donki');

async function getLiveSolarStormAlert() {
  const snap = await getDonkiSnapshot();
  if (!snap || snap.radiationRisk === 'low') {
    return {
      source: snap?.source || 'NASA DONKI',
      active: false,
      alertLevel: 'QUIET',
      details: 'Pas d’activité solaire significative sur les 14 derniers jours.',
      time: new Date().toISOString(),
      live: !!snap?.live,
    };
  }
  const alert = donkiToAlert(snap, { shielded: false });
  return {
    source: snap.source,
    active: true,
    alertLevel: snap.radiationRisk === 'high' ? 'HIGH RADIATION WARNING' : 'ELEVATED SOLAR ACTIVITY',
    details: alert?.message || snap.summary,
    time: snap.strongestFlare?.beginTime || snap.fetchedAt || new Date().toISOString(),
    live: snap.live,
    classType: snap.strongestFlare?.classType || null,
  };
}

if (require.main === module) {
  getLiveSolarStormAlert()
    .then((a) => {
      console.log(JSON.stringify(a, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { getLiveSolarStormAlert, getDonkiSnapshot, donkiToAlert };
