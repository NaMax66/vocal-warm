<script setup lang="ts">
import type { Language } from '~/utils/i18n'
import type { SoundMode } from '~/composables/useKeyboardAudio'

defineProps<{
  title: string
  language: Language
  languages: readonly Language[]
  soundMode: SoundMode
  soundModes: readonly SoundMode[]
  soundLabel: string
  midiLabel: string
  pianoLabel: string
  stopLabel: string
  isListening: boolean
}>()

defineEmits<{
  setLanguage: [language: Language]
  setSoundMode: [mode: SoundMode]
  stop: []
}>()
</script>

<template>
  <div class="topbar">
    <div>
      <p class="eyebrow">VocalWarm</p>
      <h1>{{ title }}</h1>
    </div>

    <div class="controls">
      <div class="language-switch" aria-label="Interface language">
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

      <div class="sound-switch" :aria-label="soundLabel">
        <button
          v-for="mode in soundModes"
          :key="mode"
          type="button"
          :class="{ active: soundMode === mode }"
          :aria-pressed="soundMode === mode"
          @click="$emit('setSoundMode', mode)"
        >
          {{ mode === 'midi' ? midiLabel : pianoLabel }}
        </button>
      </div>

      <button v-if="isListening" class="listen-button" type="button" @click="$emit('stop')">
        {{ stopLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.topbar {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
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

.language-switch,
.sound-switch {
  display: inline-grid;
  min-height: 42px;
  padding: 4px;
  border: 1px solid rgba(23, 32, 29, 0.14);
  border-radius: 8px;
  background: rgba(23, 32, 29, 0.07);
}

.language-switch {
  grid-template-columns: repeat(2, 44px);
  min-height: 48px;
}

.sound-switch {
  grid-template-columns: repeat(2, minmax(78px, 1fr));
}

.language-switch button,
.sound-switch button {
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

.sound-switch button.active {
  color: #fffaf0;
  background: #277a73;
  box-shadow: 0 4px 14px rgba(31, 41, 37, 0.13);
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

@media (max-width: 560px) {
  .topbar,
  .controls {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .listen-button,
  .language-switch,
  .sound-switch {
    width: 100%;
  }

  .language-switch,
  .sound-switch {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
