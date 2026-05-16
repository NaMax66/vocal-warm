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

export const samplePresets = [
  { id: 'velocity1', pianoVelocity: 1 },
  { id: 'velocity2', pianoVelocity: 2 },
  { id: 'velocity8', pianoVelocity: 8 },
  { id: 'velocity12', pianoVelocity: 12 },
  { id: 'velocity16', pianoVelocity: 16 }
] as const

export type SamplePresetId = (typeof samplePresets)[number]['id']
type SamplePreset = (typeof samplePresets)[number]
type KeyboardInstrumentConfig = {
  createInstrument: (Tone: typeof import('tone'), preset: SamplePreset) => any | Promise<any>
  getGainDb: (preset: SamplePreset) => number
  getAttackVelocity: (preset: SamplePreset) => number
}

let organSoundfontUrls: Record<string, string> | null = null

const pianoGainDbByPreset: Record<SamplePresetId, number> = {
  velocity1: 18,
  velocity2: 14,
  velocity8: 8,
  velocity12: 4,
  velocity16: 2
}

const organDynamicsByPreset: Record<SamplePresetId, { gainDb: number, attackVelocity: number }> = {
  velocity1: { gainDb: -2, attackVelocity: 0.45 },
  velocity2: { gainDb: 0, attackVelocity: 0.58 },
  velocity8: { gainDb: 2, attackVelocity: 0.72 },
  velocity12: { gainDb: 4, attackVelocity: 0.86 },
  velocity16: { gainDb: 6, attackVelocity: 1 }
}

export function isSamplePresetId(value: string | null): value is SamplePresetId {
  return samplePresets.some((preset) => preset.id === value)
}

export function getSamplePreset(presetId: SamplePresetId) {
  return samplePresets.find((preset) => preset.id === presetId) ?? samplePresets[0]
}

function getPianoSampleBaseUrl(preset: SamplePreset) {
  return `https://cdn.jsdelivr.net/npm/@audio-samples/piano-velocity${preset.pianoVelocity}@${pianoSampleVersion}/audio/`
}

function getPianoSampleUrls(preset: SamplePreset) {
  return Object.fromEntries(
    pianoSampleNotes.map((note) => [
      note,
      `${encodeURIComponent(note)}v${preset.pianoVelocity}.ogg`
    ])
  )
}

function createPianoSampler(Tone: typeof import('tone'), preset: SamplePreset) {
  return new Tone.Sampler({
    urls: getPianoSampleUrls(preset),
    baseUrl: getPianoSampleBaseUrl(preset),
    attack: 0.001,
    release: 0.5
  })
}

async function getOrganSampleUrls() {
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

function findClosestMidi(buffers: any, midi: number) {
  const maxInterval = 96

  for (let interval = 0; interval < maxInterval; interval += 1) {
    if (buffers.has(midi + interval)) {
      return {
        closestMidi: midi + interval,
        difference: -interval
      }
    }

    if (buffers.has(midi - interval)) {
      return {
        closestMidi: midi - interval,
        difference: interval
      }
    }
  }

  throw new Error(`No available buffers for note: ${midi}`)
}

function createLoopPoints(bufferDuration: number) {
  const loopStart = Math.min(0.18, bufferDuration * 0.35)
  const loopEnd = Math.max(loopStart + 0.08, bufferDuration - 0.12)

  return { loopStart, loopEnd }
}

async function createLoopedOrganSampler(Tone: typeof import('tone'), preset: SamplePreset) {
  const urls = await getOrganSampleUrls()
  const urlMap = Object.fromEntries(
    Object.entries(urls).map(([note, url]) => [
      Math.round(Tone.Frequency(note).toMidi()),
      url
    ])
  )
  const buffers = new Tone.ToneAudioBuffers({
    urls: urlMap,
    baseUrl: ''
  })
  const volume = new Tone.Volume(organDynamicsByPreset[preset.id].gainDb)
  const activeSources = new Map<number, any[]>()

  return {
    volume,
    connect(destination: any) {
      volume.connect(destination)
      return this
    },
    triggerAttack(note: string, time?: any, velocity = 1) {
      const midiFloat = Tone.ftom(Tone.Frequency(note).toFrequency())
      const midi = Math.round(midiFloat)
      const remainder = midiFloat - midi
      const { closestMidi, difference } = findClosestMidi(buffers, midi)
      const buffer = buffers.get(closestMidi)
      const playbackRate = Tone.intervalToFrequencyRatio(difference + remainder)
      const { loopStart, loopEnd } = createLoopPoints(buffer.duration)
      const source = new Tone.BufferSource({
        url: buffer,
        curve: 'linear',
        fadeIn: 0.012,
        fadeOut: 0.18,
        loop: true,
        loopStart,
        loopEnd,
        playbackRate
      }).connect(volume)

      source.start(time, 0, undefined, velocity)

      if (!activeSources.has(midi)) {
        activeSources.set(midi, [])
      }

      activeSources.get(midi)?.push(source)
      source.onended = () => {
        const sources = activeSources.get(midi)
        if (!sources) {
          return
        }

        const sourceIndex = sources.indexOf(source)
        if (sourceIndex !== -1) {
          sources.splice(sourceIndex, 1)
        }
      }

      return this
    },
    triggerRelease(note: string, time?: any) {
      const midi = Math.round(Tone.Frequency(note).toMidi())
      const sources = activeSources.get(midi) ?? []

      sources.forEach((source) => source.stop(time))
      activeSources.set(midi, [])

      return this
    },
    releaseAll(time?: any) {
      activeSources.forEach((sources, midi) => {
        sources.forEach((source) => source.stop(time))
        activeSources.set(midi, [])
      })

      return this
    },
    dispose() {
      this.releaseAll()
      buffers.dispose()
      volume.dispose()
    }
  }
}

const keyboardInstrumentConfigs = {
  piano: {
    createInstrument: createPianoSampler,
    getGainDb: (preset) => pianoGainDbByPreset[preset.id],
    getAttackVelocity: () => 1
  },
  organ: {
    createInstrument: createLoopedOrganSampler,
    getGainDb: (preset) => organDynamicsByPreset[preset.id].gainDb,
    getAttackVelocity: (preset) => organDynamicsByPreset[preset.id].attackVelocity
  }
} satisfies Record<string, KeyboardInstrumentConfig>

export type KeyboardInstrumentId = keyof typeof keyboardInstrumentConfigs

export const keyboardInstruments = Object.keys(keyboardInstrumentConfigs).map((id) => ({
  id: id as KeyboardInstrumentId
}))

export function isKeyboardInstrumentId(value: string | null): value is KeyboardInstrumentId {
  return Boolean(value && value in keyboardInstrumentConfigs)
}

export function getKeyboardInstrumentConfig(instrumentId: KeyboardInstrumentId) {
  return keyboardInstrumentConfigs[instrumentId] ?? keyboardInstrumentConfigs.piano
}

export async function createKeyboardInstrument(
  Tone: typeof import('tone'),
  instrumentId: KeyboardInstrumentId,
  presetId: SamplePresetId
) {
  return getKeyboardInstrumentConfig(instrumentId).createInstrument(Tone, getSamplePreset(presetId))
}

export function getKeyboardInstrumentGainDb(instrumentId: KeyboardInstrumentId, presetId: SamplePresetId) {
  return getKeyboardInstrumentConfig(instrumentId).getGainDb(getSamplePreset(presetId))
}

export function getKeyboardInstrumentAttackVelocity(instrumentId: KeyboardInstrumentId, presetId: SamplePresetId) {
  return getKeyboardInstrumentConfig(instrumentId).getAttackVelocity(getSamplePreset(presetId))
}
