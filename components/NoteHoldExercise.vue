<script setup lang="ts">
import { midiToDisplayNoteName, midiToNoteName, type NoteNotation } from '~/composables/useNoteMath'
import type { Language } from '~/utils/i18n'

const props = defineProps<{
  isListening: boolean
  pressedMidi: number | null
  language: Language
  noteNotation: NoteNotation
}>()

const emit = defineEmits<{
  noteStart: [note: string, midi: number]
  noteEnd: [note: string, midi: number]
  targetChange: [midi: number | null]
}>()

type NoteHoldPhase = 'idle' | 'awaiting-note' | 'playing'

const phase = ref<NoteHoldPhase>('idle')
const targetMidi = ref<number | null>(null)
const soundingMidi = ref<number | null>(null)
const currentRepeat = ref(0)
let isCancelled = false
let runId = 0

const repeatCount = 5
const playNoteMs = 2000
const pauseMs = 3000

const labels = computed(() => props.language === 'ru'
  ? {
      train: 'Тренировать ноту',
      stop: 'Стоп',
      playOneNote: 'Сыграй одну ноту',
      listen: 'Слушай'
    }
  : {
      train: 'Train note',
      stop: 'Stop',
      playOneNote: 'Play one note',
      listen: 'Listen'
    })

const isRunning = computed(() => phase.value !== 'idle')
const actionLabel = computed(() => isRunning.value ? labels.value.stop : labels.value.train)
const prompt = computed(() => {
  if (phase.value === 'awaiting-note') {
    return labels.value.playOneNote
  }

  if (phase.value === 'playing' && targetMidi.value !== null) {
    return `${labels.value.listen}: ${midiToDisplayNoteName(targetMidi.value, props.noteNotation)} ${currentRepeat.value}/${repeatCount}`
  }

  return ''
})

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resetExercise() {
  isCancelled = true
  runId += 1

  if (soundingMidi.value !== null) {
    emit('noteEnd', midiToNoteName(soundingMidi.value), soundingMidi.value)
    soundingMidi.value = null
  }

  phase.value = 'idle'
  targetMidi.value = null
  currentRepeat.value = 0
  emit('targetChange', null)
}

async function playHoldSequence(midi: number) {
  phase.value = 'playing'
  const noteName = midiToNoteName(midi)
  const activeRunId = runId

  for (let repeat = 1; repeat <= repeatCount; repeat += 1) {
    if (isCancelled || activeRunId !== runId) {
      return
    }

    currentRepeat.value = repeat
    soundingMidi.value = midi
    emit('noteStart', noteName, midi)
    await sleep(playNoteMs)

    if (activeRunId !== runId) {
      return
    }

    emit('noteEnd', noteName, midi)
    soundingMidi.value = null

    if (repeat < repeatCount) {
      await sleep(pauseMs)
    }
  }

  if (activeRunId === runId) {
    resetExercise()
  }
}

function startAwaitingNote() {
  if (!props.isListening) {
    return
  }

  isCancelled = false
  runId += 1
  phase.value = 'awaiting-note'
  targetMidi.value = null
  currentRepeat.value = 0
  emit('targetChange', null)
}

function toggleExercise() {
  if (isRunning.value) {
    resetExercise()
    return
  }

  startAwaitingNote()
}

watch(
  () => props.pressedMidi,
  (nextMidi) => {
    if (phase.value !== 'awaiting-note' || nextMidi === null) {
      return
    }

    targetMidi.value = nextMidi
    emit('targetChange', nextMidi)
    emit('noteEnd', midiToNoteName(nextMidi), nextMidi)
    void playHoldSequence(nextMidi)
  }
)

watch(
  () => props.isListening,
  (nextIsListening) => {
    if (!nextIsListening) {
      resetExercise()
    }
  }
)

onBeforeUnmount(resetExercise)
</script>

<template>
  <div class="note-hold-exercise">
    <button type="button" :disabled="!isListening" @click="toggleExercise">
      {{ actionLabel }}
    </button>

    <p v-if="prompt" class="note-hold-prompt">
      {{ prompt }}
    </p>
  </div>
</template>

<style scoped>
.note-hold-exercise {
  display: grid;
  justify-items: center;
  gap: 6px;
}

.note-hold-exercise button {
  min-height: 34px;
  min-width: 148px;
  padding: 0 14px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px;
  color: #fffaf0;
  background: #277a73;
  cursor: pointer;
  font-weight: 900;
}

.note-hold-exercise button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.note-hold-prompt {
  min-height: 18px;
  margin: 0;
  color: #52615c;
  font-size: 0.78rem;
  font-weight: 850;
}

@media (max-width: 560px) {
  .note-hold-exercise button {
    min-height: 32px;
  }

  .note-hold-prompt {
    font-size: 0.72rem;
  }
}
</style>
