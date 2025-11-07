import fs from "node:fs/promises";
import path from "node:path";
import { NOTE, VEL } from "./map.js";
import { patternToTrackEvents } from "../midi/events.js";
import { makeMidi } from "../midi/midiWriter.js";

export async function writePack({ outBase, genre, seed, bpm }) {
  const dir = path.join(
    outBase,
    genre,
    `${slug(seed.name)}_v${String(seed.version).padStart(3, "0")}_${bpm}bpm`
  );
  await fs.mkdir(path.join(dir, "MIDI"), { recursive: true });
  return dir;
}

export async function writeManifest(dest, manifest) {
  await fs.writeFile(dest, JSON.stringify(manifest, null, 2));
}

export async function writeMidiSet({ folder, pattern, bpm, ppq, loops }) {
  await fs.mkdir(path.join(folder, "stems"), { recursive: true });

  // Helper: apply optional post/timing transforms recorded on the pattern
  const applyPosts = (eventsAbs) => {
    // Ensure ppq present for timing posts (swing/humanize)
    const withPpq = eventsAbs.map((e) => ({ ...e, ppq }));
    const posts = Array.isArray(pattern.__post) ? pattern.__post : [];
    let out = withPpq;
    for (const p of posts) {
      // Each post is { name, fn, params }
      out =
        p.fn && typeof p.fn === "function" ? p.fn(out, p.params || {}) : out;
    }
    return out;
  };

  const lanes = Object.keys(pattern);
  const barSuffix = `${loops}bars`;

  // ---- STEMS (per-lane)
  for (const lane of lanes) {
    if (!Array.isArray(pattern[lane])) continue;
    if (!NOTE[lane]) {
      // Unknown lane -> skip gracefully (or map NOTE[lane] if you add it later)
      console.warn(`[writer] Skipping lane without NOTE mapping: ${lane}`);
      continue;
    }
    const steps = pattern[lane];
    // Skip empty lanes (all zeros)
    if (steps.every((v) => (v | 0) === 0)) continue;

    // Build absolute events for this lane
    const abs = patternToTrackEvents({
      steps,
      note: NOTE[lane],
      velocities: VEL,
      ppq,
      loops,
      absolute: true,
    });

    // Apply any post/timing transforms
    const postAbs = applyPosts(abs);

    // Re-delta encode
    postAbs.sort(
      (a, b) =>
        a.tick - b.tick || (a.type === "noteOff") - (b.type === "noteOff")
    );
    const stem = [];
    let last = 0;
    for (const e of postAbs) {
      const delta = e.tick - last;
      last = e.tick;
      stem.push({ type: e.type, delta, note: e.note, vel: e.vel });
    }

    const bytes = makeMidi({ bpm, ppq, events: stem });
    await fs.writeFile(
      path.join(folder, "stems", `${lane}_${barSuffix}.mid`),
      Buffer.from(bytes)
    );
  }

  // ---- MIXED (all lanes merged)
  const allAbs = [];
  for (const lane of lanes) {
    if (!Array.isArray(pattern[lane]) || !NOTE[lane]) continue;
    const steps = pattern[lane];
    if (steps.every((v) => (v | 0) === 0)) continue;
    const ev = patternToTrackEvents({
      steps,
      note: NOTE[lane],
      velocities: VEL,
      ppq,
      loops,
      absolute: true,
    });
    allAbs.push(...ev);
  }

  // Apply posts to mixed too
  const mixedAbs = applyPosts(allAbs);

  // Sort absolute then delta-encode
  mixedAbs.sort(
    (a, b) => a.tick - b.tick || (a.type === "noteOff") - (b.type === "noteOff")
  );
  const mixed = [];
  let last = 0;
  for (const e of mixedAbs) {
    const delta = e.tick - last;
    last = e.tick;
    mixed.push({ type: e.type, delta, note: e.note, vel: e.vel });
  }

  const bytes = makeMidi({ bpm, ppq, events: mixed });
  await fs.writeFile(
    path.join(folder, `main_${barSuffix}.mid`),
    Buffer.from(bytes)
  );
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
