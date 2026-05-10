<script setup lang="ts">
import { copy, supportedLanguages, type Language } from '~/utils/i18n'
import { useKeyboardAudio } from '~/composables/useKeyboardAudio'
import { midiToNoteName } from '~/composables/useNoteMath'
import { usePitchDetector } from '~/composables/usePitchDetector'

const language = ref<Language>('en')
const selectedMidi = ref(60)
const isSliderHolding = ref(false)

const {
  isListening,
  statusKey,
  frequency,
  note,
  octave,
  activeMidi,
  cents,
  volume,
  errorMessage,
  startListening: startPitchListening,
  stopListening
} = usePitchDetector()

const {
  pressedMidi,
  startKeyboardNote,
  stopKeyboardNote,
  preloadPianoSampler,
  disposeKeyboardAudio
} = useKeyboardAudio()

const t = computed(() => copy[language.value])
const status = computed(() => t.value.status[statusKey.value])
const displayActiveMidi = computed(() => activeMidi.value ?? pressedMidi.value)
const selectedNoteLabel = computed(() => midiToNoteName(selectedMidi.value))

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

async function handleSelectedMidiInput(event: Event) {
  selectedMidi.value = Number((event.target as HTMLInputElement).value)

  if (isSliderHolding.value) {
    await startKeyboardNote(selectedNoteLabel.value, selectedMidi.value)
  }
}

async function holdSelectedNote() {
  if (isSliderHolding.value) {
    return
  }

  isSliderHolding.value = true
  await startKeyboardNote(selectedNoteLabel.value, selectedMidi.value)
}

async function releaseSelectedNote() {
  isSliderHolding.value = false
  await stopKeyboardNote()
}

async function startListening() {
  await startPitchListening(t.value.micError, preloadPianoSampler)
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
  disposeKeyboardAudio()
  stopListening()
})
</script>

<template>
  <main class="page-shell">
    <section class="tuner" :class="{ inactive: !isListening }">
      <div class="tuner-content" :inert="!isListening" :aria-hidden="!isListening">
        <AppHeader
          :title="t.title"
          :language="language"
          :languages="supportedLanguages"
          :stop-label="t.stop"
          :is-listening="isListening"
          @set-language="setLanguage"
          @stop="stopListening"
        />

        <PitchReadout
          :note="note"
          :octave="octave"
          :frequency="frequency"
          :cents-label="centsLabel"
        />

        <TuningMeter :label="t.meterLabel" :needle-style="meterStyle" />

        <PianoKeyboard
          :active-midi="displayActiveMidi"
          :label="t.keyboardLabel"
          @note-start="startKeyboardNote"
          @note-end="stopKeyboardNote"
        />

        <KeyboardControls
          :selected-midi="selectedMidi"
          :keyboard-label="t.keyboardControl"
          :selected-note-text="t.selectedNote"
          :selected-note-label="selectedNoteLabel"
          :hold-hint="t.holdHint"
          @selected-midi-input="handleSelectedMidiInput"
          @hold-selected-note="holdSelectedNote"
          @release-selected-note="releaseSelectedNote"
        />

        <VolumeMeter :label="t.volume" :status="status" :bar-style="volumeStyle" />

        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </div>

      <StartOverlay
        v-if="!isListening"
        :kicker="t.inactiveSession"
        :action="t.start"
        :hint="t.startHint"
        @start="startListening"
      />
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

.tuner.inactive .piano-key.black {
  color: rgba(255, 250, 240, 0.28);
  background: rgba(23, 32, 29, 0.56);
  box-shadow: 0 4px 12px rgba(23, 32, 29, 0.1);
}

.tuner.inactive .piano-key.white {
  color: rgba(82, 97, 92, 0.42);
  background: rgba(255, 253, 248, 0.66);
}

.tuner.inactive .topbar {
  z-index: auto;
}

.tuner.inactive .topbar > :first-child {
  position: relative;
  z-index: 30;
}

.tuner-content {
  position: relative;
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
}
</style>
