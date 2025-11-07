export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = argv[i+1];
    if (['seed','out','genre','bpm','ppq','loops','pipeline'].includes(key)) {
      if (key === 'pipeline') {
        out.pipeline = out.pipeline || [];
        out.pipeline.push(next);
      } else {
        out[key] = next;
      }
      i++;
    } else {
      // flags without values
      out[key] = true;
    }
  }
  // defaults
  if (!out.ppq) out.ppq = '480';
  if (!out.loops) out.loops = '4';
  return out;
}
