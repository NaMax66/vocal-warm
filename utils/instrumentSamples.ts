const pianoSampleVersion = '1.0.5'
const organSoundfontUrl = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/church_organ-mp3.js'
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

export const keyboardInstruments = [
  { id: 'piano' },
  { id: 'organ' }
] as const

export const samplePresets = [
  { id: 'velocity1', velocity: 1, pianoGainDb: 18, organGainDb: -2, organVelocity: 0.45 },
  { id: 'velocity2', velocity: 2, pianoGainDb: 14, organGainDb: 0, organVelocity: 0.58 },
  { id: 'velocity8', velocity: 8, pianoGainDb: 8, organGainDb: 2, organVelocity: 0.72 },
  { id: 'velocity12', velocity: 12, pianoGainDb: 4, organGainDb: 4, organVelocity: 0.86 },
  { id: 'velocity16', velocity: 16, pianoGainDb: 2, organGainDb: 6, organVelocity: 1 }
] as const

export type KeyboardInstrumentId = (typeof keyboardInstruments)[number]['id']
export type SamplePresetId = (typeof samplePresets)[number]['id']

let organSoundfontUrls: Record<string, string> | null = null

export function isKeyboardInstrumentId(value: string | null): value is KeyboardInstrumentId {
  return keyboardInstruments.some((instrument) => instrument.id === value)
}

export function isSamplePresetId(value: string | null): value is SamplePresetId {
  return samplePresets.some((preset) => preset.id === value)
}

export function getSamplePreset(presetId: SamplePresetId) {
  return samplePresets.find((preset) => preset.id === presetId) ?? samplePresets[0]
}

export function getPianoSampleBaseUrl(presetId: SamplePresetId) {
  const preset = getSamplePreset(presetId)

  return `https://cdn.jsdelivr.net/npm/@audio-samples/piano-velocity${preset.velocity}@${pianoSampleVersion}/audio/`
}

export function getPianoSampleUrls(presetId: SamplePresetId) {
  const preset = getSamplePreset(presetId)

  return Object.fromEntries(
    pianoSampleNotes.map((note) => [
      note,
      `${encodeURIComponent(note)}v${preset.velocity}.ogg`
    ])
  )
}

export async function getOrganSampleUrls() {
  if (organSoundfontUrls) {
    return organSoundfontUrls
  }

  const soundfontScript = await fetch(organSoundfontUrl).then((response) => {
    if (!response.ok) {
      throw new Error(`Organ soundfont request failed with ${response.status}`)
    }

    return response.text()
  })
  const soundfontJson = soundfontScript.match(/MIDI\.Soundfont\.church_organ\s*=\s*(\{[\s\S]*\});?\s*$/)?.[1]
  const soundfont = soundfontJson
    ? Function(`return (${soundfontJson});`)() as Record<string, string>
    : undefined

  if (!soundfont) {
    throw new Error('Organ soundfont did not contain church_organ samples')
  }

  organSoundfontUrls = soundfont

  return organSoundfontUrls
}
