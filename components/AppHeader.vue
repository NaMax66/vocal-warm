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

const isSoundMenuOpen = ref(false)
const isInfoMenuOpen = ref(false)
const soundMenu = ref<HTMLElement | null>(null)
const infoMenu = ref<HTMLElement | null>(null)

function closeMenusOnOutsideClick(event: PointerEvent) {
  const target = event.target as Node

  if (soundMenu.value && !soundMenu.value.contains(target)) {
    isSoundMenuOpen.value = false
  }

  if (infoMenu.value && !infoMenu.value.contains(target)) {
    isInfoMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', closeMenusOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeMenusOnOutsideClick)
})
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

        <div ref="soundMenu" class="settings-menu">
          <button
            class="icon-button settings-button"
            :class="{ loading: isKeyboardSamplerLoading }"
            type="button"
            :aria-label="soundSettingsLabel"
            :aria-expanded="isSoundMenuOpen"
            @click="isSoundMenuOpen = !isSoundMenuOpen"
          >
            <span aria-hidden="true">&#9881;</span>
          </button>

          <span v-if="isKeyboardSamplerLoading" class="sound-loading">
            {{ soundLoadingLabel }}
          </span>

          <div v-if="isSoundMenuOpen" class="menu-popover settings-popover" :aria-label="soundSettingsLabel">
            <section class="settings-section">
              <h2>{{ languageLabel }}</h2>
              <div class="settings-segment" aria-label="Interface language">
                <button
                  v-for="nextLanguage in languages"
                  :key="nextLanguage"
                  type="button"
                  :class="{ active: language === nextLanguage }"
                  :aria-pressed="language === nextLanguage"
                  @click="$emit('setLanguage', nextLanguage)"
                >
                  {{ nextLanguage.toUpperCase() }}
                </button>
              </div>
            </section>

            <section class="settings-section">
              <h2>{{ noteNotationLabel }}</h2>
              <div class="settings-segment" aria-label="Note notation">
                <button
                  v-for="nextNotation in noteNotations"
                  :key="nextNotation"
                  type="button"
                  :class="{ active: noteNotation === nextNotation }"
                  :aria-pressed="noteNotation === nextNotation"
                  @click="$emit('setNoteNotation', nextNotation)"
                >
                  {{ noteNotationLabels[nextNotation] }}
                </button>
              </div>
            </section>

            <section class="settings-section">
              <h2>{{ soundSettingsLabel }}</h2>
              <p>{{ soundDescription }}</p>

              <div class="settings-segment" aria-label="Keyboard instrument">
                <button
                  v-for="instrument in keyboardInstruments"
                  :key="instrument.id"
                  type="button"
                  :aria-pressed="selectedKeyboardInstrumentId === instrument.id"
                  :class="{ active: selectedKeyboardInstrumentId === instrument.id }"
                  :disabled="isKeyboardSamplerLoading"
                  @click="
                    $emit('setKeyboardInstrument', instrument.id);
                    isSoundMenuOpen = true
                  "
                >
                  {{ keyboardInstrumentLabels[instrument.id] }}
                </button>
              </div>

              <div class="sample-options">
                <button
                  v-for="preset in soundPresets"
                  :key="preset.id"
                  type="button"
                  :aria-pressed="selectedSamplePresetId === preset.id"
                  :class="{ active: selectedSamplePresetId === preset.id }"
                  :disabled="isKeyboardSamplerLoading"
                  @click="
                    $emit('setSamplePreset', preset.id);
                    isSoundMenuOpen = true
                  "
                >
                  {{ soundPresetLabels[preset.id] }}
                </button>
              </div>
            </section>

            <section class="settings-section">
              <label class="settings-checkbox">
                <input
                  type="checkbox"
                  :checked="shouldShowWarmupReport"
                  @change="$emit('setShowWarmupReport', ($event.target as HTMLInputElement).checked)"
                >
                <span>{{ showWarmupReportLabel }}</span>
              </label>
            </section>
          </div>
        </div>

        <div ref="infoMenu" class="info-menu">
          <button
            class="icon-button info-button"
            type="button"
            aria-label="Application information"
            :aria-expanded="isInfoMenuOpen"
            @click="isInfoMenuOpen = !isInfoMenuOpen"
          >
            <span aria-hidden="true">i</span>
          </button>

          <div v-if="isInfoMenuOpen" class="menu-popover info-popover" aria-label="Application information">
            <strong>VocalWarm</strong>
            <span>{{ title }}</span>
            <span>{{ appVersion }}</span>
            <span>{{ sampleAttribution }}</span>
            <a :href="repoUrl" target="_blank" rel="noreferrer">repo</a>
            <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>
          </div>
        </div>
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

.info-menu,
.settings-menu {
  position: relative;
  display: grid;
  justify-items: end;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 48px;
  border: 0;
  border-radius: 0;
  color: #17201d;
  background: rgba(255, 250, 240, 0.94);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.58),
    0 8px 18px rgba(31, 41, 37, 0.1);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
}

.info-button {
  font-weight: 900;
  font-style: italic;
}

.icon-button:hover,
.icon-button:focus-visible {
  color: #fffaf0;
  background: #277a73;
  outline: 0;
}

.icon-button.loading {
  color: #fffaf0;
  background: #277a73;
}

.icon-button.loading span {
  animation: sound-spin 900ms linear infinite;
}

.sound-loading {
  position: absolute;
  top: 54px;
  right: 0;
  width: max-content;
  max-width: 132px;
  padding: 5px 7px;
  border-radius: 8px;
  color: #277a73;
  background: rgba(255, 250, 240, 0.96);
  box-shadow: 0 8px 18px rgba(31, 41, 37, 0.1);
  font-size: 0.68rem;
  font-weight: 850;
  line-height: 1;
}

.menu-popover {
  position: absolute;
  top: 54px;
  right: 0;
  z-index: 20;
  display: grid;
  min-width: 132px;
  padding: 5px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px 0 8px 8px;
  background: rgba(255, 252, 244, 0.98);
  box-shadow: 0 14px 34px rgba(31, 41, 37, 0.18);
}

.info-popover {
  min-width: 240px;
  max-width: min(300px, calc(100vw - 20px));
  gap: 6px;
  color: #52615c;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.2;
}

.info-popover strong {
  color: #17201d;
  font-size: 0.9rem;
}

.info-popover a {
  color: #277a73;
  text-decoration: none;
}

.info-popover a:hover {
  text-decoration: underline;
}

.settings-popover {
  right: -34px;
  width: min(360px, calc(100vw - 20px));
  gap: 12px;
  padding: 12px;
}

.settings-section {
  display: grid;
  gap: 7px;
}

.settings-section h2 {
  margin: 0;
  color: #17201d;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0;
}

.settings-section p {
  margin: 0;
  color: #5d6964;
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.3;
}

.settings-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #17201d;
  font-size: 0.78rem;
  font-weight: 850;
}

.settings-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #277a73;
}

.settings-segment,
.sample-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.sample-options {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.settings-segment button,
.sample-options button {
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  color: #52615c;
  background: rgba(23, 32, 29, 0.06);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 850;
  text-align: center;
}

.settings-segment button:disabled,
.sample-options button:disabled {
  cursor: wait;
  opacity: 0.56;
}

.settings-segment button:hover,
.settings-segment button:focus-visible,
.settings-segment button.active,
.sample-options button:hover,
.sample-options button:focus-visible,
.sample-options button.active {
  color: #17201d;
  background: #fffaf0;
  box-shadow: 0 5px 14px rgba(31, 41, 37, 0.12);
  outline: 0;
}

@keyframes sound-spin {
  to {
    transform: rotate(360deg);
  }
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

  .settings-popover {
    right: -34px;
  }

  .sample-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
