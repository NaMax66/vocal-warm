<script setup lang="ts">
import {
  keyboardMaxMidi,
  keyboardMinMidi,
  midiToDisplayNoteName,
  midiToNoteName,
  noteNames,
  type NoteNotation
} from '~/composables/useNoteMath'

const props = defineProps<{
  detectedMidi: number | null
  pressedMidi: number | null
  selectedMidi: number
  noteNotation: NoteNotation
  label: string
}>()

const emit = defineEmits<{
  noteStart: [note: string, midi: number]
  noteEnd: [note: string, midi: number]
}>()

function startNote(note: string, midi: number) {
  emit('noteStart', note, midi)
}

function endNote(note: string, midi: number) {
  emit('noteEnd', note, midi)
}

const blackNoteNames = new Set(['C#', 'D#', 'F#', 'G#', 'A#'])
const keyboardWrap = ref<HTMLElement | null>(null)
const keyboardScrollStorageKey = 'vocalwarm-keyboard-scroll-left'
const instantVoiceReleaseMidi = ref<number | null>(null)
let instantVoiceReleaseFrame = 0

watch(
  () => props.detectedMidi,
  (nextMidi, previousMidi) => {
    if (previousMidi === null || previousMidi === nextMidi) {
      return
    }

    cancelAnimationFrame(instantVoiceReleaseFrame)
    instantVoiceReleaseMidi.value = previousMidi
    instantVoiceReleaseFrame = requestAnimationFrame(() => {
      instantVoiceReleaseMidi.value = null
    })
  }
)

const pianoKeys = computed(() => {
  let whiteCount = 0

  return Array.from({ length: keyboardMaxMidi - keyboardMinMidi + 1 }, (_, index) => {
    const midi = keyboardMinMidi + index
    const noteName = noteNames[((midi % 12) + 12) % 12]
    const isBlack = blackNoteNames.has(noteName)
    const afterWhiteCount = whiteCount

    if (!isBlack) {
      whiteCount += 1
    }

    return {
      midi,
      noteName,
      soundLabel: midiToNoteName(midi),
      displayLabel: midiToDisplayNoteName(midi, props.noteNotation),
      isBlack,
      afterWhiteCount,
      isDetected: props.detectedMidi === midi,
      isPressed: props.pressedMidi === midi,
      isSelected: props.selectedMidi === midi,
      isCombined: props.detectedMidi === midi && props.pressedMidi === midi,
      isVoiceRelease: instantVoiceReleaseMidi.value === midi
    }
  })
})

const whiteKeys = computed(() => pianoKeys.value.filter((key) => !key.isBlack))
const blackKeys = computed(() => pianoKeys.value.filter((key) => key.isBlack))

function centerKeyboardScroll() {
  if (!keyboardWrap.value) {
    return
  }

  const savedScrollLeft = Number(localStorage.getItem(keyboardScrollStorageKey))
  keyboardWrap.value.scrollLeft = Number.isFinite(savedScrollLeft)
    ? savedScrollLeft
    : (keyboardWrap.value.scrollWidth - keyboardWrap.value.clientWidth) / 2
}

function saveKeyboardScroll() {
  if (!keyboardWrap.value) {
    return
  }

  localStorage.setItem(keyboardScrollStorageKey, String(Math.round(keyboardWrap.value.scrollLeft)))
}

onMounted(async () => {
  await nextTick()
  centerKeyboardScroll()
  keyboardWrap.value?.addEventListener('scroll', saveKeyboardScroll, { passive: true })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(instantVoiceReleaseFrame)
  keyboardWrap.value?.removeEventListener('scroll', saveKeyboardScroll)
})
</script>

<template>
  <div ref="keyboardWrap" class="keyboard-wrap" :aria-label="label">
    <div class="keyboard">
      <div class="white-keys">
        <button
          v-for="key in whiteKeys"
          :key="key.midi"
          type="button"
          class="piano-key white"
          :class="{
            detected: key.isDetected,
            pressed: key.isPressed,
            selected: key.isSelected,
            combined: key.isCombined,
            'voice-release': key.isVoiceRelease
          }"
          :aria-label="key.displayLabel"
          :aria-current="key.isDetected || key.isPressed ? 'true' : undefined"
          @pointerdown.prevent="startNote(key.soundLabel, key.midi)"
          @pointerup="endNote(key.soundLabel, key.midi)"
          @pointercancel="endNote(key.soundLabel, key.midi)"
          @pointerleave="endNote(key.soundLabel, key.midi)"
          @contextmenu.prevent
          @keydown.space.prevent="startNote(key.soundLabel, key.midi)"
          @keyup.space.prevent="endNote(key.soundLabel, key.midi)"
        >
          <span>{{ key.displayLabel }}</span>
        </button>
      </div>

      <div class="black-keys">
        <button
          v-for="key in blackKeys"
          :key="key.midi"
          type="button"
          class="piano-key black"
          :class="{
            detected: key.isDetected,
            pressed: key.isPressed,
            selected: key.isSelected,
            combined: key.isCombined,
            'voice-release': key.isVoiceRelease
          }"
          :style="{ '--after-white-count': key.afterWhiteCount }"
          :aria-label="key.displayLabel"
          :aria-current="key.isDetected || key.isPressed ? 'true' : undefined"
          @pointerdown.prevent="startNote(key.soundLabel, key.midi)"
          @pointerup="endNote(key.soundLabel, key.midi)"
          @pointercancel="endNote(key.soundLabel, key.midi)"
          @pointerleave="endNote(key.soundLabel, key.midi)"
          @contextmenu.prevent
          @keydown.space.prevent="startNote(key.soundLabel, key.midi)"
          @keyup.space.prevent="endNote(key.soundLabel, key.midi)"
        >
          <span>{{ key.displayLabel }}</span>
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
  margin: 4px 0 24px;
  overflow-x: auto;
  overflow-y: hidden;
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
  height: 145px;
}

.white-keys {
  display: flex;
  align-items: stretch;
  width: max-content;
  height: 145px;
}

.black-keys {
  position: absolute;
  inset: 0 auto auto 0;
  height: 90px;
}

.piano-key {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  border: 0;
  cursor: pointer;
  letter-spacing: 0;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 500ms ease,
    box-shadow 500ms ease,
    color 500ms ease,
    transform 500ms ease;
}

.piano-key:active {
  transform: translateY(1px);
}

.piano-key.white {
  z-index: 1;
  width: var(--white-key-width);
  height: 145px;
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
  height: 90px;
  border-radius: 0 0 5px 5px;
  color: rgba(255, 250, 240, 0.72);
  background: #17201d;
  box-shadow: 0 7px 14px rgba(23, 32, 29, 0.24);
}

.piano-key.detected {
  color: #fffaf0;
  background: #277a73;
  box-shadow:
    0 0 0 3px rgba(39, 122, 115, 0.22),
    0 10px 28px rgba(39, 122, 115, 0.3);
  transform: translateY(-2px);
}

.piano-key.voice-release:not(.pressed):not(.combined) {
  transition: none;
}

.piano-key.pressed {
  color: #fffaf0;
  background: #d74f2a;
  box-shadow:
    0 0 0 3px rgba(215, 79, 42, 0.22),
    0 10px 28px rgba(215, 79, 42, 0.32);
  transform: translateY(-2px);
}

.piano-key.combined {
  color: #fffaf0;
  background: #8b6fc8;
  box-shadow:
    0 0 0 3px rgba(139, 111, 200, 0.24),
    0 10px 30px rgba(139, 111, 200, 0.34);
  transform: translateY(-2px);
}

.piano-key.selected::after {
  content: "x";
  position: absolute;
  top: 8px;
  left: 50%;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: #fffaf0;
  background: #d74f2a;
  box-shadow: 0 2px 6px rgba(159, 47, 26, 0.32);
  font-size: 13px;
  font-weight: 900;
  line-height: 1;
  transform: translateX(-50%);
  pointer-events: none;
}

.piano-key.black.selected::after {
  top: 6px;
  width: 12px;
  height: 12px;
  font-size: 11px;
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
    margin: 0 0 12px;
  }

  .keyboard {
    --white-key-width: 32px;
    --black-key-width: 21px;
    height: 136px;
    min-width: 1120px;
  }

  .white-keys {
    height: 136px;
  }

  .black-keys {
    height: 84px;
  }

  .piano-key.white {
    height: 136px;
  }

  .piano-key.black {
    height: 84px;
  }
}
</style>
