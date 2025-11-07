// Convert 16-step lane → MIDI events
// steps: array of 16 values (0..3)
// Each step is a 1/16th → ticksPerStep = ppq/4
export function patternToTrackEvents({ steps, note, velocities, ppq, loops=4, absolute=false }) {
  const tps = Math.floor(ppq / 4);
  const events = [];
  const total = 16 * loops;
  for (let s = 0; s < total; s++) {
    const idx = s % 16;
    const v = steps[idx] | 0;
    if (v <= 0) continue;
    const start = s * tps;
    const dur = tps; // simple 16th length; tweak per lane later
    const vel = velocities[v] | 0;
    if (absolute) {
      events.push({ type:'noteOn',  tick:start, note, vel });
      events.push({ type:'noteOff', tick:start+dur, note, vel:0 });
    } else {
      // We'll delta-encode after sorting at call-site; here keep absolute
      events.push({ type:'noteOn',  tick:start, note, vel });
      events.push({ type:'noteOff', tick:start+dur, note, vel:0 });
    }
  }
  // default return absolute; caller decides delta
  // But some callers expect delta already; allow both:
  if (absolute) return events;
  events.sort((a,b)=>a.tick-b.tick || (a.type==='noteOff')-(b.type==='noteOff'));
  const out = [];
  let last = 0;
  for (const e of events) {
    const delta = e.tick - last; last = e.tick;
    out.push({ type:e.type, delta, note:e.note, vel:e.vel });
  }
  return out;
}
