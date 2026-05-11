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
const repoUrl = 'https://github.com/NaMax66/vocal-warm'
const selectedNoteLabel = computed(() => midiToNoteName(selectedMidi.value))
const selectedDisplayNoteLabel = computed(() => midiToDisplayNoteName(selectedMidi.value, noteNotation.value))
const stableNote = ref('--')
const stableOctave = ref('')
const stableDisplayNote = computed(() => (
  stableNote.value === '--' ? stableNote.value : noteNameToDisplayName(stableNote.value, noteNotation.value)
))
const isPitchReadoutVisible = ref(false)
let stableNoteTimeoutId: ReturnType<typeof setTimeout> | null = null
const pitchMeterMaxOffsetPx = 24
const pitchMeterSmoothnessMs = 500
const pitchMeterGreenZoneCents = 10
const pitchMeterCentsRange = 50
const pitchMeterOffsetCents = computed(() => Math.max(
  -pitchMeterCentsRange,
  Math.min(pitchMeterCentsRange, cents.value)
))

const meterStyle = computed(() => ({
  '--pitch-offset': `${Math.max(
    -pitchMeterMaxOffsetPx,
    Math.min(
      pitchMeterMaxOffsetPx,
      (pitchMeterOffsetCents.value / pitchMeterCentsRange) * pitchMeterMaxOffsetPx
    )
  )}px`,
  '--pitch-motion-duration': `${pitchMeterSmoothnessMs}ms`
}))

const volumeSteps = computed(() => Math.min(12, Math.round(volume.value * 90)))
const isMeterAligned = computed(() => (
  Boolean(frequency.value) && Math.abs(pitchMeterOffsetCents.value) <= pitchMeterGreenZoneCents
))

function clearStableNoteTimeout() {
  if (!stableNoteTimeoutId) {
    return
  }

  clearTimeout(stableNoteTimeoutId)
  stableNoteTimeoutId = null
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

watch([note, octave], ([nextNote, nextOctave]) => {
  clearStableNoteTimeout()
  isPitchReadoutVisible.value = false

  if (nextNote === '--' || !nextOctave) {
    stableNote.value = '--'
    stableOctave.value = ''
    return
  }

  stableNoteTimeoutId = setTimeout(() => {
    if (note.value !== nextNote || octave.value !== nextOctave) {
      return
    }

    stableNote.value = nextNote
    stableOctave.value = nextOctave
    isPitchReadoutVisible.value = true
    stableNoteTimeoutId = null
  }, 3000)
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
  clearStableNoteTimeout()
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
          @set-language="setLanguage"
          @set-note-notation="setNoteNotation"
          @stop="stopListening"
          @set-piano-sample-preset="selectPianoSamplePreset"
        />

        <VolumeMeter :label="t.volume" :active-steps="volumeSteps" />

        <PitchReadout
          :note="stableDisplayNote"
          :octave="stableOctave"
          :is-visible="isPitchReadoutVisible"
        />

        <TuningMeter :label="t.meterLabel" :meter-style="meterStyle" :is-aligned="isMeterAligned" />

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
  --tuner-padding: clamp(22px, 5vw, 42px);

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

.tuner.inactive .topbar > :first-child {
  position: relative;
  z-index: 70;
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
    padding: 5px;
  }

  .tuner {
    --tuner-padding: 0px;

    min-height: 100vh;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .tuner-content {
    padding-bottom: 120px;
  }
}
</style>
