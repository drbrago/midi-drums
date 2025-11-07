// Human drummer feel: slight instrument-specific timing, accents, ghost handling.
export function apply(pattern) {
  return { ...pattern };
}

export function post(events, params = {}) {
  const cfg = {
    // timing (±ticks or fixed push)
    kickRange: params.kickRange ?? 3, // ±
    snareLate: params.snareLate ?? 4, // + late
    hatRange: params.hatRange ?? 5, // ±
    percRange: params.percRange ?? 6, // ± (foley is sloppier)

    // velocity tweaks
    velJitter: params.velJitter ?? 5, // ± on noteOn
    accentDownbeats: params.accentDownbeats ?? 8, // + on step 0/8 for hats/ride
    ghostSnareCut: params.ghostSnareCut ?? 18, // lower near main snare

    rngSeed: params.rngSeed || "HUMAN_ACOUSTIC",
  };
  const rng = makeRng(cfg.rngSeed);

  // Derived helpers
  // Events come absolute; writer adds e.ppq
  const ppq = events[0]?.ppq || 480;
  const tps = Math.max(1, Math.floor(ppq / 4)); // ticks per 16th
  const barLen = 16 * tps;

  // Find main snares (loud-ish at steps ~4/12); use note 38
  const snHits = events
    .filter((e) => e.type === "noteOn" && e.note === 38)
    .map((e) => e.tick);

  const out = events.map((e) => {
    if (e.type !== "noteOn" && e.type !== "noteOff") return e;

    let tick = e.tick;
    let vel = e.vel;

    // Instrument-specific timing
    if (e.note === 36) {
      // kick
      tick += Math.round((rng() * 2 - 1) * cfg.kickRange);
    } else if (e.note === 38) {
      // snare
      tick += cfg.snareLate;
    } else if (e.note === 42 || e.note === 46 || e.note === 51) {
      // hats/ride
      tick += Math.round((rng() * 2 - 1) * cfg.hatRange);
    } else {
      // perc/etc
      tick += Math.round((rng() * 2 - 1) * cfg.percRange);
    }
    tick = Math.max(0, tick);

    // Velocity randomization on noteOn
    if (e.type === "noteOn") {
      vel = Math.max(
        1,
        Math.min(127, vel + Math.round((rng() * 2 - 1) * cfg.velJitter))
      );

      // Accents on bar starts (downbeats) for hats/ride
      if (e.note === 42 || e.note === 46 || e.note === 51) {
        const step = Math.floor((e.tick % barLen) / tps); // use original grid pos
        if (step === 0 || step === 8)
          vel = Math.min(127, vel + cfg.accentDownbeats);
      }

      // Ghost snare handling: if a snare is very close (< 1/16) to a main snare,
      // treat it as a ghost and reduce velocity.
      if (e.note === 38) {
        const nearMain = snHits.some(
          (t) => Math.abs(t - e.tick) > 0 && Math.abs(t - e.tick) <= tps
        );
        if (nearMain) vel = Math.max(1, vel - cfg.ghostSnareCut);
      }
    }

    return { ...e, tick, vel };
  });

  return out;
}

// tiny deterministic RNG
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
