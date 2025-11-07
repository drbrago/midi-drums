export function apply(pattern) {
  return { ...pattern };
}

export function post(events, params = {}) {
  const p = {
    timing: params.timing ?? 12,
    velocity: params.velocity ?? 12,
    stutterProb: params.stutterProb ?? 0.1,
    muteHatProb: params.muteHatProb ?? 0.08,
    extraPercProb: params.extraPercProb ?? 0.05,
    stutterDelay: params.stutterDelay ?? 8,
    rngSeed: params.rngSeed || "CHAOS",
  };
  const rng = makeRng(p.rngSeed);

  const out = [];

  for (const e of events) {
    if (e.type !== "noteOn" && e.type !== "noteOff") {
      out.push(e);
      continue;
    }

    let tick = e.tick;

    // Hats may be muted
    if ((e.note === 42 || e.note === 46) && rng() < p.muteHatProb) {
      continue; // skip hat entirely
    }

    // Timing + velocity jitter
    const tShift = Math.round((rng() * 2 - 1) * p.timing);
    tick = Math.max(0, tick + tShift);

    let vel = e.vel;
    if (e.type === "noteOn") {
      vel = Math.max(
        1,
        Math.min(127, vel + Math.round((rng() * 2 - 1) * p.velocity))
      );
    }

    // Push main event
    out.push({ ...e, tick, vel });

    // Stutter clone
    if (e.type === "noteOn" && rng() < p.stutterProb) {
      out.push({
        type: "noteOn",
        tick: Math.max(0, tick + p.stutterDelay),
        note: e.note,
        vel: Math.max(1, Math.min(127, vel - 8)),
      });
      out.push({
        type: "noteOff",
        tick: Math.max(0, tick + p.stutterDelay + 10),
        note: e.note,
        vel: 0,
      });
    }

    // Random extra percussion ping
    if (rng() < p.extraPercProb) {
      out.push({
        type: "noteOn",
        tick: Math.max(0, tick + Math.round((rng() * 2 - 1) * 10)),
        note: 39, // perc
        vel: Math.round(50 + rng() * 40),
      });
      out.push({
        type: "noteOff",
        tick: Math.max(0, tick + 15),
        note: 39,
        vel: 0,
      });
    }
  }

  return out;
}

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
