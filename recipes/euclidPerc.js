export function apply(pattern, { k = 5, n = 16, rot = 0, level = 2 } = {}) {
  const out = Object.fromEntries(
    Object.entries(pattern).map(([k, v]) => [k, [...v]])
  );
  const seq = Array(n).fill(0);
  // bjorklund-ish simple spread
  let cnt = 0;
  for (let i = 0; i < n; i++) if ((i * k) % n < k) seq[i] = 1;
  const lane = Array(16).fill(0);
  for (let i = 0; i < 16; i++) lane[i] = seq[(i - rot + 16) % 16] ? level : 0;
  out.perc =
    out.perc?.length === 16
      ? out.perc.map((v, i) => Math.max(v, lane[i]))
      : lane;
  return out;
}
