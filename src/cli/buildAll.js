#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { loadSeed } from "../core/loadSeed.js";
import { listRecipes, applyPipeline } from "../core/applyRecipes.js";
import { writePack, writeMidiSet, writeManifest } from "../core/writer.js";

const argv = yargs(hideBin(process.argv))
  .option("seedsDir", { type: "string", default: "seeds" })
  .option("out", { type: "string", default: "packs" })
  .option("loops", { type: "number", default: 4 })
  .option("ppq", { type: "number", default: 480 })
  .option("bpm", { type: "number", describe: "Override seed BPM" })
  .option("include", {
    type: "string",
    describe: "Comma-separated recipe names to include (defaults to all)",
  })
  .option("exclude", {
    type: "string",
    describe: "Comma-separated recipe names to exclude",
  })
  .help().argv;

const seedsDir = path.resolve(process.cwd(), argv.seedsDir);
const outBase = path.resolve(process.cwd(), argv.out);
const loops = argv.loops | 0;
const ppq = argv.ppq | 0;

const ALL_RECIPES = listRecipes();
// sensible “safe combos” (will skip if recipe is missing)
// buildAll.js
const SAFE_COMBOS = [
  // universal texture / cleanliness
  ["minimalize", "hhChoke"],
  ["ghostSnare", "hhChoke"],
  ["ride", "hhChoke"],
  // classic genre pushers
  ["classicTom", "ride"],
  ["industrialize", "euclidPerc"],
  // groove enhancers (pick ONE timing post; we keep it to swing16th here)
  ["ghostSnare", "swing16th"],
  ["ride", "swing16th"],
  ["minimalize", "swing16th"],
  // human feel + tidy
  ["humanizeAcoustic", "hhChoke"],
  ["humanizeVinyl", "hhChoke"],
  ["humanizeLight", "hhChoke"],
  // machine vs organic blends
  ["industrialize", "humanizeLight"],
  ["euclidPerc", "humanizeLight"],
  // busier hats but controlled
  ["euclidPerc", "hhChoke"],
  ["ride", "minimalize"],
  // punch + pocket
  ["ghostSnare", "humanizeGroove"],
  // retro glue
  ["humanizeVinyl", "swing16th"],
  // darker/edgier but safe
  ["classicTom", "humanizeLight"],
  // sparse but wide
  ["minimalize", "humanizeVinyl"],
];

// buildAll.js
const TIMING_POSTS = new Set([
  "swing16th",
  "swingDrunk",
  "humanizeLight",
  "humanizeGroove",
  "humanizeChaotic",
  "humanizeAcoustic",
  "humanizeVinyl",
]);

function isTimingComboSafe(names) {
  const count = names.filter((n) => TIMING_POSTS.has(n)).length;
  return count <= 1; // allow max one timing/humanize post in a combo
}

// buildAll.js
const GENRE_COMBOS = {
  techno: [
    ["classicTom", "ride"],
    ["euclidPerc", "hhChoke"],
    ["minimalize", "swing16th"],
    ["humanizeLight", "hhChoke"],
  ],
  house: [
    ["ride", "hhChoke"],
    ["minimalize", "swing16th"],
    ["humanizeAcoustic", "swing16th"],
    ["humanizeVinyl", "hhChoke"],
  ],
  drum_and_bass: [
    ["euclidPerc", "hhChoke"],
    ["humanizeLight", "swing16th"],
    ["minimalize", "hhChoke"],
  ],
  trap: [
    ["ghostSnare", "humanizeGroove"],
    ["minimalize", "hhChoke"],
    ["humanizeVinyl", "hhChoke"],
    // carefully allow drunk feel:
    ["ghostSnare", "swingDrunk"],
  ],
  hiphop: [
    ["ghostSnare", "humanizeGroove"],
    ["humanizeVinyl", "hhChoke"],
    ["minimalize", "humanizeAcoustic"],
    ["humanizeLight", "swing16th"],
  ],
  lofi_hiphop: [
    ["humanizeVinyl", "humanizeGroove"],
    ["ghostSnare", "humanizeAcoustic"],
    ["minimalize", "humanizeVinyl"],
  ],
  industrial_rock: [
    ["industrialize", "euclidPerc"],
    ["ride", "hhChoke"],
    ["humanizeLight", "hhChoke"],
  ],
  industrial_electronic: [
    ["industrialize", "euclidPerc"],
    ["minimalize", "humanizeVinyl"],
    ["euclidPerc", "hhChoke"],
  ],
  rock: [
    ["humanizeAcoustic", "ride"],
    ["classicTom", "humanizeAcoustic"],
    ["minimalize", "humanizeAcoustic"],
  ],
  synthwave: [
    ["ride", "swing16th"],
    ["humanizeVinyl", "hhChoke"],
    ["classicTom", "ride"],
  ],
};

function filterRecipes() {
  let set = new Set(ALL_RECIPES);
  if (argv.include)
    set = new Set(
      argv.include
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  if (argv.exclude)
    argv.exclude
      .split(",")
      .map((s) => s.trim())
      .forEach((r) => set.delete(r));
  return Array.from(set);
}

async function getSeeds() {
  const files = await fs.readdir(seedsDir);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(seedsDir, f));
}

async function main() {
  const recipes = filterRecipes();
  const seedFiles = await getSeeds();

  console.log(
    `Seeds: ${seedFiles.length}  | Recipes: ${recipes.join(", ") || "(none)"}`
  );

  for (const seedPath of seedFiles) {
    const seed = await loadSeed(seedPath); // your loader accepts path
    const bpm = argv.bpm || seed.bpm || 120;

    const packDir = await writePack({
      outBase,
      genre: seed.genre || "misc",
      seed,
      bpm,
    });

    // manifest scaffold
    const manifest = {
      seed: path.basename(seedPath),
      bpm,
      loops,
      ppq,
      createdAt: new Date().toISOString(),
      variations: [],
    };

    // 1) core
    {
      const folder = path.join(packDir, "core");
      await writeMidiSet({ folder, pattern: seed.pattern, bpm, ppq, loops });
      manifest.variations.push({ name: "core", pipeline: [] });
    }

    // 2) singles
    for (const r of recipes) {
      const folder = path.join(packDir, r);
      const patt = applyPipeline(structuredClone(seed.pattern), {
        name: r,
        params: {},
      });
      await writeMidiSet({ folder, pattern: patt, bpm, ppq, loops });
      manifest.variations.push({ name: r, pipeline: [r] });
    }

    // 3) safe combos
    const combos = GENRE_COMBOS[seed.genre] || SAFE_COMBOS;

    for (const combo of combos) {
      // skip if any recipe missing due to include/exclude filters
      if (!combo.every((r) => recipes.includes(r))) continue;
      if (!isTimingComboSafe(combo)) continue;
      const key = combo.join("+");
      const folder = path.join(packDir, key);

      let patt = structuredClone(seed.pattern);
      for (const name of combo) {
        patt = applyPipeline(patt, { name, params: {} });
      }
      await writeMidiSet({ folder, pattern: patt, bpm, ppq, loops });
      manifest.variations.push({ name: key, pipeline: combo });
    }

    await writeManifest(path.join(packDir, "manifest.json"), manifest);
    console.log(`✓ Wrote pack: ${packDir}`);
  }

  console.log("All done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
