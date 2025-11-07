# midi-drums

Minimal, reproducible drum MIDI pack generator built around **seeds** (hand-authored 16‑step patterns) and **recipes** (deterministic transformations).

## Quick start
```bash
npm i
npm run render
```

This renders a **foundation** pack from `seeds/techno_core_001.json` into `packs/techno/...`.

## CLI
```
drumseed render --seed <path> --out <dir> --genre <name> --loops <n>   --ppq 480 --bpm <override>   --pipeline foundation   --pipeline "industrialize:hatLevel=3"   --pipeline minimalize
```
List available recipes:
```
drumseed recipes
```

## Concepts
- **Seed**: your canonical 16‑step drum lanes with values 0..3 (off, soft, med, loud).
- **Recipe**: pure function `(pattern, params) -> pattern`. Can be chained via multiple `--pipeline` flags.
- **Render**: the MIDI files + manifest produced from `{seed, pipelines, params}`.

