#!/usr/bin/env node
import { parseArgs } from './args.js';
import { buildPack } from './buildPack.js';
import { listRecipes } from '../core/applyRecipes.js';

const args = parseArgs(process.argv);

async function run() {
  const cmd = args._[0] || 'render';
  if (cmd === 'render') {
    await buildPack(args);
  } else if (cmd === 'recipes') {
    const names = listRecipes();
    console.log('Available recipes:');
    for (const n of names) console.log(' -', n);
  } else {
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
