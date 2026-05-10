const pianoSampleVersion = '1.0.5'
const pianoSampleNotes = [
  'C2',
  'D#2',
  'F#2',
  'A2',
  'C3',
  'D#3',
  'F#3',
  'A3',
  'C4',
  'D#4',
  'F#4',
  'A4',
  'C5',
  'D#5',
  'F#5',
  'A5',
  'C6',
  'D#6',
  'F#6',
  'A6',
  'C7'
] as const

export const pianoSamplePresets = [
  { id: 'velocity1', velocity: 1, gainDb: 18 },
  { id: 'velocity2', velocity: 2, gainDb: 14 },
  { id: 'velocity8', velocity: 8, gainDb: 8 },
  { id: 'velocity12', velocity: 12, gainDb: 4 },
  { id: 'velocity16', velocity: 16, gainDb: 2 }
] as const

export type PianoSamplePresetId = (typeof pianoSamplePresets)[number]['id']

export function isPianoSamplePresetId(value: string | null): value is PianoSamplePresetId {
  return pianoSamplePresets.some((preset) => preset.id === value)
}

export function getPianoSamplePreset(presetId: PianoSamplePresetId) {
  return pianoSamplePresets.find((preset) => preset.id === presetId) ?? pianoSamplePresets[0]
}

export function getPianoSampleBaseUrl(presetId: PianoSamplePresetId) {
  const preset = getPianoSamplePreset(presetId)

  return `https://cdn.jsdelivr.net/npm/@audio-samples/piano-velocity${preset.velocity}@${pianoSampleVersion}/audio/`
}

export function getPianoSampleUrls(presetId: PianoSamplePresetId) {
  const preset = getPianoSamplePreset(presetId)

  return Object.fromEntries(
    pianoSampleNotes.map((note) => [
      note,
      `${encodeURIComponent(note)}v${preset.velocity}.ogg`
    ])
  )
}
