export const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const keyboardMinMidi = 36
export const keyboardMaxMidi = 95
export type NoteNotation = 'letter' | 'solfege'

const solfegeNoteNames = ['До', 'До#', 'Ре', 'Ре#', 'Ми', 'Фа', 'Фа#', 'Соль', 'Соль#', 'Ля', 'Ля#', 'Си']

export const noteNotationLabels: Record<NoteNotation, string> = {
  letter: 'C',
  solfege: 'До'
}

export const noteNotations: NoteNotation[] = ['letter', 'solfege']

export function midiToNoteName(midi: number) {
  const noteName = noteNames[((midi % 12) + 12) % 12]

  return `${noteName}${Math.floor(midi / 12) - 1}`
}

export function noteNameToDisplayName(noteName: string, notation: NoteNotation) {
  if (notation === 'letter') {
    return noteName
  }

  const noteIndex = noteNames.indexOf(noteName)

  return noteIndex >= 0 ? solfegeNoteNames[noteIndex] : noteName
}

export function midiToDisplayNoteName(midi: number, notation: NoteNotation) {
  const noteName = noteNames[((midi % 12) + 12) % 12]

  return `${noteNameToDisplayName(noteName, notation)}${Math.floor(midi / 12) - 1}`
}

export function frequencyToMidi(frequency: number) {
  return Math.round(69 + 12 * Math.log2(frequency / 440))
}

export function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function frequencyToMidiCents(frequency: number, midi: number) {
  return Math.round(1200 * Math.log2(frequency / midiToFrequency(midi)))
}

export function isMidiInKeyboardRange(midi: number) {
  return midi >= keyboardMinMidi && midi <= keyboardMaxMidi
}
