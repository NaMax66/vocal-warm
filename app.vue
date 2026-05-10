<script setup lang="ts">
type Language = 'en' | 'ru'
type StatusKey = 'idle' | 'listening' | 'waiting' | 'stopped' | 'micUnavailable'

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const supportedLanguages: Language[] = ['en', 'ru']
const copy = {
  en: {
    title: 'Vocal warmup by notes',
    start: 'Start',
    stop: 'Stop',
    inactiveSession: 'Session inactive',
    startHint: 'Press Start or play a key',
    volume: 'Volume',
    waitingForSound: 'Waiting for a steady sound',
    inTune: 'in tune',
    sharp: (value: number) => `${value} c. sharp`,
    flat: (value: number) => `${value} c. flat`,
    meterLabel: 'Offset from the nearest note',
    keyboardLabel: 'Piano keyboard from C2 to B6',
    status: {
      idle: 'Press start and allow microphone access',
      listening: 'Listening',
      waiting: 'Play or sing one note',
      stopped: 'Stopped',
      micUnavailable: 'Microphone unavailable'
    },
    micError: 'Could not start the microphone'
  },
  ru: {
    title: '\u0420\u0430\u0441\u043f\u0435\u0432\u043a\u0430 \u043f\u043e \u043d\u043e\u0442\u0430\u043c',
    start: '\u0421\u0442\u0430\u0440\u0442',
    stop: '\u0421\u0442\u043e\u043f',
    inactiveSession: '\u0421\u0435\u0441\u0441\u0438\u044f \u043d\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u0430',
    startHint: '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 Start \u0438\u043b\u0438 \u0441\u044b\u0433\u0440\u0430\u0439\u0442\u0435 \u043a\u043b\u0430\u0432\u0438\u0448\u0443',
    volume: '\u0413\u0440\u043e\u043c\u043a\u043e\u0441\u0442\u044c',
    waitingForSound: '\u0416\u0434\u0443 \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u044b\u0439 \u0437\u0432\u0443\u043a',
    inTune: '\u0442\u043e\u0447\u043d\u043e',
    sharp: (value: number) => `\u0432\u044b\u0448\u0435 \u043d\u0430 ${value} \u0446.`,
    flat: (value: number) => `\u043d\u0438\u0436\u0435 \u043d\u0430 ${value} \u0446.`,
    meterLabel: '\u041e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 \u043e\u0442 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0439 \u043d\u043e\u0442\u044b',
    keyboardLabel: '\u0424\u043e\u0440\u0442\u0435\u043f\u0438\u0430\u043d\u043d\u0430\u044f \u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430 \u043e\u0442 C2 \u0434\u043e B6',
    status: {
      idle: '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0441\u0442\u0430\u0440\u0442 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443',
      listening: '\u0421\u043b\u0443\u0448\u0430\u044e',
      waiting: '\u0421\u044b\u0433\u0440\u0430\u0439\u0442\u0435 \u0438\u043b\u0438 \u0441\u043f\u043e\u0439\u0442\u0435 \u043e\u0434\u043d\u0443 \u043d\u043e\u0442\u0443',
      stopped: '\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e',
      micUnavailable: '\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d'
    },
    micError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d'
  }
}

const language = ref<Language>('en')
const isListening = ref(false)
const statusKey = ref<StatusKey>('idle')
const frequency = ref<number | null>(null)
const note = ref('--')
const octave = ref('')
const activeMidi = ref<number | null>(null)
const pressedMidi = ref<number | null>(null)
const cents = ref(0)
const volume = ref(0)
const errorMessage = ref('')

let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let stream: MediaStream | null = null
let animationId = 0
let sampleBuffer: Float32Array | null = null
let toneModule: typeof import('tone') | null = null
let keyboardSynth: import('tone').Synth | null = null
let pressedMidiTimeout = 0

const t = computed(() => copy[language.value])
const status = computed(() => t.value.status[statusKey.value])
const displayActiveMidi = computed(() => activeMidi.value ?? pressedMidi.value)

const centsLabel = computed(() => {
  if (!frequency.value) {
    return t.value.waitingForSound
  }

  if (Math.abs(cents.value) <= 5) {
    return t.value.inTune
  }

  return cents.value > 0 ? t.value.sharp(cents.value) : t.value.flat(Math.abs(cents.value))
})

const meterStyle = computed(() => ({
  transform: `translateX(${Math.max(-48, Math.min(48, cents.value * 0.9))}px)`
}))

const volumeStyle = computed(() => ({
  width: `${Math.min(100, Math.round(volume.value * 180))}%`
}))

function resolveLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function setLanguage(nextLanguage: Language) {
  language.value = nextLanguage
  localStorage.setItem('vocalwarm-language', nextLanguage)
}

async function playKeyboardNote(noteName: string, midi: number) {
  window.clearTimeout(pressedMidiTimeout)
  pressedMidi.value = midi
  pressedMidiTimeout = window.setTimeout(() => {
    pressedMidi.value = null
  }, 240)

  if (!toneModule) {
    toneModule = await import('tone')
  }

  await toneModule.start()

  if (!keyboardSynth) {
    keyboardSynth = new toneModule.Synth({
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
    keyboardSynth.volume.value = -8
  }

  keyboardSynth.triggerAttackRelease(noteName, '8n')
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

  const midi = Math.round(69 + 12 * Math.log2(nextFrequency / 440))
  const exactFrequency = 440 * 2 ** ((midi - 69) / 12)
  const noteIndex = ((midi % 12) + 12) % 12

  frequency.value = nextFrequency
  note.value = noteNames[noteIndex]
  octave.value = String(Math.floor(midi / 12) - 1)
  activeMidi.value = midi >= 36 && midi <= 95 ? midi : null
  cents.value = Math.round(1200 * Math.log2(nextFrequency / exactFrequency))
  statusKey.value = 'listening'
}

function tick() {
  if (!analyser || !sampleBuffer || !audioContext) {
    return
  }

  analyser.getFloatTimeDomainData(sampleBuffer)
  updateNoteFromFrequency(autoCorrelate(sampleBuffer, audioContext.sampleRate))
  animationId = requestAnimationFrame(tick)
}

async function startListening() {
  errorMessage.value = ''

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
      }
    })

    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    analyser.fftSize = 4096
    sampleBuffer = new Float32Array(analyser.fftSize)
    source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    isListening.value = true
    statusKey.value = 'listening'
    tick()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t.value.micError
    statusKey.value = 'micUnavailable'
  }
}

function stopListening() {
  cancelAnimationFrame(animationId)
  source?.disconnect()
  stream?.getTracks().forEach((track) => track.stop())
  audioContext?.close()

  audioContext = null
  analyser = null
  source = null
  stream = null
  sampleBuffer = null
  isListening.value = false
  frequency.value = null
  volume.value = 0
  note.value = '--'
  octave.value = ''
  activeMidi.value = null
  cents.value = 0
  statusKey.value = 'stopped'
}

onMounted(() => {
  const savedLanguage = localStorage.getItem('vocalwarm-language') as Language | null
  language.value = savedLanguage && supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : resolveLanguage(navigator.language)
})

useHead(() => ({
  title: `VocalWarm - ${t.value.title}`,
  htmlAttrs: {
    lang: language.value
  }
}))

onBeforeUnmount(() => {
  window.clearTimeout(pressedMidiTimeout)
  keyboardSynth?.dispose()
  stopListening()
})
</script>

<template>
  <main class="page-shell">
    <section class="tuner" :class="{ inactive: !isListening }">
      <div class="topbar">
        <div>
          <p class="eyebrow">VocalWarm</p>
          <h1>{{ t.title }}</h1>
        </div>

        <div class="controls">
          <div class="language-switch" aria-label="Interface language">
            <button
              v-for="nextLanguage in supportedLanguages"
              :key="nextLanguage"
              type="button"
              :class="{ active: language === nextLanguage }"
              :aria-pressed="language === nextLanguage"
              @click="setLanguage(nextLanguage)"
            >
              {{ nextLanguage.toUpperCase() }}
            </button>
          </div>

          <button v-if="isListening" class="listen-button" type="button" @click="stopListening">
            {{ t.stop }}
          </button>
        </div>
      </div>

      <div v-if="!isListening" class="start-overlay">
        <span class="overlay-kicker">{{ t.inactiveSession }}</span>
        <button class="overlay-action" type="button" @click="startListening">
          {{ t.start }}
        </button>
        <span class="overlay-hint">{{ t.startHint }}</span>
      </div>

      <div class="readout" aria-live="polite">
        <span class="note">{{ note }}</span>
        <span class="octave">{{ octave }}</span>
      </div>

      <div class="frequency-row">
        <span>{{ frequency ? `${frequency.toFixed(1)} Hz` : '-- Hz' }}</span>
        <span>{{ centsLabel }}</span>
      </div>

      <div class="tuning-meter" :aria-label="t.meterLabel">
        <span>-50</span>
        <div class="rail">
          <i class="center-line" />
          <i class="needle" :style="meterStyle" />
        </div>
        <span>+50</span>
      </div>

      <PianoKeyboard :active-midi="displayActiveMidi" :label="t.keyboardLabel" @play-note="playKeyboardNote" />

      <div class="volume">
        <div class="volume-label">
          <span>{{ t.volume }}</span>
          <span>{{ status }}</span>
        </div>
        <div class="volume-track">
          <i :style="volumeStyle" />
        </div>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>
  </main>
</template>

<style>
:root {
  color: #17201d;
  background: #f4f1e8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  overflow-x: hidden;
}

button {
  font: inherit;
}

.page-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(244, 241, 232, 0.92), rgba(222, 232, 226, 0.88)),
    url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=80') center / cover;
}

.tuner {
  position: relative;
  width: 100%;
  max-width: 960px;
  min-width: 0;
  padding: clamp(22px, 5vw, 42px);
  border: 1px solid rgba(23, 32, 29, 0.14);
  border-radius: 8px;
  background: rgba(255, 252, 244, 0.92);
  box-shadow: 0 24px 80px rgba(31, 41, 37, 0.18);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.topbar,
.frequency-row,
.volume-label,
.tuning-meter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar {
  position: relative;
  z-index: 3;
  align-items: flex-start;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.language-switch {
  display: inline-grid;
  grid-template-columns: repeat(2, 44px);
  min-height: 48px;
  padding: 4px;
  border: 1px solid rgba(23, 32, 29, 0.14);
  border-radius: 8px;
  background: rgba(23, 32, 29, 0.07);
}

.language-switch button {
  border: 0;
  border-radius: 6px;
  color: #52615c;
  background: transparent;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 850;
}

.language-switch button.active {
  color: #17201d;
  background: #fffaf0;
  box-shadow: 0 4px 14px rgba(31, 41, 37, 0.13);
}

.eyebrow {
  margin: 0 0 8px;
  color: #5d6964;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #17201d;
  font-size: clamp(2rem, 6vw, 4.4rem);
  line-height: 0.95;
  letter-spacing: 0;
}

.listen-button {
  min-width: 104px;
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  color: #fffaf0;
  background: #d74f2a;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.listen-button:hover {
  background: #b83e20;
  transform: translateY(-1px);
}

.start-overlay {
  position: absolute;
  z-index: 2;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border: 0;
  border-radius: inherit;
  color: #17201d;
  background:
    linear-gradient(135deg, rgba(255, 252, 244, 0.3), rgba(232, 242, 236, 0.14)),
    rgba(255, 252, 244, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(2px) saturate(1.06);
  pointer-events: none;
  text-align: center;
}

.start-overlay::before {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px;
  pointer-events: none;
}

.start-overlay:hover .overlay-action {
  transform: translateY(-2px);
  background: rgba(255, 252, 244, 0.58);
  border-color: rgba(215, 79, 42, 0.56);
}

.overlay-kicker,
.overlay-hint {
  position: relative;
  z-index: 1;
  color: #52615c;
  font-weight: 800;
}

.overlay-kicker {
  font-size: 0.85rem;
  text-transform: uppercase;
}

.overlay-action {
  position: relative;
  z-index: 1;
  min-width: min(74vw, 320px);
  padding: 22px 42px;
  border: 1px solid rgba(215, 79, 42, 0.32);
  border-radius: 8px;
  color: #d74f2a;
  background: rgba(255, 252, 244, 0.42);
  cursor: pointer;
  pointer-events: auto;
  box-shadow:
    0 18px 60px rgba(31, 41, 37, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(10px) saturate(1.1);
  font-size: clamp(2.2rem, 8vw, 5.8rem);
  font-weight: 900;
  line-height: 1;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.overlay-hint {
  max-width: min(70vw, 380px);
  font-size: 0.96rem;
}

.tuner.inactive .piano-key.black {
  color: rgba(255, 250, 240, 0.28);
  background: rgba(23, 32, 29, 0.56);
  box-shadow: 0 4px 12px rgba(23, 32, 29, 0.1);
}

.tuner.inactive .piano-key.white {
  color: rgba(82, 97, 92, 0.42);
  background: rgba(255, 253, 248, 0.66);
}

.readout {
  min-height: 210px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 32px 0 18px;
  color: #162c39;
}

.note {
  font-size: clamp(7rem, 28vw, 14rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: 0;
}

.octave {
  min-width: 48px;
  color: #277a73;
  font-size: clamp(2.6rem, 8vw, 5rem);
  font-weight: 850;
}

.frequency-row {
  color: #3d4c47;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 750;
}

.tuning-meter {
  margin: 26px 0;
  color: #63706b;
  font-size: 0.82rem;
  font-weight: 700;
}

.rail {
  position: relative;
  width: min(100%, 560px);
  height: 48px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #2b6f9b 0%, #9fc9bd 45%, #277a73 50%, #efb45d 55%, #d74f2a 100%);
  overflow: hidden;
}

.rail::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 999px;
  background: rgba(255, 252, 244, 0.76);
}

.center-line,
.needle {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 8px;
  width: 3px;
  height: 32px;
  border-radius: 8px;
}

.center-line {
  background: rgba(23, 32, 29, 0.28);
}

.needle {
  background: #17201d;
  transition: transform 90ms linear;
}

.volume {
  display: grid;
  gap: 10px;
}

.volume-label {
  color: #5d6964;
  font-size: 0.92rem;
  font-weight: 700;
}

.volume-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(23, 32, 29, 0.12);
  overflow: hidden;
}

.volume-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #277a73;
  transition: width 80ms linear;
}

.error {
  margin: 18px 0 0;
  color: #9f2f1a;
  font-weight: 700;
}

@media (max-width: 560px) {
  .page-shell {
    padding: 14px;
  }

  .topbar,
  .controls {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .listen-button,
  .language-switch {
    width: 100%;
  }

  .language-switch {
    grid-template-columns: repeat(2, 1fr);
  }

  .readout {
    min-height: 170px;
  }

  .tuning-meter {
    gap: 10px;
  }

}
</style>
