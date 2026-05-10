import {
  getPianoSampleBaseUrl,
  getPianoSamplePreset,
  getPianoSampleUrls,
  pianoSamplePresets,
  type PianoSamplePresetId
} from '~/utils/pianoSamples'

export function useKeyboardAudio() {
  const pressedMidi = ref<number | null>(null)
  const selectedPianoPresetId = ref<PianoSamplePresetId>('velocity16')
  const isPianoSamplerLoading = ref(false)

  let toneModule: typeof import('tone') | null = null
  let pianoSampler: any = null
  let pianoLimiter: any = null
  let pianoSamplerLoadPromise: Promise<any> | null = null
  let activeKeyboardNote: string | null = null
  let activeKeyboardMidi: number | null = null
  let activeKeyboardNoteStartedAt = 0
  let releaseTimeoutId: ReturnType<typeof setTimeout> | null = null
  let releaseTimeoutNote: string | null = null
  let pressedMidiTimeoutId: ReturnType<typeof setTimeout> | null = null

  function applyInstrumentVolume() {
    if (pianoSampler) {
      pianoSampler.volume.value = getPianoSamplePreset(selectedPianoPresetId.value).gainDb
    }
  }

  function clearPendingRelease() {
    if (!releaseTimeoutId) {
      return
    }

    clearTimeout(releaseTimeoutId)
    releaseTimeoutId = null
    releaseTimeoutNote = null
  }

  function clearPendingPressedMidi() {
    if (!pressedMidiTimeoutId) {
      return
    }

    clearTimeout(pressedMidiTimeoutId)
    pressedMidiTimeoutId = null
  }

  function disposePianoSampler() {
    clearPendingRelease()
    clearPendingPressedMidi()
    pianoSampler?.dispose()
    pianoLimiter?.dispose()
    pianoSampler = null
    pianoLimiter = null
    pianoSamplerLoadPromise = null
    isPianoSamplerLoading.value = false
  }

  async function ensureTone() {
    if (!toneModule) {
      toneModule = await import('tone')
    }

    await toneModule.start()

    return toneModule
  }

  async function loadPianoSampler() {
    if (!pianoSamplerLoadPromise) {
      isPianoSamplerLoading.value = true
    }

    let Tone: typeof import('tone')

    try {
      Tone = await ensureTone()
    } catch (error) {
      isPianoSamplerLoading.value = false
      throw error
    }

    if (!pianoSamplerLoadPromise) {
      pianoLimiter = new Tone.Limiter(-1).toDestination()
      pianoSampler = new Tone.Sampler({
        urls: getPianoSampleUrls(selectedPianoPresetId.value),
        baseUrl: getPianoSampleBaseUrl(selectedPianoPresetId.value),
        attack: 0.001,
        release: 0.5
      }).connect(pianoLimiter)
      applyInstrumentVolume()
      pianoSamplerLoadPromise = Tone.loaded()
        .then(() => {
          isPianoSamplerLoading.value = false
          return pianoSampler
        })
        .catch((error) => {
          isPianoSamplerLoading.value = false
          disposePianoSampler()
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

  async function setPianoSamplePreset(presetId: PianoSamplePresetId) {
    if (selectedPianoPresetId.value === presetId) {
      return
    }

    await stopKeyboardNote()
    selectedPianoPresetId.value = presetId
    disposePianoSampler()
    await loadPianoSampler()
  }

  function restorePianoSamplePreset(presetId: PianoSamplePresetId) {
    if (selectedPianoPresetId.value === presetId) {
      return
    }

    selectedPianoPresetId.value = presetId
    disposePianoSampler()
  }

  async function startKeyboardNote(noteName: string, midi: number) {
    if (activeKeyboardNote === noteName) {
      return
    }

    await stopKeyboardNote()
    clearPendingPressedMidi()
    pressedMidi.value = midi
    activeKeyboardNote = noteName
    activeKeyboardMidi = midi
    activeKeyboardNoteStartedAt = performance.now()

    const pendingReleaseNote = releaseTimeoutNote
    clearPendingRelease()
    if (pendingReleaseNote) {
      pianoSampler?.triggerRelease(pendingReleaseNote)
    }

    const instrument = await getKeyboardInstrument()
    instrument.triggerAttack(noteName)
  }

  async function stopKeyboardNote(noteName = activeKeyboardNote) {
    if (!noteName) {
      return
    }

    const isActiveNote = activeKeyboardNote === noteName
    const releasedMidi = isActiveNote ? activeKeyboardMidi : null
    const releaseDelayMs = isActiveNote
      ? Math.max(0, 500 - (performance.now() - activeKeyboardNoteStartedAt))
      : 0

    if (releaseTimeoutId) {
      clearTimeout(releaseTimeoutId)
    }

    releaseTimeoutNote = noteName
    releaseTimeoutId = setTimeout(() => {
      pianoSampler?.triggerRelease(noteName)
      releaseTimeoutId = null
      releaseTimeoutNote = null
    }, releaseDelayMs)

    if (isActiveNote) {
      activeKeyboardNote = null
      activeKeyboardMidi = null
      activeKeyboardNoteStartedAt = 0
      clearPendingPressedMidi()
      pressedMidiTimeoutId = setTimeout(() => {
        if (pressedMidi.value === releasedMidi) {
          pressedMidi.value = null
        }

        pressedMidiTimeoutId = null
      }, releaseDelayMs)
    }
  }

  function disposeKeyboardAudio() {
    disposePianoSampler()
  }

  return {
    pressedMidi,
    pianoSamplePresets,
    selectedPianoPresetId,
    isPianoSamplerLoading,
    startKeyboardNote,
    stopKeyboardNote,
    setPianoSamplePreset,
    restorePianoSamplePreset,
    preloadPianoSampler,
    disposeKeyboardAudio
  }
}
