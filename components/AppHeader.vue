<script setup lang="ts">
import type { Language } from '~/utils/i18n'

defineProps<{
  title: string
  language: Language
  languages: readonly Language[]
  stopLabel: string
  isListening: boolean
}>()

defineEmits<{
  setLanguage: [language: Language]
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
  min-height: 152px;
}

.controls {
  position: absolute;
  top: calc(var(--tuner-padding) * -1);
  right: calc(var(--tuner-padding) * -1);
  display: flex;
  align-items: center;
  gap: 0;
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

.language-switch {
  display: inline-grid;
  min-height: 42px;
  padding: 4px;
  border: 0;
  border-left: 1px solid rgba(23, 32, 29, 0.12);
  border-bottom: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 0 8px 0 8px;
  background: rgba(23, 32, 29, 0.08);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.38),
    0 8px 20px rgba(31, 41, 37, 0.08);
}

.language-switch {
  grid-template-columns: repeat(2, 44px);
  min-height: 48px;
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

.listen-button {
  min-width: 104px;
  min-height: 48px;
  border: 0;
  border-radius: 0;
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
    min-height: 220px;
  }

  .controls {
    top: calc(var(--tuner-padding) * -1);
    right: calc(var(--tuner-padding) * -1);
    bottom: auto;
    width: 100%;
    align-items: stretch;
    flex-direction: row;
    justify-content: flex-end;
  }

  .language-switch {
    width: min(180px, 58vw);
  }

  .language-switch {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
