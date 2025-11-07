// Minimal single-track MIDI writer (format 0), channel 10
const CH = 9; // channel 10 (0-based)

export function makeMidi({ bpm=130, ppq=480, events=[] }) {
  const track = [];

  const mpq = Math.round(60000000 / bpm);
  pushMeta(track, 0, 0x51, numToBytes(mpq, 3)); // tempo
  pushMeta(track, 0, 0x58, [4,2,24,8]);         // time signature 4/4

  for (const e of events) {
    if (e.type === 'noteOn') pushEvent(track, e.delta, 0x90 | CH, e.note & 0x7f, e.vel & 0x7f);
    else if (e.type === 'noteOff') pushEvent(track, e.delta, 0x80 | CH, e.note & 0x7f, 0x00);
  }

  pushMeta(track, 0, 0x2F, []); // end of track

  const header = makeHeader(ppq);
  const chunk = makeChunk('MTrk', new Uint8Array(track));
  return new Uint8Array([...header, ...chunk]);
}

function makeHeader(ppq) {
  const out = [];
  pushStr(out, 'MThd');
  push32(out, 6);
  push16(out, 0);    // format 0
  push16(out, 1);    // one track
  push16(out, ppq);  // division
  return new Uint8Array(out);
}

function makeChunk(tag, data) {
  const out = [];
  pushStr(out, tag);
  push32(out, data.length);
  for (const b of data) out.push(b);
  return new Uint8Array(out);
}

function pushEvent(arr, delta, status, d1, d2) {
  pushVarLen(arr, delta);
  arr.push(status & 0xFF, d1 & 0x7f, d2 & 0x7f);
}

function pushMeta(arr, delta, type, data) {
  pushVarLen(arr, delta);
  arr.push(0xFF, type & 0x7F);
  pushVarLen(arr, data.length);
  for (const b of data) arr.push(b & 0xFF);
}

function push16(arr, n){ arr.push((n>>8)&0xff, n&0xff); }
function push32(arr, n){ arr.push((n>>>24)&0xff,(n>>>16)&0xff,(n>>>8)&0xff,n&0xff); }
function pushStr(arr, s){ for (let i=0;i<s.length;i++) arr.push(s.charCodeAt(i)); }
function pushVarLen(arr, v){
  let buffer = v & 0x7f;
  while ((v >>= 7)) { buffer <<= 8; buffer |= ((v & 0x7f) | 0x80); }
  while (true) { arr.push(buffer & 0xff); if (buffer & 0x80) buffer >>= 8; else break; }
}
function numToBytes(n, len){ const out = new Array(len).fill(0); for (let i=len-1;i>=0;i--){ out[i]=n&0xff; n>>>=8; } return out; }
