// recipes/swingDrunk.js
// Timing-only "drunk" swing (J Dilla vibe).
// Usage example:
//   --pipeline "swingDrunk:snareDelay=12,kickAltDelay=8,hatEarlyProb=0.35,jitter=3,rngSeed=DILLA"
import { NOTE } from "../src/core/map.js";

// defaults tuned for ppq=480
const DEF = {
  snareDelay: 12, // ticks added to every snare
  kickAltDelay: 8, // ticks added to every 2nd kick
  hatEarlyProb: 0.3, // chance a hat is pulled early
  hatEarlyTicks: 4, // ticks pulled earlier when chosen
  jitter: 2, // ±ticks random jitter applied to all hits
};

export function apply(pattern /*, params */) {
  // pattern stays the same; timing happens in post()
  return { ...pattern };
}

export function post(events, params = {}) {
  const cfg = { ...DEF, ...params };
  const rng = makeRng(String(cfg.rngSeed || "dilla"));

  // Pair noteOn/noteOff so both shift equally
  const pending = new Map(); // note -> array stack of {delta}
  let kickCount = 0;

  const out = events.map((ev) => {
    if (ev.type !== "noteOn" && ev.type !== "noteOff") return ev;

    // Determine or retrieve delta for this note-on/off
    let delta;
    if (ev.type === "noteOn") {
      if (ev.note === NOTE.snare) {
        delta = +cfg.snareDelay;
      } else if (ev.note === NOTE.kick) {
        kickCount += 1;
        delta = kickCount % 2 === 0 ? +cfg.kickAltDelay : 0; // every 2nd kick late
      } else if (isHat(ev.note)) {
        // some hats early, some not
        delta = rng() < cfg.hatEarlyProb ? -cfg.hatEarlyTicks : 0;
      } else {
        delta = 0;
      }
      // small global jitter
      delta += Math.round((rng() * 2 - 1) * (cfg.jitter || 0));
      // store for the matching noteOff
      const arr = pending.get(ev.note) || [];
      arr.push({ delta });
      pending.set(ev.note, arr);
    } else {
      const arr = pending.get(ev.note) || [];
      const pair = arr.shift() || { delta: 0 };
      pending.set(ev.note, arr);
      delta = pair.delta;
    }

    const tick = Math.max(0, ev.tick + delta);
    return { ...ev, tick };
  });

  return out;
}

function isHat(note) {
  // CH=42, OH=46, Ride=51 (from NOTE map)
  return note === NOTE.closed_hh || note === NOTE.open_hh || note === NOTE.ride;
}

// Deterministic RNG (mulberry32 over a string hash)
function makeRng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let s = h >>> 0 || 1;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
