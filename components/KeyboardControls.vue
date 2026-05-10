<script setup lang="ts">
defineProps<{
  keyboardLabel: string
  selectedNoteText: string
  selectedNoteLabel: string
}>()

defineEmits<{
  stepSelectedMidi: [direction: number]
  holdSelectedNote: []
  releaseSelectedNote: []
}>()
</script>

<template>
  <div class="keyboard-control-pad" :aria-label="keyboardLabel">
    <div class="control-buttons">
      <button
        class="control-key arrow-key"
        type="button"
        :aria-label="`${keyboardLabel}: previous`"
        @click="$emit('stepSelectedMidi', -1)"
      >
        <span aria-hidden="true">&larr;</span>
      </button>

      <button
        class="control-key space-key"
        type="button"
        :aria-label="`${selectedNoteText}: ${selectedNoteLabel}`"
        @pointerdown.prevent="$emit('holdSelectedNote')"
        @pointerup="$emit('releaseSelectedNote')"
        @pointercancel="$emit('releaseSelectedNote')"
        @pointerleave="$emit('releaseSelectedNote')"
        @keydown.space.prevent="$emit('holdSelectedNote')"
        @keyup.space.prevent="$emit('releaseSelectedNote')"
        @blur="$emit('releaseSelectedNote')"
      >
        <span class="space-label">Space</span>
        <strong>{{ selectedNoteLabel }}</strong>
      </button>

      <button
        class="control-key arrow-key"
        type="button"
        :aria-label="`${keyboardLabel}: next`"
        @click="$emit('stepSelectedMidi', 1)"
      >
        <span aria-hidden="true">&rarr;</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.keyboard-control-pad {
  position: relative;
  z-index: 3;
  display: grid;
  gap: 8px;
  margin: -8px 0 22px;
}

.control-buttons {
  display: grid;
  grid-template-columns: 58px minmax(180px, 1fr) 58px;
  align-items: center;
  gap: 8px;
}

.control-key {
  min-width: 0;
  min-height: 50px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px;
  color: #17201d;
  background: rgba(255, 250, 240, 0.88);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 8px 20px rgba(31, 41, 37, 0.08);
  cursor: pointer;
  font-weight: 900;
  transition:
    transform 140ms ease,
    background 140ms ease,
    box-shadow 140ms ease;
}

.control-key:hover,
.control-key:focus-visible {
  background: #fffaf0;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 12px 26px rgba(31, 41, 37, 0.12);
  outline: 0;
  transform: translateY(-1px);
}

.control-key:active {
  transform: translateY(1px);
}

.arrow-key {
  font-size: 1.35rem;
}

.space-key {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #fffaf0;
  background: #277a73;
}

.space-key:hover,
.space-key:focus-visible {
  background: #20655f;
}

.space-label {
  font-size: 0.72rem;
  text-transform: uppercase;
}

.space-key strong {
  font-size: 1.12rem;
}

@media (max-width: 560px) {
  .keyboard-control-pad {
    position: fixed;
    right: 5px;
    bottom: 5px;
    left: 5px;
    z-index: 35;
    margin: 0;
    padding: 10px;
    border-radius: 8px;
    background: rgba(255, 252, 244, 0.9);
    box-shadow: 0 14px 36px rgba(31, 41, 37, 0.16);
    backdrop-filter: blur(12px) saturate(1.08);
  }

  .control-buttons {
    grid-template-columns: 56px minmax(0, 1fr) 56px;
    gap: 8px;
  }

  .control-key {
    min-height: 60px;
  }
}
</style>
