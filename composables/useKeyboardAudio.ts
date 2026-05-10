import { pianoSampleBaseUrl, pianoSampleUrls } from '~/utils/pianoSamples'

export function useKeyboardAudio() {
  const pressedMidi = ref<number | null>(null)

  let toneModule: typeof import('tone') | null = null
  let pianoSampler: any = null
  let pianoLimiter: any = null
  let pianoSamplerLoadPromise: Promise<any> | null = null
  let activeKeyboardNote: string | null = null

  function applyInstrumentVolume() {
    if (pianoSampler) {
      pianoSampler.volume.value = 18
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
      pianoLimiter = new Tone.Limiter(-1).toDestination()
      pianoSampler = new Tone.Sampler({
        urls: pianoSampleUrls,
        baseUrl: pianoSampleBaseUrl,
        attack: 0.001,
        release: 0.9
      }).connect(pianoLimiter)
      applyInstrumentVolume()
      pianoSamplerLoadPromise = Tone.loaded()
        .then(() => pianoSampler)
        .catch((error) => {
          pianoSampler?.dispose()
          pianoLimiter?.dispose()
          pianoSampler = null
          pianoLimiter = null
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
    return loadPianoSampler()
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

    pianoSampler?.triggerRelease(noteName)

    if (activeKeyboardNote === noteName) {
      activeKeyboardNote = null
      pressedMidi.value = null
    }
  }

  function disposeKeyboardAudio() {
    pianoSampler?.dispose()
    pianoLimiter?.dispose()
  }

  return {
    pressedMidi,
    startKeyboardNote,
    stopKeyboardNote,
    preloadPianoSampler,
    disposeKeyboardAudio
  }
}
