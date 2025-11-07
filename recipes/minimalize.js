// Minimalize: soften/open-hat reduction and remove some closed hats
export function apply(pattern, params = {}) {
  const out = {};
  for (const k of Object.keys(pattern)) out[k] = [...pattern[k]];

  // lower open hats, keep off-beats mostly
  out.open_hh = out.open_hh.map((v,i)=> (i%4===2 ? Math.min(2, v||2) : 0));

  // closed hats on 8ths; drop where open hats occur
  out.closed_hh = out.closed_hh.map((_,i)=> (i%2===0 ? 2 : 0));
  out.closed_hh = out.closed_hh.map((v,i)=> (out.open_hh[i] ? 0 : v));

  // keep kick & snare intact
  return out;
}
