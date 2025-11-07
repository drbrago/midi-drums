export function apply(pattern) {
  const out = Object.fromEntries(
    Object.entries(pattern).map(([k, v]) => [k, [...v]])
  );
  out.closed_hh = out.closed_hh.map((v, i) => (out.open_hh?.[i] ? 0 : v));
  return out;
}
