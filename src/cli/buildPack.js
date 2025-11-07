import fs from 'node:fs/promises';
import path from 'node:path';
import { loadSeed } from '../core/loadSeed.js';
import { applyPipeline } from '../core/applyRecipes.js';
import { writePack, writeManifest, writeMidiSet } from '../core/writer.js';
import { NOTE, VEL } from '../core/map.js';
import { patternToTrackEvents } from '../midi/events.js';
import { makeMidi } from '../midi/midiWriter.js';

export async function buildPack(args) {
  const seedPath = args.seed;
  const outBase = args.out || 'packs';
  const genre = args.genre || 'misc';

  if (!seedPath) throw new Error('--seed is required');
  const seed = await loadSeed(seedPath);
  const bpm = Number(args.bpm || seed.bpm || 130);
  const ppq = Number(args.ppq || 480);
  const loops = Number(args.loops || 4);

  const pipelines = (args.pipeline && Array.isArray(args.pipeline) ? args.pipeline : ['foundation'])
    .map(s => parsePipeline(s));

  const packDir = await writePack({ outBase, genre, seed, bpm });

  // Write a copy of the seed & a manifest shell
  await fs.writeFile(path.join(packDir, 'seed.json'), JSON.stringify(seed, null, 2));
  const baseManifest = {
    seedId: seed.id,
    seedVersion: seed.version || 1,
    bpm, ppq, loops,
    genre,
    generatedAt: new Date().toISOString(),
    pipelines: pipelines
  };
  await writeManifest(path.join(packDir, 'manifest.json'), baseManifest);

  // For each pipeline, create subfolder & write MIDI
  for (const p of pipelines) {
    const patt = applyPipeline(seed.pattern, p);
    const folder = path.join(packDir, 'MIDI', p.label);
    await writeMidiSet({ folder, pattern: patt, bpm, ppq, loops });
  }

  console.log('\nPack written to:', packDir);
}

function parsePipeline(s) {
  // Example: "industrialize:hatLevel=3,rngSeed=ABC"
  const [name, paramStr] = s.split(':');
  const params = {};
  if (paramStr) {
    for (const kv of paramStr.split(',')) {
      const [k, v] = kv.split('=');
      if (!k) continue;
      const num = Number(v);
      params[k] = Number.isFinite(num) && v.trim() !== '' ? num : v;
    }
  }
  const label = Object.keys(params).length ? `${name}_${Object.entries(params).map(([k,v])=>`${k}-${v}`).join('_')}` : name;
  return { name, params, label };
}
