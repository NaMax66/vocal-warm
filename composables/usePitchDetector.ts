import { frequencyToMidi, frequencyToMidiCents, isMidiInKeyboardRange, midiToFrequency, noteNames } from '~/composables/useNoteMath'
import type { StatusKey } from '~/utils/i18n'

export type MicrophoneDeviceOption = {
  deviceId: string
  label: string
}

export type MicrophoneSettingKey =
  | 'deviceId'
  | 'echoCancellation'
  | 'noiseSuppression'
  | 'autoGainControl'
  | 'inputGain'
  | 'minimumRms'

const microphoneSettingsStorageKey = 'vocalwarm-microphone-settings-v1'

export function usePitchDetector() {
  const isListening = ref(false)
  const statusKey = ref<StatusKey>('idle')
  const frequency = ref<number | null>(null)
  const note = ref('--')
  const octave = ref('')
  const activeMidi = ref<number | null>(null)
  const cents = ref(0)
  const volume = ref(0)
  const errorMessage = ref('')
  const microphoneDevices = ref<MicrophoneDeviceOption[]>([])
  const deviceId = ref('')
  const echoCancellation = ref(false)
  const noiseSuppression = ref(false)
  const autoGainControl = ref(false)
  const inputGain = ref(1)
  const minimumRms = ref(0.012)
  const diagnosticsRevision = ref(0)

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let gainNode: GainNode | null = null
  let stream: MediaStream | null = null
  let animationId = 0
  let sampleBuffer: Float32Array | null = null
  let micBanLayoutHackIntervalId: ReturnType<typeof setInterval> | null = null
  let silentFrameCount = 0
  let requestedConstraints: MediaTrackConstraints | boolean | null = null
  let constraintFallbackError = ''
  let rmsSampleCount = 0
  let rmsTotal = 0
  let maxRms = 0
  let pitchFrameCount = 0

  function resolveAudioContextCtor() {
    return window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
  }

  function persistMicrophoneSettings() {
    if (!import.meta.client) {
      return
    }

    localStorage.setItem(microphoneSettingsStorageKey, JSON.stringify({
      deviceId: deviceId.value,
      echoCancellation: echoCancellation.value,
      noiseSuppression: noiseSuppression.value,
      autoGainControl: autoGainControl.value,
      inputGain: inputGain.value,
      minimumRms: minimumRms.value
    }))
  }

  function restoreMicrophoneSettings() {
    if (!import.meta.client) {
      return
    }

    try {
      const saved = JSON.parse(localStorage.getItem(microphoneSettingsStorageKey) || '{}')
      deviceId.value = typeof saved.deviceId === 'string' ? saved.deviceId : ''
      echoCancellation.value = saved.echoCancellation === true
      noiseSuppression.value = saved.noiseSuppression === true
      autoGainControl.value = saved.autoGainControl === true
      inputGain.value = Number.isFinite(saved.inputGain)
        ? Math.max(1, Math.min(8, saved.inputGain))
        : 1
      minimumRms.value = Number.isFinite(saved.minimumRms)
        ? Math.max(0.001, Math.min(0.03, saved.minimumRms))
        : 0.012
    } catch (error) {
      console.warn('Could not restore microphone settings', error)
    }
  }

  function setMicrophoneSetting(key: MicrophoneSettingKey, value: string | number | boolean) {
    if (key === 'deviceId') deviceId.value = String(value)
    if (key === 'echoCancellation') echoCancellation.value = Boolean(value)
    if (key === 'noiseSuppression') noiseSuppression.value = Boolean(value)
    if (key === 'autoGainControl') autoGainControl.value = Boolean(value)
    if (key === 'inputGain') inputGain.value = Math.max(1, Math.min(8, Number(value)))
    if (key === 'minimumRms') minimumRms.value = Math.max(0.001, Math.min(0.03, Number(value)))
    if (gainNode) gainNode.gain.value = inputGain.value
    persistMicrophoneSettings()
    diagnosticsRevision.value += 1
  }

  async function refreshMicrophoneDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices()
    microphoneDevices.value = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone ${index + 1}`
      }))
  }

  async function getMicrophoneStream() {
    const constraints: MediaTrackConstraints = {
      echoCancellation: echoCancellation.value,
      noiseSuppression: noiseSuppression.value,
      autoGainControl: autoGainControl.value
    }

    if (deviceId.value) {
      constraints.deviceId = { exact: deviceId.value }
    }

    requestedConstraints = constraints
    constraintFallbackError = ''

    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: constraints
      })
    } catch (error) {
      constraintFallbackError = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
      console.warn('Requested microphone constraints failed, falling back to default audio', error)
      requestedConstraints = true
      return navigator.mediaDevices.getUserMedia({ audio: true })
    }
  }

  async function resumeAudioContext() {
    if (audioContext?.state === 'suspended') {
      await audioContext.resume()
    }
  }

  function logMicrophoneDiagnostics() {
    const track = stream?.getAudioTracks()[0]
    console.info('Microphone diagnostics', {
      audioContextState: audioContext?.state,
      sampleRate: audioContext?.sampleRate,
      trackEnabled: track?.enabled,
      trackMuted: track?.muted,
      trackReadyState: track?.readyState,
      trackSettings: track?.getSettings?.()
    })
  }

  const diagnosticReport = computed(() => {
    diagnosticsRevision.value
    const track = stream?.getAudioTracks()[0]
    const settings = track?.getSettings?.() ?? null
    const capabilities = track?.getCapabilities?.() ?? null
    const averageRms = rmsSampleCount ? rmsTotal / rmsSampleCount : 0

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      page: import.meta.client ? location.href : '',
      userAgent: import.meta.client ? navigator.userAgent : '',
      app: {
        listening: isListening.value,
        detectedFrequencyHz: frequency.value ? Number(frequency.value.toFixed(2)) : null,
        note: note.value === '--' ? null : `${note.value}${octave.value}`,
        latestRms: Number(volume.value.toFixed(6)),
        estimatedRawRms: Number((volume.value / inputGain.value).toFixed(6)),
        averageRms: Number(averageRms.toFixed(6)),
        maxRms: Number(maxRms.toFixed(6)),
        sampledFrames: rmsSampleCount,
        pitchFrames: pitchFrameCount,
        inputGain: inputGain.value,
        minimumRms: minimumRms.value
      },
      requestedConstraints,
      constraintFallbackError: constraintFallbackError || null,
      audioContext: audioContext ? {
        state: audioContext.state,
        sampleRate: audioContext.sampleRate,
        baseLatency: audioContext.baseLatency
      } : null,
      track: track ? {
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        readyState: track.readyState,
        settings,
        capabilities
      } : null,
      supportedConstraints: import.meta.client
        ? navigator.mediaDevices?.getSupportedConstraints?.()
        : null,
      availableInputs: microphoneDevices.value
    }, null, 2)
  })

  function autoCorrelate(buffer: Float32Array, sampleRate: number) {
    let rms = 0

    for (let i = 0; i < buffer.length; i += 1) {
      rms += buffer[i] * buffer[i]
    }

    rms = Math.sqrt(rms / buffer.length)
    volume.value = rms
    rmsSampleCount += 1
    rmsTotal += rms
    maxRms = Math.max(maxRms, rms)
    if (rmsSampleCount % 30 === 0) diagnosticsRevision.value += 1

    if (rms < minimumRms.value) {
      return null
    }

    let start = 0
    let end = buffer.length - 1
    const threshold = 0.2

    for (let i = 0; i < buffer.length / 2; i += 1) {
      if (Math.abs(buffer[i]) < threshold) {
        start = i
        break
      }
    }

    for (let i = 1; i < buffer.length / 2; i += 1) {
      if (Math.abs(buffer[buffer.length - i]) < threshold) {
        end = buffer.length - i
        break
      }
    }

    const trimmed = buffer.slice(start, end)
    const correlations = new Array(trimmed.length).fill(0)

    for (let offset = 0; offset < trimmed.length; offset += 1) {
      for (let i = 0; i < trimmed.length - offset; i += 1) {
        correlations[offset] += trimmed[i] * trimmed[i + offset]
      }
    }

    let offset = 0

    while (correlations[offset] > correlations[offset + 1]) {
      offset += 1
    }

    let bestOffset = -1
    let bestCorrelation = 0

    for (let i = offset; i < correlations.length - 1; i += 1) {
      if (correlations[i] > bestCorrelation) {
        bestCorrelation = correlations[i]
        bestOffset = i
      }
    }

    if (bestOffset <= 0 || bestOffset >= correlations.length - 1 || bestCorrelation < 0.01) {
      return null
    }

    const before = correlations[bestOffset - 1]
    const current = correlations[bestOffset]
    const after = correlations[bestOffset + 1]
    const correction = (after - before) / (2 * (2 * current - after - before))

    return sampleRate / (bestOffset + correction)
  }

  function updateNoteFromFrequency(nextFrequency: number | null) {
    if (!nextFrequency || !Number.isFinite(nextFrequency) || nextFrequency < 40 || nextFrequency > 2000) {
      frequency.value = null
      note.value = '--'
      octave.value = ''
      activeMidi.value = null
      cents.value = 0
      statusKey.value = isListening.value ? 'waiting' : statusKey.value
      return
    }

    const midi = frequencyToMidi(nextFrequency)
    const noteIndex = ((midi % 12) + 12) % 12

    frequency.value = nextFrequency
    pitchFrameCount += 1
    note.value = noteNames[noteIndex]
    octave.value = String(Math.floor(midi / 12) - 1)
    activeMidi.value = isMidiInKeyboardRange(midi) ? midi : null
    cents.value = frequencyToMidiCents(nextFrequency, midi)
    statusKey.value = 'listening'
  }

  function tick() {
    if (!analyser || !sampleBuffer || !audioContext) {
      return
    }

    if (audioContext.state === 'suspended') {
      resumeAudioContext().catch((error) => {
        console.warn('Microphone AudioContext resume failed', error)
      })
      animationId = requestAnimationFrame(tick)
      return
    }

    analyser.getFloatTimeDomainData(sampleBuffer)
    updateNoteFromFrequency(autoCorrelate(sampleBuffer, audioContext.sampleRate))

    if (volume.value <= 0.0001) {
      silentFrameCount += 1
      if (silentFrameCount === 180) {
        logMicrophoneDiagnostics()
      }
    } else {
      silentFrameCount = 0
    }

    animationId = requestAnimationFrame(tick)
  }

  async function startListening(micErrorMessage: string, onStarted?: () => void) {
    errorMessage.value = ''

    try {
      const AudioContextCtor = resolveAudioContextCtor()

      if (!AudioContextCtor) {
        throw new Error('AudioContext is not supported')
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone access is not supported')
      }

      audioContext = new AudioContextCtor()

      await resumeAudioContext()

      stream = await getMicrophoneStream()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 4096
      sampleBuffer = new Float32Array(analyser.fftSize)
      source = audioContext.createMediaStreamSource(stream)
      gainNode = audioContext.createGain()
      gainNode.gain.value = inputGain.value
      source.connect(gainNode)
      gainNode.connect(analyser)
      rmsSampleCount = 0
      rmsTotal = 0
      maxRms = 0
      pitchFrameCount = 0
      await resumeAudioContext()
      await refreshMicrophoneDevices().catch((error) => {
        console.warn('Could not enumerate microphones', error)
      })
      logMicrophoneDiagnostics()
      diagnosticsRevision.value += 1
      isListening.value = true
      statusKey.value = 'listening'
      onStarted?.()
      tick()
    } catch (error) {
      stopListening()
      errorMessage.value = error instanceof Error ? error.message : micErrorMessage
      statusKey.value = 'micUnavailable'
    }
  }

  function startMicBanLayoutHack(onStarted?: () => void) {
    stopListening()
    errorMessage.value = ''
    isListening.value = true
    statusKey.value = 'listening'
    updateNoteFromFrequency(midiToFrequency(60))
    volume.value = 0.28
    onStarted?.()

    micBanLayoutHackIntervalId = setInterval(() => {
      updateNoteFromFrequency(midiToFrequency(60))
      volume.value = volume.value > 0.38 ? 0.22 : volume.value + 0.04
    }, 700)
  }

  function stopListening() {
    cancelAnimationFrame(animationId)
    if (micBanLayoutHackIntervalId) {
      clearInterval(micBanLayoutHackIntervalId)
      micBanLayoutHackIntervalId = null
    }
    source?.disconnect()
    gainNode?.disconnect()
    stream?.getTracks().forEach((track) => track.stop())
    audioContext?.close()

    audioContext = null
    analyser = null
    source = null
    gainNode = null
    stream = null
    sampleBuffer = null
    silentFrameCount = 0
    isListening.value = false
    frequency.value = null
    volume.value = 0
    note.value = '--'
    octave.value = ''
    activeMidi.value = null
    cents.value = 0
    statusKey.value = 'stopped'
    diagnosticsRevision.value += 1
  }

  return {
    isListening,
    statusKey,
    frequency,
    note,
    octave,
    activeMidi,
    cents,
    volume,
    errorMessage,
    microphoneDevices,
    deviceId,
    echoCancellation,
    noiseSuppression,
    autoGainControl,
    inputGain,
    minimumRms,
    diagnosticReport,
    restoreMicrophoneSettings,
    setMicrophoneSetting,
    refreshMicrophoneDevices,
    startListening,
    startMicBanLayoutHack,
    stopListening
  }
}
