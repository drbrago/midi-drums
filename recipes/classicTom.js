// recipes/classicTom.js
// Adds a classic techno tom line on 16 steps.
// Params: level (1..3) -> sets 2->level and 3->level+1 (clamped)
export function apply(pattern, params = {}) {
  const out = {};
  for (const k of Object.keys(pattern)) out[k] = [...pattern[k]];

  // Corrected 16-step pattern (indexes 0..15)
  const base = [0, 0, 0, 2, 0, 0, 3, 0, 0, 0, 0, 2, 0, 0, 3, 0];

  const lvl = Math.max(1, Math.min(3, params.level ?? 2));
  const louder = Math.min(3, lvl + 1);

  const scaled = base.map((v) => {
    if (v === 0) return 0;
    if (v === 2) return lvl;
    if (v === 3) return louder;
    return v;
  });

  // If a tom lane already exists, merge (take max per step); else set fresh.
  if (Array.isArray(out.tom) && out.tom.length === 16) {
    out.tom = out.tom.map((v, i) => Math.max(v | 0, scaled[i] | 0));
  } else {
    out.tom = scaled;
  }
  return out;
}
