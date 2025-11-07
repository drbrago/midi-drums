// Industrialize: stronger hats, add sparse perc syncopes
export function apply(pattern, params = {}) {
  const hatLevel = Math.max(1, Math.min(3, params.hatLevel ?? 3));
  const out = {};
  for (const k of Object.keys(pattern)) out[k] = [...pattern[k]];

  // push open hats louder
  out.open_hh = out.open_hh.map((v)=> v ? hatLevel : 0);

  // add perc on 3e&a and 4&a if free
  const addIdx = [9,10,11, 15]; // 3e&a and 4a
  out.perc = out.perc.map((v,i)=> addIdx.includes(i) ? Math.max(v, 2) : v);

  return out;
}
