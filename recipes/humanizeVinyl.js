// Lo-fi tape/vinyl: wow/flutter drift, light pump after loud hits, occasional hat dropout.
export function apply(pattern) {
  return { ...pattern };
}

export function post(events, params = {}) {
  const cfg = {
    wowHz: params.wowHz ?? 0.35, // slow LFO (bars/sec-ish; we'll scale to ticks)
    wowAmt: params.wowAmt ?? 8, // ± ticks max
    flutterHz: params.flutterHz ?? 6.0, // fast LFO
    flutterAmt: params.flutterAmt ?? 2, // ± ticks

    pumpWindow: params.pumpWindow ?? 3, // 16th steps after a loud hit to duck hats
    pumpAmt: params.pumpAmt ?? 14, // velocity reduction
    loudThreshold: params.loudThreshold ?? 105,

    hatDropProb: params.hatDropProb ?? 0.05, // occasional CH/OH dropout
    velJitter: params.velJitter ?? 3, // small random vel jitter
    timeJitter: params.timeJitter ?? 2, // small random time jitter

    rngSeed: params.rngSeed || "VINYL",
  };
  const rng = makeRng(cfg.rngSeed);

  const ppq = events[0]?.ppq || 480;
  const tps = Math.max(1, Math.floor(ppq / 4));
  const barLen = 16 * tps;

  // Track last loud hit to “pump” hats afterwards.
  let lastLoudTick = -Infinity;

  // pre-sort to process in time
  const sorted = [...events].sort(
    (a, b) => a.tick - b.tick || (a.type === "noteOff") - (b.type === "noteOff")
  );

  const out = [];
  for (const e of sorted) {
    if (e.type !== "noteOn" && e.type !== "noteOff") {
      out.push(e);
      continue;
    }

    // LFO drift (wow + flutter) based on absolute tick
    const phaseBars = e.tick / barLen; // normalized bar position
    const wow = Math.sin(2 * Math.PI * phaseBars * cfg.wowHz) * cfg.wowAmt;
    const flutter =
      Math.sin(2 * Math.PI * phaseBars * cfg.flutterHz) * cfg.flutterAmt;
    let tick = Math.max(0, e.tick + Math.round(wow + flutter));

    // small random jitter
    tick = Math.max(0, tick + Math.round((rng() * 2 - 1) * cfg.timeJitter));

    // Hat dropout
    if (
      (e.note === 42 || e.note === 46) &&
      e.type === "noteOn" &&
      rng() < cfg.hatDropProb
    ) {
      continue; // skip this hat hit entirely
    }

    let vel = e.vel;
    if (e.type === "noteOn") {
      // Pump/duck after loud hits (kick/snare)
      if (e.note === 36 || e.note === 38) {
        if (vel >= cfg.loudThreshold) lastLoudTick = e.tick;
      }
      if (
        (e.note === 42 || e.note === 46 || e.note === 51) &&
        isWithinSteps(e.tick, lastLoudTick, cfg.pumpWindow, tps)
      ) {
        vel = Math.max(1, vel - cfg.pumpAmt);
      }
      // small velocity jitter
      vel = Math.max(
        1,
        Math.min(127, vel + Math.round((rng() * 2 - 1) * cfg.velJitter))
      );
    }

    out.push({ ...e, tick, vel });
  }

  return out;
}

function isWithinSteps(t, tRef, steps, tps) {
  if (!Number.isFinite(tRef)) return false;
  return t - tRef >= 0 && t - tRef <= steps * tps;
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
