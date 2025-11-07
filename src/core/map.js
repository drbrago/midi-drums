// General MIDI drum notes (channel 10)
export const NOTE = {
  kick: 36, // Bass Drum 1
  snare: 38, // Acoustic Snare
  closed_hh: 42, // Closed Hi-hat
  open_hh: 46, // Open Hi-hat
  perc: 39, // Hand Clap (or swap to 45 for low tom)
  tom: 45, // Low Tom
  ride: 51, // Ride Cymbal 1
};

// Map seed step 0..3 → MIDI velocity
export const VEL = { 0: 0, 1: 50, 2: 90, 3: 120 };
