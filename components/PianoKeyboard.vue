<script setup lang="ts">
const props = defineProps<{
  activeMidi: number | null
  label: string
}>()

const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const blackNoteNames = new Set(['C#', 'D#', 'F#', 'G#', 'A#'])

const pianoKeys = computed(() => {
  let whiteCount = 0

  return Array.from({ length: 60 }, (_, index) => {
    const midi = 36 + index
    const noteName = noteNames[((midi % 12) + 12) % 12]
    const isBlack = blackNoteNames.has(noteName)
    const afterWhiteCount = whiteCount

    if (!isBlack) {
      whiteCount += 1
    }

    return {
      midi,
      noteName,
      label: `${noteName}${Math.floor(midi / 12) - 1}`,
      isBlack,
      afterWhiteCount,
      isActive: props.activeMidi === midi
    }
  })
})

const whiteKeys = computed(() => pianoKeys.value.filter((key) => !key.isBlack))
const blackKeys = computed(() => pianoKeys.value.filter((key) => key.isBlack))
</script>

<template>
  <div class="keyboard-wrap" :aria-label="label">
    <div class="keyboard">
      <div class="white-keys">
        <button
          v-for="key in whiteKeys"
          :key="key.midi"
          type="button"
          class="piano-key white"
          :class="{ active: key.isActive }"
          :aria-label="key.label"
          :aria-current="key.isActive ? 'true' : undefined"
        >
          <span>{{ key.label }}</span>
        </button>
      </div>

      <div class="black-keys" aria-hidden="true">
        <button
          v-for="key in blackKeys"
          :key="key.midi"
          type="button"
          class="piano-key black"
          :class="{ active: key.isActive }"
          :style="{ '--after-white-count': key.afterWhiteCount }"
          tabindex="-1"
        >
          <span>{{ key.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.keyboard-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 4px -8px 24px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px;
  scrollbar-color: rgba(23, 32, 29, 0.28) transparent;
  scrollbar-width: thin;
}

.keyboard {
  --white-key-width: 34px;
  --black-key-width: 22px;
  position: relative;
  display: block;
  width: max-content;
  min-width: 100%;
  height: 132px;
  padding: 0 2px;
}

.white-keys {
  display: flex;
  align-items: stretch;
  width: max-content;
  height: 132px;
}

.black-keys {
  position: absolute;
  inset: 0 auto auto 2px;
  height: 82px;
}

.piano-key {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border: 0;
  cursor: default;
  letter-spacing: 0;
  transition:
    background 120ms ease,
    box-shadow 120ms ease,
    color 120ms ease,
    transform 120ms ease;
}

.piano-key.white {
  z-index: 1;
  width: var(--white-key-width);
  height: 132px;
  border: 1px solid rgba(23, 32, 29, 0.18);
  border-left-width: 0;
  border-radius: 0 0 6px 6px;
  color: #52615c;
  background: #fffdf8;
  box-shadow: inset 0 -10px 16px rgba(23, 32, 29, 0.05);
}

.piano-key.white:first-child {
  border-left-width: 1px;
}

.piano-key.black {
  position: absolute;
  left: calc((var(--white-key-width) * var(--after-white-count)) - (var(--black-key-width) / 2));
  z-index: 2;
  width: var(--black-key-width);
  height: 82px;
  border-radius: 0 0 5px 5px;
  color: rgba(255, 250, 240, 0.72);
  background: #17201d;
  box-shadow: 0 7px 14px rgba(23, 32, 29, 0.24);
}

.piano-key.active {
  color: #fffaf0;
  background: #d74f2a;
  box-shadow:
    0 0 0 3px rgba(215, 79, 42, 0.22),
    0 10px 28px rgba(215, 79, 42, 0.32);
  transform: translateY(-2px);
}

.piano-key span {
  display: block;
  padding-bottom: 10px;
  font-size: 0.68rem;
  font-weight: 850;
  line-height: 1;
  pointer-events: none;
}

.piano-key.black span {
  padding-bottom: 8px;
  font-size: 0.58rem;
}

@media (max-width: 560px) {
  .keyboard-wrap {
    margin-right: -14px;
    margin-left: -14px;
    padding-right: 14px;
    padding-left: 14px;
  }

  .keyboard {
    --white-key-width: 32px;
    --black-key-width: 21px;
    min-width: 1120px;
  }
}
</style>
