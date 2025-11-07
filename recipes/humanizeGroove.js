export function apply(pattern) {
  return { ...pattern };
}

export function post(events, params = {}) {
  const p = {
    snareDelay: params.snareDelay ?? 6,
    kickRange: params.kickRange ?? 4,
    hatRange: params.hatRange ?? 5,
    jitter: params.jitter ?? 2,
    rngSeed: params.rngSeed || "GROOVE",
  };
  const rng = makeRng(p.rngSeed);

  return events.map((e) => {
    if (e.type !== "noteOn" && e.type !== "noteOff") return e;
    let tick = e.tick;

    // identify instrument via note number
    const note = e.note;
    let delta = 0;

    // Snares: always a bit late
    if (note === 38) {
      delta += p.snareDelay;
    }

    // Kicks: slightly early or late
    if (note === 36) {
      delta += Math.round((rng() * 2 - 1) * p.kickRange);
    }

    // Hats: looser drift
    if (note === 42 || note === 46) {
      delta += Math.round((rng() * 2 - 1) * p.hatRange);
    }

    // Global micro jitter
    delta += Math.round((rng() * 2 - 1) * p.jitter);

    tick = Math.max(0, tick + delta);

    return { ...e, tick };
  });
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
