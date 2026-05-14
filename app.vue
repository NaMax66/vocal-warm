<script setup lang="ts">
import { copy, supportedLanguages, type Language } from '~/utils/i18n'
import { useKeyboardAudio } from '~/composables/useKeyboardAudio'
import {
  keyboardMaxMidi,
  keyboardMinMidi,
  midiToDisplayNoteName,
  midiToNoteName,
  noteNameToDisplayName,
  noteNotationLabels,
  noteNotations,
  type NoteNotation
} from '~/composables/useNoteMath'
import { usePitchDetector } from '~/composables/usePitchDetector'
import { isPianoSamplePresetId, type PianoSamplePresetId } from '~/utils/pianoSamples'

const language = ref<Language>('en')
const noteNotation = ref<NoteNotation>('letter')
const selectedMidi = ref(60)
const shouldShowWarmupReport = ref(false)
const isSliderHolding = ref(false)
const runtimeConfig = useRuntimeConfig()

const {
  isListening,
  frequency,
  note,
  octave,
  activeMidi,
  cents,
  volume,
  errorMessage,
  startListening: startPitchListening,
  startMicBanLayoutHack,
  stopListening
} = usePitchDetector()

const {
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
} = useKeyboardAudio()

const t = computed(() => copy[language.value])
const appVersion = computed(() => String(runtimeConfig.public.appVersion || 'dev'))
const isMicBanLayoutHackEnabled = computed(() => String(runtimeConfig.public.micBanLayoutHack) === '1')
const repoUrl = 'https://github.com/NaMax66/vocal-warm'
const selectedNoteLabel = computed(() => midiToNoteName(selectedMidi.value))
const selectedDisplayNoteLabel = computed(() => midiToDisplayNoteName(selectedMidi.value, noteNotation.value))
const stableNote = ref('--')
const stableOctave = ref('')
const stableDisplayNote = computed(() => (
  stableNote.value === '--' ? stableNote.value : noteNameToDisplayName(stableNote.value, noteNotation.value)
))
const isPitchReadoutVisible = ref(false)
const noteHoldTargetMidi = ref<number | null>(null)
let stableNoteTimeoutId: ReturnType<typeof setTimeout> | null = null
let stableNoteHideTimeoutId: ReturnType<typeof setTimeout> | null = null
const pitchReadoutGraceMs = 900
const inactiveTabStopDelayMs = 30000
let inactiveTabTimeoutId: ReturnType<typeof setTimeout> | null = null

const volumeSteps = computed(() => Math.min(12, Math.round(volume.value * 90)))

function clearStableNoteTimeout() {
  if (!stableNoteTimeoutId) {
    return
  }

  clearTimeout(stableNoteTimeoutId)
  stableNoteTimeoutId = null
}

function clearStableNoteHideTimeout() {
  if (!stableNoteHideTimeoutId) {
    return
  }

  clearTimeout(stableNoteHideTimeoutId)
  stableNoteHideTimeoutId = null
}

function clearInactiveTabTimeout() {
  if (!inactiveTabTimeoutId) {
    return
  }

  clearTimeout(inactiveTabTimeoutId)
  inactiveTabTimeoutId = null
}

function hideStableNoteAfterGrace() {
  clearStableNoteHideTimeout()

  stableNoteHideTimeoutId = setTimeout(() => {
    isPitchReadoutVisible.value = false
    stableNote.value = '--'
    stableOctave.value = ''
    stableNoteHideTimeoutId = null
  }, pitchReadoutGraceMs)
}

function resolveLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function setLanguage(nextLanguage: Language) {
  language.value = nextLanguage
  localStorage.setItem('vocalwarm-language', nextLanguage)
}

function setNoteNotation(nextNotation: NoteNotation) {
  noteNotation.value = nextNotation
  localStorage.setItem('vocalwarm-note-notation', nextNotation)
}

function setShowWarmupReport(value: boolean) {
  shouldShowWarmupReport.value = value
  localStorage.setItem('vocalwarm-show-warmup-report', value ? '1' : '0')
}

function setNoteHoldTargetMidi(midi: number | null) {
  noteHoldTargetMidi.value = midi
}

async function selectPianoSamplePreset(presetId: PianoSamplePresetId) {
  localStorage.setItem('vocalwarm-piano-preset', presetId)
  await setPianoSamplePreset(presetId)
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

async function stepSelectedMidi(direction: number) {
  selectedMidi.value = Math.max(
    keyboardMinMidi,
    Math.min(keyboardMaxMidi, selectedMidi.value + direction)
  )
  localStorage.setItem('vocalwarm-selected-midi', String(selectedMidi.value))

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

  if (isMicBanLayoutHackEnabled.value && !isListening.value) {
    startMicBanLayoutHack(preloadPianoSampler)
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (!isListening.value || isEditableTarget(event.target)) {
    return
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    stepSelectedMidi(-1)
    return
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    stepSelectedMidi(1)
    return
  }

  if (event.code === 'Space' && !event.repeat) {
    event.preventDefault()
    holdSelectedNote()
  }
}

function handleGlobalKeyup(event: KeyboardEvent) {
  if (!isListening.value || isEditableTarget(event.target)) {
    return
  }

  if (event.code === 'Space') {
    event.preventDefault()
    releaseSelectedNote()
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    clearInactiveTabTimeout()
    return
  }

  if (!isListening.value || inactiveTabTimeoutId) {
    return
  }

  inactiveTabTimeoutId = setTimeout(() => {
    inactiveTabTimeoutId = null

    if (document.visibilityState === 'hidden' && isListening.value) {
      stopListening()
    }
  }, inactiveTabStopDelayMs)
}

watch([note, octave], ([nextNote, nextOctave]) => {
  clearStableNoteTimeout()

  if (nextNote === '--' || !nextOctave) {
    hideStableNoteAfterGrace()
    return
  }

  if (nextNote === stableNote.value && nextOctave === stableOctave.value) {
    clearStableNoteHideTimeout()
    isPitchReadoutVisible.value = true
    return
  }

  hideStableNoteAfterGrace()

  stableNoteTimeoutId = setTimeout(() => {
    if (note.value !== nextNote || octave.value !== nextOctave) {
      return
    }

    clearStableNoteHideTimeout()
    stableNote.value = nextNote
    stableOctave.value = nextOctave
    isPitchReadoutVisible.value = true
    stableNoteTimeoutId = null
  }, 1000)
})

onMounted(() => {
  const savedLanguage = localStorage.getItem('vocalwarm-language') as Language | null
  language.value = savedLanguage && supportedLanguages.includes(savedLanguage)
    ? savedLanguage
    : resolveLanguage(navigator.language)

  const savedNoteNotation = localStorage.getItem('vocalwarm-note-notation') as NoteNotation | null
  if (savedNoteNotation && noteNotations.includes(savedNoteNotation)) {
    noteNotation.value = savedNoteNotation
  }

  shouldShowWarmupReport.value = localStorage.getItem('vocalwarm-show-warmup-report') === '1'

  const savedPianoPresetId = localStorage.getItem('vocalwarm-piano-preset')
  if (isPianoSamplePresetId(savedPianoPresetId)) {
    restorePianoSamplePreset(savedPianoPresetId)
  }

  const savedSelectedMidi = Number(localStorage.getItem('vocalwarm-selected-midi'))
  if (
    Number.isInteger(savedSelectedMidi)
    && savedSelectedMidi >= keyboardMinMidi
    && savedSelectedMidi <= keyboardMaxMidi
  ) {
    selectedMidi.value = savedSelectedMidi
  }

  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('keyup', handleGlobalKeyup)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

useHead(() => ({
  title: `VocalWarm - ${t.value.title}`,
  htmlAttrs: {
    lang: language.value
  }
}))

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('keyup', handleGlobalKeyup)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  clearStableNoteTimeout()
  clearStableNoteHideTimeout()
  clearInactiveTabTimeout()
  disposeKeyboardAudio()
  stopListening()
})
</script>

<template>
  <main class="page-shell">
    <section class="tuner" :class="{ inactive: !isListening }">
      <AppHeader
        :title="t.title"
        :language="language"
        :languages="supportedLanguages"
        :note-notation="noteNotation"
        :note-notations="noteNotations"
        :note-notation-labels="noteNotationLabels"
        :repo-url="repoUrl"
        :app-version="appVersion"
        :stop-label="t.stop"
        :is-listening="isListening"
        :sound-settings-label="t.soundSettings"
        :sound-presets="pianoSamplePresets"
        :sound-preset-labels="t.soundPresets"
        :sound-description="t.soundDescription"
        :sound-loading-label="t.soundLoading"
        :selected-piano-preset-id="selectedPianoPresetId"
        :is-piano-sampler-loading="isPianoSamplerLoading"
        :should-show-warmup-report="shouldShowWarmupReport"
        @set-language="setLanguage"
        @set-note-notation="setNoteNotation"
        @set-show-warmup-report="setShowWarmupReport"
        @stop="stopListening"
        @set-piano-sample-preset="selectPianoSamplePreset"
      />

      <div class="tuner-content">

        <VolumeMeter :label="t.volume" :active-steps="volumeSteps" />

        <PitchReadout
          :note="stableDisplayNote"
          :octave="stableOctave"
          :is-visible="isPitchReadoutVisible"
        />

        <WarmupProgram
          :is-listening="isListening"
          :frequency="frequency"
          :cents="cents"
          :volume="volume"
          :language="language"
          :note-notation="noteNotation"
          :should-show-report="shouldShowWarmupReport"
          @note-start="startKeyboardNote"
          @note-end="stopKeyboardNote"
        />

        <NoteHoldExercise
          :is-listening="isListening"
          :pressed-midi="pressedMidi"
          :language="language"
          :note-notation="noteNotation"
          @note-start="startKeyboardNote"
          @note-end="stopKeyboardNote"
          @target-change="setNoteHoldTargetMidi"
        />

        <TuningMeter
          :label="t.meterLabel"
          :cents="cents"
          :frequency="frequency"
          :target-midi="noteHoldTargetMidi"
        />

        <div class="keyboard-dock">
          <PianoKeyboard
            :detected-midi="activeMidi"
            :pressed-midi="pressedMidi"
            :selected-midi="selectedMidi"
            :note-notation="noteNotation"
            :label="t.keyboardLabel"
            @note-start="startKeyboardNote"
            @note-end="stopKeyboardNote"
          />

          <KeyboardControls
            :keyboard-label="t.keyboardControl"
            :selected-note-text="t.selectedNote"
            :selected-note-label="selectedDisplayNoteLabel"
            @step-selected-midi="stepSelectedMidi"
            @hold-selected-note="holdSelectedNote"
            @release-selected-note="releaseSelectedNote"
          />
        </div>

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
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}

.page-shell {
  position: relative;
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(244, 241, 232, 0.92), rgba(222, 232, 226, 0.88)),
    url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=80') center / cover;
}

.tuner {
  --tuner-padding: clamp(10px, 5vw, 20px);

  position: relative;
  width: 100%;
  max-width: 960px;
  min-width: 0;
  padding: var(--tuner-padding);
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

.tuner.inactive .brand-header {
  z-index: 90;
  pointer-events: none;
}

.tuner.inactive .controls,
.tuner.inactive .volume,
.tuner.inactive .readout,
.tuner.inactive .tuning-meter,
.tuner.inactive .keyboard-wrap,
.tuner.inactive .keyboard-control-pad {
  filter: blur(2px);
  transform: scale(0.998);
  transition:
    filter 220ms ease,
    transform 220ms ease;
}

.tuner-content {
  position: relative;
}

.keyboard-dock {
  display: grid;
  gap: 8px;
}

.error {
  margin: 18px 0 0;
  color: #9f2f1a;
  font-weight: 700;
}

@media (max-width: 900px), (max-width: 1200px) and (max-height: 900px) {
  html,
  body {
    height: 100%;
    overflow: hidden;
  }

  .page-shell {
    height: 100dvh;
    min-height: 100dvh;
    padding: 0;
    place-items: stretch;
  }

  .tuner {
    --tuner-padding: clamp(10px, 2vw, 16px);

    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    width: 100%;
    max-width: none;
    height: 100dvh;
    min-height: 0;
    border: 0;
    border-radius: 0;
  }

  .tuner-content {
    display: grid;
    grid-template-rows:
      minmax(42px, 0.48fr)
      minmax(86px, 0.9fr)
      auto
      minmax(52px, 0.45fr)
      auto;
    align-items: center;
    min-height: 0;
  }

  .keyboard-dock {
    align-self: end;
    gap: 6px;
    margin: 0 calc(var(--tuner-padding) * -1) calc(var(--tuner-padding) * -1);
    padding: 0 14px 12px;
    background: rgba(255, 252, 244, 0.9);
    box-shadow: 0 -12px 34px rgba(31, 41, 37, 0.12);
    backdrop-filter: blur(12px) saturate(1.08);
  }
}

@media (max-width: 560px) {
  .page-shell {
    padding: 0;
  }

  .tuner {
    --tuner-padding: 0px;

    min-height: 100vh;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }
}
</style>
