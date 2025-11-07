export function apply(pattern, params = {}) {
  // Identity: return a deep copy of the pattern
  const out = {};
  for (const k of Object.keys(pattern)) out[k] = [...pattern[k]];
  return out;
}
