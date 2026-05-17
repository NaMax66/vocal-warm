import { frequencyToMidi, frequencyToMidiCents, isMidiInKeyboardRange, midiToFrequency, noteNames } from '~/composables/useNoteMath'
import type { StatusKey } from '~/utils/i18n'

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

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let stream: MediaStream | null = null
  let animationId = 0
  let sampleBuffer: Float32Array | null = null
  let micBanLayoutHackIntervalId: ReturnType<typeof setInterval> | null = null
  let silentFrameCount = 0

  function resolveAudioContextCtor() {
    return window.AudioContext || (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext
  }

  async function getMicrophoneStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })
    } catch (error) {
      console.warn('Raw microphone constraints failed, falling back to default audio', error)
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

  function autoCorrelate(buffer: Float32Array, sampleRate: number) {
    let rms = 0

    for (let i = 0; i < buffer.length; i += 1) {
      rms += buffer[i] * buffer[i]
    }

    rms = Math.sqrt(rms / buffer.length)
    volume.value = rms

    if (rms < 0.012) {
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
      source.connect(analyser)
      await resumeAudioContext()
      logMicrophoneDiagnostics()
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
    stream?.getTracks().forEach((track) => track.stop())
    audioContext?.close()

    audioContext = null
    analyser = null
    source = null
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
    startListening,
    startMicBanLayoutHack,
    stopListening
  }
}
