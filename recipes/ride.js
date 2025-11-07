// recipes/ride.js
// Adds a ride cymbal lane with common techno placements.
// Params:
//   pattern: 'quarters' | 'offbeat' | 'eighths' | 'sixteenths' | 'syncopated' (default 'quarters')
//   level:   1..3 (default 2)
//   replaceOH: boolean (default true)  -> drop open_hh where ride hits
//   thinCH:    boolean (default false) -> optionally drop closed_hh where ride hits

export function apply(pattern, params = {}) {
  const out = {};
  for (const k of Object.keys(pattern)) out[k] = [...pattern[k]];

  const mode = (params.pattern || "quarters").toLowerCase();
  const lvl = clamp(params.level ?? 2, 1, 3);
  const replaceOH = params.replaceOH ?? true;
  const thinCH = params.thinCH ?? false;

  const rideIdx = buildIndexes(mode);
  const lane = Array(16).fill(0);
  for (const i of rideIdx) lane[i] = lvl;

  // Merge with existing ride if present (max per-step)
  if (Array.isArray(out.ride) && out.ride.length === 16) {
    out.ride = out.ride.map((v, i) => Math.max(v | 0, lane[i] | 0));
  } else {
    out.ride = lane;
  }

  if (replaceOH && Array.isArray(out.open_hh)) {
    out.open_hh = out.open_hh.map((v, i) => (rideIdx.includes(i) ? 0 : v | 0));
  }
  if (thinCH && Array.isArray(out.closed_hh)) {
    out.closed_hh = out.closed_hh.map((v, i) =>
      rideIdx.includes(i) ? 0 : v | 0
    );
  }

  return out;
}

function buildIndexes(mode) {
  switch (mode) {
    case "quarters":
      return [0, 4, 8, 12]; // 1,2,3,4
    case "offbeat":
      return [2, 6, 10, 14]; // &s
    case "eighths":
      return [0, 2, 4, 6, 8, 10, 12, 14]; // 1/& grid
    case "sixteenths":
      return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    case "syncopated":
      return [3, 7, 11, 15]; // on the 'a' counts
    default:
      return [0, 4, 8, 12];
  }
}

function clamp(n, lo, hi) {
  n = n | 0;
  return n < lo ? lo : n > hi ? hi : n;
}
