<script setup lang="ts">
import { usePopoverDisclosure } from '~/composables/usePopoverDisclosure'

defineProps<{
  title: string
  repoUrl: string
  appVersion: string
  sampleAttribution: string
}>()

const { isOpen, root, toggle } = usePopoverDisclosure()
</script>

<template>
  <div ref="root" class="info-menu">
    <button
      class="icon-button info-button"
      type="button"
      aria-label="Application information"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <span aria-hidden="true">i</span>
    </button>

    <div v-if="isOpen" class="menu-popover info-popover" aria-label="Application information">
      <strong>VocalWarm</strong>
      <span>{{ title }}</span>
      <span>{{ appVersion }}</span>
      <span>{{ sampleAttribution }}</span>
      <a :href="repoUrl" target="_blank" rel="noreferrer">repo</a>
      <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>
    </div>
  </div>
</template>

<style scoped>
.info-menu {
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
</style>
