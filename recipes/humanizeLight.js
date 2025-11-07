// Subtle humanization (light timing + velocity randomness)
export function apply(pattern) {
  return { ...pattern };
}

export function post(events, params = {}) {
  const p = {
    timing: params.timing ?? 3, // ticks
    velocity: params.velocity ?? 4, // ±vel
    rngSeed: params.rngSeed || "HUMAN_LIGHT",
  };
  const rng = makeRng(p.rngSeed);

  return events.map((e) => {
    if (e.type !== "noteOn" && e.type !== "noteOff") return e;

    // timing shift
    const shift = Math.round((rng() * 2 - 1) * p.timing);
    const tick = Math.max(0, e.tick + shift);

    // velocity shift (only for noteOn)
    let vel = e.vel;
    if (e.type === "noteOn") {
      const vShift = Math.round((rng() * 2 - 1) * p.velocity);
      vel = Math.max(1, Math.min(127, vel + vShift));
    }

    return { ...e, tick, vel };
  });
}

// Inline deterministic RNG
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
