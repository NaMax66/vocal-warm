<script setup lang="ts">
import type { Language } from '~/utils/i18n'
import type { NoteNotation } from '~/composables/useNoteMath'
import type { KeyboardInstrumentId, SamplePresetId } from '~/utils/instrumentSamples'

defineProps<{
  title: string
  language: Language
  languages: readonly Language[]
  noteNotation: NoteNotation
  noteNotations: readonly NoteNotation[]
  noteNotationLabels: Record<NoteNotation, string>
  repoUrl: string
  appVersion: string
  stopLabel: string
  isListening: boolean
  languageLabel: string
  noteNotationLabel: string
  soundSettingsLabel: string
  soundDescription: string
  soundLoadingLabel: string
  showWarmupReportLabel: string
  sampleAttribution: string
  keyboardInstruments: readonly { id: KeyboardInstrumentId }[]
  keyboardInstrumentLabels: Record<KeyboardInstrumentId, string>
  soundPresets: readonly { id: SamplePresetId }[]
  soundPresetLabels: Record<SamplePresetId, string>
  selectedKeyboardInstrumentId: KeyboardInstrumentId
  selectedSamplePresetId: SamplePresetId
  isKeyboardSamplerLoading: boolean
  shouldShowWarmupReport: boolean
}>()

defineEmits<{
  setLanguage: [language: Language]
  setNoteNotation: [notation: NoteNotation]
  stop: []
  setKeyboardInstrument: [instrumentId: KeyboardInstrumentId]
  setSamplePreset: [presetId: SamplePresetId]
  setShowWarmupReport: [value: boolean]
}>()
</script>

<template>
  <div class="topbar" :class="{ listening: isListening }">
    <div v-if="!isListening" class="brand-header">
      <p class="eyebrow">
        <span>VocalWarm</span>
      </p>
      <h1>{{ title }}</h1>
    </div>

    <div class="controls">
      <div class="controls-row">
        <button v-if="isListening" class="listen-button" type="button" @click="$emit('stop')">
          {{ stopLabel }}
        </button>

        <HeaderSoundSettings
          :language="language"
          :languages="languages"
          :note-notation="noteNotation"
          :note-notations="noteNotations"
          :note-notation-labels="noteNotationLabels"
          :language-label="languageLabel"
          :note-notation-label="noteNotationLabel"
          :sound-settings-label="soundSettingsLabel"
          :sound-description="soundDescription"
          :sound-loading-label="soundLoadingLabel"
          :show-warmup-report-label="showWarmupReportLabel"
          :keyboard-instruments="keyboardInstruments"
          :keyboard-instrument-labels="keyboardInstrumentLabels"
          :sound-presets="soundPresets"
          :sound-preset-labels="soundPresetLabels"
          :selected-keyboard-instrument-id="selectedKeyboardInstrumentId"
          :selected-sample-preset-id="selectedSamplePresetId"
          :is-keyboard-sampler-loading="isKeyboardSamplerLoading"
          :should-show-warmup-report="shouldShowWarmupReport"
          @set-language="$emit('setLanguage', $event)"
          @set-note-notation="$emit('setNoteNotation', $event)"
          @set-keyboard-instrument="$emit('setKeyboardInstrument', $event)"
          @set-sample-preset="$emit('setSamplePreset', $event)"
          @set-show-warmup-report="$emit('setShowWarmupReport', $event)"
        />

        <HeaderInfoMenu
          :title="title"
          :repo-url="repoUrl"
          :app-version="appVersion"
          :sample-attribution="sampleAttribution"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 3;
  min-height: 188px;
}

.topbar.listening {
  min-height: 0;
}

.brand-header {
  position: relative;
  z-index: 70;
  display: grid;
  justify-items: center;
  width: 100%;
  padding-right: clamp(18px, 5vw, 56px);
  padding-left: clamp(18px, 5vw, 56px);
  padding-top: clamp(34px, 7vw, 64px);
  text-align: center;
}

.controls {
  position: absolute;
  top: calc(var(--tuner-padding) * -1);
  right: calc(var(--tuner-padding) * -1);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  width: max-content;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: max-content;
}

.eyebrow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  max-width: min(100%, 860px);
  font-size: clamp(2.25rem, 7.1vw, 5.25rem);
  line-height: 0.95;
  letter-spacing: 0;
  text-wrap: balance;
}

.listen-button {
  min-width: 112px;
  min-height: 48px;
  border: 0;
  border-radius: 0 0 0 8px;
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

@media (max-width: 560px) {
  .topbar {
    min-height: 152px;
  }

  .topbar.listening {
    min-height: 0;
  }

  h1 {
    font-size: clamp(2.45rem, 14.5vw, 3.75rem);
  }

  .brand-header {
    padding-right: 18px;
    padding-left: 18px;
    padding-top: 42px;
  }

  .controls {
    top: calc(var(--tuner-padding) * -1);
    right: calc(var(--tuner-padding) * -1);
    bottom: auto;
    width: max-content;
    align-items: stretch;
    justify-content: flex-end;
  }

  .controls-row {
    width: max-content;
  }

  .listen-button {
    min-width: 86px;
  }
}
</style>
