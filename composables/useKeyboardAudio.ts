import { pianoSampleBaseUrl, pianoSampleUrls } from '~/utils/pianoSamples'

export type SoundMode = 'midi' | 'piano'

export const soundModes: SoundMode[] = ['midi', 'piano']

export function useKeyboardAudio() {
  const soundMode = ref<SoundMode>('piano')
  const pressedMidi = ref<number | null>(null)
  const instrumentVolume = ref(100)

  let toneModule: typeof import('tone') | null = null
  let midiSynth: any = null
  let pianoSampler: any = null
  let pianoSamplerLoadPromise: Promise<any> | null = null
  let activeKeyboardNote: string | null = null

  const instrumentVolumeDb = computed(() => Math.round(-28 + (instrumentVolume.value / 100) * 40))

  function applyInstrumentVolume() {
    if (midiSynth) {
      midiSynth.volume.value = instrumentVolumeDb.value
    }

    if (pianoSampler) {
      pianoSampler.volume.value = instrumentVolumeDb.value
    }
  }

  async function ensureTone() {
    if (!toneModule) {
      toneModule = await import('tone')
    }

    await toneModule.start()

    return toneModule
  }

  async function loadPianoSampler() {
    const Tone = await ensureTone()

    if (!pianoSamplerLoadPromise) {
      pianoSampler = new Tone.Sampler({
        urls: pianoSampleUrls,
        baseUrl: pianoSampleBaseUrl,
        attack: 0.001,
        release: 0.9
      }).toDestination()
      applyInstrumentVolume()
      pianoSamplerLoadPromise = Tone.loaded()
        .then(() => pianoSampler)
        .catch((error) => {
          pianoSampler?.dispose()
          pianoSampler = null
          pianoSamplerLoadPromise = null
          throw error
        })
    }

    return pianoSamplerLoadPromise
  }

  function preloadPianoSampler() {
    loadPianoSampler().catch((error) => {
      console.warn('Piano samples failed to preload', error)
    })
  }

  async function getKeyboardInstrument() {
    const Tone = await ensureTone()

    if (soundMode.value === 'piano') {
      return loadPianoSampler()
    }

    if (!midiSynth) {
      midiSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.01,
          decay: 0.12,
          sustain: 0.28,
          release: 0.35
        }
      }).toDestination()
      applyInstrumentVolume()
    }

    return midiSynth
  }

  async function startKeyboardNote(noteName: string, midi: number) {
    if (activeKeyboardNote === noteName) {
      return
    }

    await stopKeyboardNote()
    pressedMidi.value = midi
    activeKeyboardNote = noteName

    const instrument = await getKeyboardInstrument()
    instrument.triggerAttack(noteName)
  }

  async function stopKeyboardNote(noteName = activeKeyboardNote) {
    if (!noteName) {
      return
    }

    const instrument = soundMode.value === 'piano' ? pianoSampler : midiSynth
    instrument?.triggerRelease(noteName)

    if (activeKeyboardNote === noteName) {
      activeKeyboardNote = null
      pressedMidi.value = null
    }
  }

  async function setSoundMode(nextMode: SoundMode) {
    await stopKeyboardNote()
    soundMode.value = nextMode

    if (nextMode === 'piano') {
      preloadPianoSampler()
    }
  }

  function setInstrumentVolume(nextVolume: number) {
    instrumentVolume.value = nextVolume
    applyInstrumentVolume()
  }

  function disposeKeyboardAudio() {
    midiSynth?.dispose()
    pianoSampler?.dispose()
  }

  return {
    soundMode,
    pressedMidi,
    instrumentVolume,
    startKeyboardNote,
    stopKeyboardNote,
    setSoundMode,
    setInstrumentVolume,
    preloadPianoSampler,
    disposeKeyboardAudio
  }
}
