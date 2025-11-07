export function apply(pattern, p = {}) {
  return { ...pattern };
} // no change
export function post(events, { amount = 55 } = {}) {
  // delay every even 16th by amount% of a 16th
  // assume each event has {tick}; your events.js already knows ticks/ppq
  return events.map((e) => {
    const step = Math.floor(e.tick / (e.ppq / 4));
    const isEven16th = step % 2 === 1;
    if (!isEven16th) return e;
    const shift = Math.round((e.ppq / 4) * (amount / 100));
    return { ...e, tick: e.tick + shift };
  });
}
