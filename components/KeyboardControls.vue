<script setup lang="ts">
defineProps<{
  selectedMidi: number
  keyboardLabel: string
  selectedNoteText: string
  selectedNoteLabel: string
  holdHint: string
}>()

defineEmits<{
  selectedMidiInput: [event: Event]
  holdSelectedNote: []
  releaseSelectedNote: []
}>()
</script>

<template>
  <div class="note-slider">
    <div class="slider-label">
      <span>{{ keyboardLabel }}</span>
      <strong>{{ selectedNoteText }}: {{ selectedNoteLabel }}</strong>
    </div>
    <input
      :value="selectedMidi"
      type="range"
      min="36"
      max="95"
      step="1"
      :aria-label="keyboardLabel"
      @input="$emit('selectedMidiInput', $event)"
      @keydown.space.prevent="$emit('holdSelectedNote')"
      @keyup.space.prevent="$emit('releaseSelectedNote')"
      @blur="$emit('releaseSelectedNote')"
    >
    <p>{{ holdHint }}</p>
  </div>
</template>

<style scoped>
.note-slider {
  position: relative;
  z-index: 3;
  display: grid;
  gap: 10px;
  margin: -8px 0 22px;
}

.slider-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.slider-label,
.note-slider p {
  color: #5d6964;
  font-size: 0.92rem;
  font-weight: 800;
}

.slider-label strong {
  color: #17201d;
}

.note-slider input {
  width: 100%;
  accent-color: #d74f2a;
  cursor: ew-resize;
}

.note-slider p {
  margin: 0;
  font-size: 0.82rem;
}

@media (max-width: 560px) {
  .slider-label {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
