import fs from 'node:fs/promises';
import path from 'node:path';

const LANES = ['kick','snare','closed_hh','open_hh','perc'];

export async function loadSeed(p) {
  const raw = await fs.readFile(path.resolve(p), 'utf-8');
  const s = JSON.parse(raw);
  const bpm = Number(s.bpm || 130);
  const out = {
    id: s.id || path.basename(p, '.json'),
    name: s.name || s.id || path.basename(p, '.json'),
    genre: s.genre || 'misc',
    version: Number(s.version || 1),
    bpm,
    pattern: {}
  };
  for (const k of LANES) {
    const arr = s.pattern?.[k] || Array(16).fill(0);
    out.pattern[k] = Array.from({length:16}, (_,i)=>normalizeCell(arr[i]));
  }
  return out;
}

function normalizeCell(v) {
  if (typeof v === 'number') return clamp(v|0, 0, 3);
  if (v && typeof v.v === 'number') return v.v > 0 ? 3 : 0;
  return 0;
}
function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
