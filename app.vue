<script setup lang="ts">
import { copy, supportedLanguages } from '~/utils/i18n'
import { useAppPreferences } from '~/composables/useAppPreferences'
import { useInactiveTabStop } from '~/composables/useInactiveTabStop'
import { useKeyboardAudio } from '~/composables/useKeyboardAudio'
import {
  midiToDisplayNoteName,
  noteNotationLabels,
  noteNotations,
} from '~/composables/useNoteMath'
import { usePitchDetector } from '~/composables/usePitchDetector'
import { useSelectedNoteControls } from '~/composables/useSelectedNoteControls'
import { useStablePitchReadout } from '~/composables/useStablePitchReadout'
import type { PianoKeyboardApi } from '~/components/PianoKeyboard.vue'
import type { KeyboardInstrumentId, SamplePresetId } from '~/utils/instrumentSamples'
import type { MicrophoneSettingKey } from '~/composables/usePitchDetector'

const runtimeConfig = useRuntimeConfig()
const { $trackHumanAction } = useNuxtApp()

const {
  language,
  noteNotation,
  selectedMidi,
  shouldShowWarmupReport,
  shouldShowExercises,
  shouldShowKeyboardControls,
  shouldShowVolumeMeter,
  setLanguage,
  setNoteNotation,
  setShowWarmupReport,
  setShowExercises,
  setShowKeyboardControls,
  setShowVolumeMeter,
  setSelectedMidi,
  persistKeyboardInstrument,
  persistSamplePreset,
  restoreAppPreferences
} = useAppPreferences()

const {
  isListening,
  frequency,
  note,
  octave,
  activeMidi,
  cents,
  volume,
  errorMessage,
  microphoneDevices,
  deviceId: microphoneDeviceId,
  echoCancellation: microphoneEchoCancellation,
  noiseSuppression: microphoneNoiseSuppression,
  autoGainControl: microphoneAutoGainControl,
  inputGain: microphoneInputGain,
  minimumRms: microphoneMinimumRms,
  diagnosticReport: microphoneDiagnosticReport,
  restoreMicrophoneSettings,
  setMicrophoneSetting,
  startListening: startPitchListening,
  startMicBanLayoutHack,
  stopListening
} = usePitchDetector()

const {
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
  unlockKeyboardAudio,
  preloadKeyboardSampler,
  disposeKeyboardAudio
} = useKeyboardAudio()

const t = computed(() => copy[language.value])
const appVersion = computed(() => String(runtimeConfig.public.appVersion || 'dev'))
const isMicBanLayoutHackEnabled = computed(() => String(runtimeConfig.public.micBanLayoutHack) === '1')
const repoUrl = 'https://github.com/NaMax66/vocal-warm'
const selectedDisplayNoteLabel = computed(() => midiToDisplayNoteName(selectedMidi.value, noteNotation.value))
const noteHoldTargetMidi = ref<number | null>(null)
const warmupTargetMidis = ref<number[]>([])
const warmupActiveMidi = ref<number | null>(null)
const tuningTargetMidi = computed(() => noteHoldTargetMidi.value ?? warmupActiveMidi.value)
const pianoKeyboard = ref<PianoKeyboardApi | null>(null)
const micHealthDetectionTarget = 10
const micHealthVolumeThreshold = computed(() => microphoneMinimumRms.value)
const micHealthTimeoutMs = 15000
let micHealthDetectedFrames = 0
let micHealthMaxVolume = 0
let micHealthObservationId = 0
let micHealthTimeoutId: ReturnType<typeof setTimeout> | null = null

const volumeSteps = computed(() => Math.min(12, Math.round(volume.value * 90)))
const {
  stableOctave,
  stableDisplayNote,
  isPitchReadoutVisible,
  disposeStablePitchReadout
} = useStablePitchReadout(note, octave, noteNotation)
const { startInactiveTabStop, disposeInactiveTabStop } = useInactiveTabStop(isListening, stopListening)
const {
  stepSelectedMidi,
  holdSelectedNote,
  releaseSelectedNote,
  startSelectedNoteControls,
  disposeSelectedNoteControls
} = useSelectedNoteControls(
  isListening,
  selectedMidi,
  setSelectedMidi,
  startKeyboardNote,
  stopKeyboardNote,
  (midi) => pianoKeyboard.value?.scrollMidiIntoView(midi, {
    onlyIfNeeded: true,
    marginPx: 44
  })
)

function setNoteHoldTargetMidi(midi: number | null) {
  noteHoldTargetMidi.value = midi
}

function setWarmupTargets(midis: number[], activeMidi: number | null) {
  warmupTargetMidis.value = midis
  warmupActiveMidi.value = activeMidi
}

async function selectKeyboardInstrument(instrumentId: KeyboardInstrumentId) {
  persistKeyboardInstrument(instrumentId)
  await setKeyboardInstrument(instrumentId)
}

async function selectSamplePreset(presetId: SamplePresetId) {
  persistSamplePreset(presetId)
  await setSamplePreset(presetId)
}

async function startListening() {
  $trackHumanAction?.('start_listening')

  await unlockKeyboardAudio().catch((error) => {
    console.warn('Keyboard audio unlock failed', error)
  })

  await startPitchListening(t.value.micError, preloadKeyboardSampler)

  if (isMicBanLayoutHackEnabled.value && !isListening.value) {
    startMicBanLayoutHack(preloadKeyboardSampler)
  }

  if (!isListening.value) {
    trackMicHealth('start_failed', {
      error: errorMessage.value || null
    })
    return
  }

  beginMicHealthObservation()
}

function changeMicrophoneSetting(key: MicrophoneSettingKey, value: string | number | boolean) {
  setMicrophoneSetting(key, value)
}

async function applyMicrophoneSettings() {
  if (isListening.value) {
    stopListening()
  }

  await startListening()
}

function beginMicHealthObservation() {
  const observationId = micHealthObservationId + 1

  micHealthObservationId = observationId
  micHealthDetectedFrames = 0
  micHealthMaxVolume = 0
  clearMicHealthTimeout()

  micHealthTimeoutId = setTimeout(() => {
    finishMicHealthObservation(observationId, 'no_signal_timeout')
  }, micHealthTimeoutMs)

  return observationId
}

function finishMicHealthObservation(
  observationId: number,
  outcome: 'signal_confirmed' | 'start_failed' | 'no_signal_timeout',
  properties: Record<string, unknown> = {}
) {
  if (observationId !== micHealthObservationId) {
    return
  }

  micHealthObservationId += 1
  clearMicHealthTimeout()
  trackMicHealth(outcome, properties)
}

function trackMicHealth(
  outcome: 'signal_confirmed' | 'start_failed' | 'no_signal_timeout',
  properties: Record<string, unknown> = {}
) {
  $trackHumanAction?.('microphone_health', {
    outcome,
    detectedFrames: micHealthDetectedFrames,
    maxVolume: Number(micHealthMaxVolume.toFixed(4)),
    volumeThreshold: micHealthVolumeThreshold.value,
    timeoutMs: micHealthTimeoutMs,
    ...properties
  })
}

function clearMicHealthTimeout() {
  if (!micHealthTimeoutId) {
    return
  }

  clearTimeout(micHealthTimeoutId)
  micHealthTimeoutId = null
}

function focusWarmupKeyboardRange(fromMidi: number, toMidi: number) {
  pianoKeyboard.value?.scrollMidiRangeIntoView(fromMidi, toMidi, {
    marginPx: 48
  })
}

onMounted(() => {
  restoreMicrophoneSettings()
  restoreAppPreferences({
    restoreKeyboardInstrument,
    restoreSamplePreset
  })

  startSelectedNoteControls()
  startInactiveTabStop()
})

watch([isListening, frequency, volume], ([nextListening, nextFrequency, nextVolume]) => {
  if (!micHealthTimeoutId || !nextListening) {
    return
  }

  micHealthMaxVolume = Math.max(micHealthMaxVolume, nextVolume)

  if (!nextFrequency || nextVolume < micHealthVolumeThreshold.value) {
    return
  }

  micHealthDetectedFrames += 1
  if (micHealthDetectedFrames >= micHealthDetectionTarget) {
    finishMicHealthObservation(micHealthObservationId, 'signal_confirmed')
  }
})

useHead(() => ({
  title: `VocalWarm - ${t.value.title}`,
  htmlAttrs: {
    lang: language.value
  }
}))

onBeforeUnmount(() => {
  disposeSelectedNoteControls()
  disposeStablePitchReadout()
  disposeInactiveTabStop()
  disposeKeyboardAudio()
  clearMicHealthTimeout()
  stopListening()
})
</script>

<template>
  <main class="page-shell">
    <section class="tuner" :class="{ inactive: !isListening }">
      <AppHeader
        :title="t.title"
        :stop-label="t.stop"
        :is-listening="isListening"
        @stop="stopListening"
      >
        <template #controls>
          <HeaderSoundSettings
            :language="language"
            :languages="supportedLanguages"
            :note-notation="noteNotation"
            :note-notations="noteNotations"
            :note-notation-labels="noteNotationLabels"
            :language-label="t.languageLabel"
            :note-notation-label="t.noteNotationLabel"
            :sound-settings-label="t.soundSettings"
            :sound-description="t.soundDescription"
            :sound-loading-label="t.soundLoading"
            :show-warmup-report-label="t.showWarmupReport"
            :show-exercises-label="t.showExercises"
            :show-keyboard-controls-label="t.showKeyboardControls"
            :show-volume-meter-label="t.showVolumeMeter"
            :keyboard-instruments="keyboardInstruments"
            :keyboard-instrument-labels="t.keyboardInstruments"
            :sound-presets="samplePresets"
            :sound-preset-labels="t.soundPresets"
            :selected-keyboard-instrument-id="selectedKeyboardInstrumentId"
            :selected-sample-preset-id="selectedSamplePresetId"
            :is-keyboard-sampler-loading="isKeyboardSamplerLoading"
            :should-show-warmup-report="shouldShowWarmupReport"
            :should-show-exercises="shouldShowExercises"
            :should-show-keyboard-controls="shouldShowKeyboardControls"
            :should-show-volume-meter="shouldShowVolumeMeter"
            :microphone-text="t.microphone"
            :microphone-devices="microphoneDevices"
            :microphone-device-id="microphoneDeviceId"
            :microphone-echo-cancellation="microphoneEchoCancellation"
            :microphone-noise-suppression="microphoneNoiseSuppression"
            :microphone-auto-gain-control="microphoneAutoGainControl"
            :microphone-input-gain="microphoneInputGain"
            :microphone-minimum-rms="microphoneMinimumRms"
            :is-listening="isListening"
            :microphone-diagnostic-report="microphoneDiagnosticReport"
            :microphone-current-rms="volume"
            :microphone-current-frequency="frequency"
            @set-language="setLanguage"
            @set-note-notation="setNoteNotation"
            @set-keyboard-instrument="selectKeyboardInstrument"
            @set-sample-preset="selectSamplePreset"
            @set-show-warmup-report="setShowWarmupReport"
            @set-show-exercises="setShowExercises"
            @set-show-keyboard-controls="setShowKeyboardControls"
            @set-show-volume-meter="setShowVolumeMeter"
            @set-microphone-setting="changeMicrophoneSetting"
            @apply-microphone-settings="applyMicrophoneSettings"
          />

          <HeaderInfoMenu
            :title="t.title"
            :repo-url="repoUrl"
            :app-version="appVersion"
            :sample-attribution="t.sampleAttribution"
          />
        </template>
      </AppHeader>

      <div class="tuner-content">

        <VolumeMeter
          v-if="shouldShowVolumeMeter"
          :label="t.volume"
          :active-steps="volumeSteps"
        />

        <PitchReadout
          :note="stableDisplayNote"
          :octave="stableOctave"
          :is-visible="isPitchReadoutVisible"
        />

        <div v-if="shouldShowExercises" class="exercise-block">
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
            @warmup-range-focus="focusWarmupKeyboardRange"
            @targets-change="setWarmupTargets"
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
        </div>

        <TuningMeter
          :label="t.meterLabel"
          :cents="cents"
          :frequency="frequency"
          :target-midi="tuningTargetMidi"
        />

        <div class="keyboard-dock">
          <PianoKeyboard
            ref="pianoKeyboard"
            :detected-midi="activeMidi"
            :pressed-midi="pressedMidi"
            :selected-midi="selectedMidi"
            :warmup-target-midis="warmupTargetMidis"
            :warmup-active-midi="warmupActiveMidi"
            :note-notation="noteNotation"
            :label="t.keyboardLabel"
            @note-start="startKeyboardNote"
            @note-end="stopKeyboardNote"
          />

          <KeyboardControls
            v-if="shouldShowKeyboardControls"
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

.exercise-block {
  display: grid;
  align-content: center;
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

@media (orientation: landscape) and (max-height: 560px) and (pointer: coarse) {
  html,
  body {
    height: auto;
    min-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .page-shell {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  .tuner {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }

  .tuner-content {
    grid-template-rows:
      minmax(34px, auto)
      minmax(58px, auto)
      auto
      minmax(42px, auto)
      auto;
    gap: 4px;
  }

  .keyboard-dock {
    position: relative;
    z-index: 5;
  }

}

@media (max-width: 560px) {
  .page-shell {
    padding: 0;
  }

  .tuner {
    --tuner-padding: 0px;

    min-height: 100dvh;
    border-right: 0;
    border-left: 0;
    border-radius: 0;
  }

  .tuner .tuner-content {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .tuner .keyboard-dock {
    order: 10;
    flex: 0 0 auto;
    align-self: stretch;
    width: 100%;
    margin-top: auto;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  }

  .tuner .error {
    order: 9;
  }
}
</style>
