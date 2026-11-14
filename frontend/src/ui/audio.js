// Son procédural (Web Audio) : aucun fichier audio, fonctionne hors-ligne.
import { rt } from "../world/sim.js";
let ctx = null, wind = null, windGain = null, on = true;
function ensure() {
  if (ctx || typeof window === "undefined") return ctx;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  try {
    ctx = new AC();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    wind = ctx.createBufferSource(); wind.buffer = buf; wind.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500; windGain = ctx.createGain(); windGain.gain.value = 0;
    wind.connect(lp).connect(windGain).connect(ctx.destination); wind.start();
    setInterval(() => { if (windGain) windGain.gain.setTargetAtTime(on ? 0.04 + rt.w.dust * 0.5 + rt.w.flare * 0.1 : 0, ctx.currentTime, 0.4); }, 250);
  } catch (_) { ctx = null; }
  return ctx;
}
function tone(f, d = 0.12, type = "sine", v = 0.08, f2 = null) {
  if (!on || !ensure()) return; if (ctx.state === "suspended") ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime; o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + d + 0.02);
}
export const audio = {
  unlock() { ensure(); if (ctx && ctx.state === "suspended") ctx.resume(); },
  set(v) { on = v; if (windGain && ctx) windGain.gain.setTargetAtTime(v ? 0.05 : 0, ctx.currentTime, 0.1); },
  click() { tone(660, 0.07, "triangle", 0.06); }, ok() { tone(520, 0.1, "sine", 0.07); setTimeout(() => tone(780, 0.14, "sine", 0.07), 90); },
  build() { tone(110, 0.5, "sawtooth", 0.07, 40); }, alarm() { tone(880, 0.18, "square", 0.05); setTimeout(() => tone(620, 0.18, "square", 0.05), 200); setTimeout(() => tone(880, 0.18, "square", 0.05), 400); },
  bonus() { [660, 880, 1175].forEach((f, i) => setTimeout(() => tone(f, 0.16, "triangle", 0.07), i * 90)); }, fail() { tone(300, 0.6, "sawtooth", 0.06, 80); }, win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, "triangle", 0.07), i * 140)); },
  error() { tone(180, 0.18, "square", 0.05); },
};
