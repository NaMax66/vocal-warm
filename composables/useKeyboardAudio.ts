import {
  getOrganSampleUrls,
  getPianoSampleBaseUrl,
  getPianoSampleUrls,
  getSamplePreset,
  keyboardInstruments,
  samplePresets,
  type KeyboardInstrumentId,
  type SamplePresetId
} from '~/utils/instrumentSamples'

export function useKeyboardAudio() {
  const pressedMidi = ref<number | null>(null)
  const selectedKeyboardInstrumentId = ref<KeyboardInstrumentId>('piano')
  const selectedSamplePresetId = ref<SamplePresetId>('velocity16')
  const isKeyboardSamplerLoading = ref(false)

  let toneModule: typeof import('tone') | null = null
  let keyboardSampler: any = null
  let keyboardLimiter: any = null
  let keyboardSamplerLoadPromise: Promise<any> | null = null
  let activeKeyboardNote: string | null = null
  let activeKeyboardMidi: number | null = null
  let activeKeyboardNoteStartedAt = 0
  let releaseTimeoutId: ReturnType<typeof setTimeout> | null = null
  let releaseTimeoutNote: string | null = null
  let pressedMidiTimeoutId: ReturnType<typeof setTimeout> | null = null

  function applyInstrumentVolume() {
    if (!keyboardSampler) {
      return
    }

    const preset = getSamplePreset(selectedSamplePresetId.value)
    keyboardSampler.volume.value = selectedKeyboardInstrumentId.value === 'organ'
      ? preset.organGainDb
      : preset.pianoGainDb
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

  function disposeKeyboardSampler() {
    clearPendingRelease()
    clearPendingPressedMidi()
    keyboardSampler?.dispose()
    keyboardLimiter?.dispose()
    keyboardSampler = null
    keyboardLimiter = null
    keyboardSamplerLoadPromise = null
    isKeyboardSamplerLoading.value = false
  }

  async function ensureTone() {
    if (!toneModule) {
      toneModule = await import('tone')
    }

    await toneModule.start()

    return toneModule
  }

  async function loadKeyboardSampler() {
    if (!keyboardSamplerLoadPromise) {
      isKeyboardSamplerLoading.value = true
    }

    let Tone: typeof import('tone')

    try {
      Tone = await ensureTone()
    } catch (error) {
      isKeyboardSamplerLoading.value = false
      throw error
    }

    if (!keyboardSamplerLoadPromise) {
      try {
        const urls = selectedKeyboardInstrumentId.value === 'organ'
          ? await getOrganSampleUrls()
          : getPianoSampleUrls(selectedSamplePresetId.value)
        const baseUrl = selectedKeyboardInstrumentId.value === 'organ'
          ? ''
          : getPianoSampleBaseUrl(selectedSamplePresetId.value)

        keyboardLimiter = new Tone.Limiter(-1).toDestination()
        keyboardSampler = new Tone.Sampler({
          urls,
          baseUrl,
          attack: 0.001,
          release: 0.5
        }).connect(keyboardLimiter)
        applyInstrumentVolume()
        keyboardSamplerLoadPromise = Tone.loaded()
          .then(() => {
            isKeyboardSamplerLoading.value = false
            return keyboardSampler
          })
          .catch((error) => {
            isKeyboardSamplerLoading.value = false
            disposeKeyboardSampler()
            throw error
          })
      } catch (error) {
        isKeyboardSamplerLoading.value = false
        disposeKeyboardSampler()
        throw error
      }
    }

    return keyboardSamplerLoadPromise
  }

  function preloadKeyboardSampler() {
    loadKeyboardSampler().catch((error) => {
      console.warn('Keyboard samples failed to preload', error)
    })
  }

  async function getKeyboardInstrument() {
    return loadKeyboardSampler()
  }

  async function setKeyboardInstrument(instrumentId: KeyboardInstrumentId) {
    if (selectedKeyboardInstrumentId.value === instrumentId) {
      return
    }

    await stopKeyboardNote()
    selectedKeyboardInstrumentId.value = instrumentId
    disposeKeyboardSampler()
    await loadKeyboardSampler()
  }

  function restoreKeyboardInstrument(instrumentId: KeyboardInstrumentId) {
    if (selectedKeyboardInstrumentId.value === instrumentId) {
      return
    }

    selectedKeyboardInstrumentId.value = instrumentId
    disposeKeyboardSampler()
  }

  async function setSamplePreset(presetId: SamplePresetId) {
    if (selectedSamplePresetId.value === presetId) {
      return
    }

    await stopKeyboardNote()
    selectedSamplePresetId.value = presetId
    disposeKeyboardSampler()
    await loadKeyboardSampler()
  }

  function restoreSamplePreset(presetId: SamplePresetId) {
    if (selectedSamplePresetId.value === presetId) {
      return
    }

    selectedSamplePresetId.value = presetId
    disposeKeyboardSampler()
  }

  async function startKeyboardNote(noteName: string, midi: number) {
    if (activeKeyboardNote === noteName) {
      return
    }

    await stopKeyboardNote(activeKeyboardNote, { immediate: true })
    clearPendingPressedMidi()
    pressedMidi.value = midi
    activeKeyboardNote = noteName
    activeKeyboardMidi = midi
    activeKeyboardNoteStartedAt = performance.now()

    const pendingReleaseNote = releaseTimeoutNote
    clearPendingRelease()
    if (pendingReleaseNote) {
      keyboardSampler?.triggerRelease(pendingReleaseNote)
    }

    const instrument = await getKeyboardInstrument()
    instrument.triggerAttack(
      noteName,
      undefined,
      selectedKeyboardInstrumentId.value === 'organ'
        ? getSamplePreset(selectedSamplePresetId.value).organVelocity
        : 1
    )
  }

  async function stopKeyboardNote(noteName = activeKeyboardNote, options: { immediate?: boolean } = {}) {
    if (!noteName) {
      return
    }

    const isActiveNote = activeKeyboardNote === noteName
    const releasedMidi = isActiveNote ? activeKeyboardMidi : null
    const releaseDelayMs = isActiveNote
      ? options.immediate
        ? 0
        : Math.max(0, 500 - (performance.now() - activeKeyboardNoteStartedAt))
      : 0

    if (releaseTimeoutId) {
      clearTimeout(releaseTimeoutId)
    }

    releaseTimeoutNote = noteName
    releaseTimeoutId = setTimeout(() => {
      keyboardSampler?.triggerRelease(noteName)
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
    disposeKeyboardSampler()
  }

  return {
    pressedMidi,
    keyboardInstruments,
    samplePresets,
    selectedKeyboardInstrumentId,
    selectedSamplePresetId,
    isKeyboardSamplerLoading,
    startKeyboardNote,
    stopKeyboardNote,
    setKeyboardInstrument,
    restoreKeyboardInstrument,
    setSamplePreset,
    restoreSamplePreset,
    preloadKeyboardSampler,
    disposeKeyboardAudio
  }
}
