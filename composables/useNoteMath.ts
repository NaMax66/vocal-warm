export const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const keyboardMinMidi = 36
export const keyboardMaxMidi = 95

export function midiToNoteName(midi: number) {
  const noteName = noteNames[((midi % 12) + 12) % 12]

  return `${noteName}${Math.floor(midi / 12) - 1}`
}

export function frequencyToMidi(frequency: number) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function isMidiInKeyboardRange(midi: number) {
  return midi >= keyboardMinMidi && midi <= keyboardMaxMidi
}
