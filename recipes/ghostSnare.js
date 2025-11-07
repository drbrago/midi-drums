export function apply(pattern) {
  const out = Object.fromEntries(
    Object.entries(pattern).map(([k, v]) => [k, [...v]])
  );
  const put = (i) => {
    if (!out.snare[i]) out.snare[i] = 1;
  };
  put(3); // 1a
  put(11); // 3a
  return out;
}
