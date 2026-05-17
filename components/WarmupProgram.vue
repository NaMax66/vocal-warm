<script setup lang="ts">
import {
  frequencyToMidi,
  frequencyToMidiCents,
  keyboardMaxMidi,
  keyboardMinMidi,
  midiToDisplayNoteName,
  midiToNoteName,
  type NoteNotation
} from '~/composables/useNoteMath'
import type { Language } from '~/utils/i18n'

const props = defineProps<{
  isListening: boolean
  frequency: number | null
  cents: number
  volume: number
  language: Language
  noteNotation: NoteNotation
  shouldShowReport: boolean
}>()

const emit = defineEmits<{
  noteStart: [note: string, midi: number]
  noteEnd: [note: string, midi: number]
  warmupRangeFocus: [fromMidi: number, toMidi: number]
}>()

type WarmupDirection = 'up' | 'down'
type WarmupPhase = 'idle' | 'playing' | 'singing' | 'done'

type SungSample = {
  frequency: number
  midi: number
  centsFromTarget: number
  nearestCents: number
  volume: number
}

type SungNoteRecord = {
  targetMidi: number
  targetLabel: string
  heard: boolean
  samples: SungSample[]
}

type WarmupStepRecord = {
  round: number
  direction: WarmupDirection
  targetMidis: number[]
  sungNotes: SungNoteRecord[]
}

const playNoteMs = 650
const betweenNotesMs = 130
const listenWindowMs = 4200
const singMatchCents = 55
const singHoldSamples = 3
const sampleIntervalMs = 90
const defaultRoundCount = 6
const warmupStepIntervals = [0, 2, 4, 5, 7, 9, 11, 12]
const minStartMidi = Math.max(keyboardMinMidi, 48)
const maxPatternLength = 5
const maxStartMidi = Math.min(keyboardMaxMidi - warmupStepIntervals[maxPatternLength - 1], 76)

const selectedStartMidi = ref(60)
const selectedPatternLength = ref(3)
const phase = ref<WarmupPhase>('idle')
const currentPrompt = ref('')
const currentRound = ref(0)
const reportText = ref('')
const isReportOpen = ref(false)
const isReportCopied = ref(false)
let isCancelled = false
let copiedTimeoutId: ReturnType<typeof setTimeout> | null = null

const startOptions = computed(() => (
  Array.from({ length: maxStartMidi - minStartMidi + 1 }, (_, index) => minStartMidi + index)
))
const patternLengthOptions = [3, 4, 5]

const canStart = computed(() => props.isListening && phase.value !== 'playing' && phase.value !== 'singing')
const isRunning = computed(() => phase.value === 'playing' || phase.value === 'singing')
const labels = computed(() => props.language === 'ru'
  ? {
      start: 'Старт',
      warmup: 'Распевка',
      stop: 'Стоп',
      report: 'Отчет распевки',
      close: 'Закрыть',
      copy: 'Копировать',
      copied: 'Скопировано',
      notes: 'Нот',
      listen: 'Слушай',
      sing: 'Повтори'
    }
  : {
      start: 'Start',
      warmup: 'Warmup',
      stop: 'Stop',
      report: 'Warmup report',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied',
      notes: 'Notes',
      listen: 'Listen',
      sing: 'Sing'
    })

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPattern(startMidi: number, direction: WarmupDirection) {
  const upPattern = warmupStepIntervals
    .slice(0, selectedPatternLength.value)
    .map((interval) => startMidi + interval)

  return direction === 'up' ? upPattern : [...upPattern].reverse()
}

function getDetectedSampleForTarget(targetMidi: number): SungSample | null {
  if (!props.frequency || !Number.isFinite(props.frequency)) {
    return null
  }

  const midi = frequencyToMidi(props.frequency)
  const centsFromTarget = frequencyToMidiCents(props.frequency, targetMidi)

  return {
    frequency: props.frequency,
    midi,
    centsFromTarget,
    nearestCents: props.cents,
    volume: props.volume
  }
}

function isPatternNoteMatched(samples: SungSample[]) {
  return samples.length >= singHoldSamples
}

function isSungPatternComplete(records: SungNoteRecord[]) {
  return records.every((record) => record.heard)
}

async function playPattern(midis: number[]) {
  phase.value = 'playing'

  for (const midi of midis) {
    if (isCancelled) {
      return
    }

    const noteName = midiToNoteName(midi)
    currentPrompt.value = `${labels.value.listen}: ${midiToDisplayNoteName(midi, props.noteNotation)}`
    emit('noteStart', noteName, midi)
    await sleep(playNoteMs)
    emit('noteEnd', noteName, midi)
    await sleep(betweenNotesMs)
  }
}

async function awaitSungPattern(midis: number[], round: number, direction: WarmupDirection) {
  phase.value = 'singing'
  const records: SungNoteRecord[] = midis.map((midi) => ({
    targetMidi: midi,
    targetLabel: midiToDisplayNoteName(midi, props.noteNotation),
    heard: false,
    samples: []
  }))
  const startedAt = performance.now()

  while (!isCancelled && performance.now() - startedAt < listenWindowMs) {
    const activeRecord = records.find((record) => !record.heard)

    if (!activeRecord) {
      break
    }

    currentPrompt.value = `${labels.value.sing}: ${activeRecord.targetLabel}`
    const sample = getDetectedSampleForTarget(activeRecord.targetMidi)

    if (sample && Math.abs(sample.centsFromTarget) <= singMatchCents) {
      activeRecord.samples.push(sample)
      activeRecord.heard = isPatternNoteMatched(activeRecord.samples)
    }

    if (isSungPatternComplete(records)) {
      break
    }

    await sleep(sampleIntervalMs)
  }

  return {
    round,
    direction,
    targetMidis: midis,
    sungNotes: records
  }
}

function summarizeSungRecord(record: SungNoteRecord) {
  if (!record.samples.length) {
    return `${record.targetLabel}: not detected`
  }

  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const centsValues = record.samples.map((sample) => sample.centsFromTarget)
  const volumeValues = record.samples.map((sample) => sample.volume)
  const frequencyValues = record.samples.map((sample) => sample.frequency)

  return [
    `${record.targetLabel}: detected`,
    `samples=${record.samples.length}`,
    `avgHz=${average(frequencyValues).toFixed(1)}`,
    `avgCents=${Math.round(average(centsValues))}`,
    `minCents=${Math.min(...centsValues)}`,
    `maxCents=${Math.max(...centsValues)}`,
    `avgVolume=${average(volumeValues).toFixed(4)}`,
    `maxVolume=${Math.max(...volumeValues).toFixed(4)}`
  ].join(', ')
}

function buildReport(records: WarmupStepRecord[]) {
  const lines = [
    'VocalWarm warmup report',
    `Started from: ${midiToDisplayNoteName(selectedStartMidi.value, props.noteNotation)}`,
    `Pattern length: ${selectedPatternLength.value} notes`,
    `Pattern: ascending call, sing back, descending call, sing back; transpose up by semitone`,
    `Timing: note=${playNoteMs}ms, gap=${betweenNotesMs}ms, listenWindow=${listenWindowMs}ms`,
    ''
  ]

  for (const record of records) {
    lines.push(`Round ${record.round}, ${record.direction}`)
    lines.push(`Played: ${record.targetMidis.map((midi) => midiToDisplayNoteName(midi, props.noteNotation)).join(' ')}`)
    record.sungNotes.forEach((sungNote) => {
      lines.push(`- ${summarizeSungRecord(sungNote)}`)
    })
    lines.push('')
  }

  return lines.join('\n')
}

async function startWarmup() {
  if (!canStart.value) {
    return
  }

  const warmupRangeStartMidi = selectedStartMidi.value
  const warmupRangeEndMidi = selectedStartMidi.value
    + defaultRoundCount - 1
    + warmupStepIntervals[selectedPatternLength.value - 1]
  emit('warmupRangeFocus', warmupRangeStartMidi, warmupRangeEndMidi)
  await nextTick()

  isCancelled = false
  phase.value = 'playing'
  reportText.value = ''
  const records: WarmupStepRecord[] = []

  for (let roundIndex = 0; roundIndex < defaultRoundCount; roundIndex += 1) {
    if (isCancelled) {
      break
    }

    const roundStartMidi = selectedStartMidi.value + roundIndex
    currentRound.value = roundIndex + 1

    const upPattern = getPattern(roundStartMidi, 'up')
    await playPattern(upPattern)
    records.push(await awaitSungPattern(upPattern, roundIndex + 1, 'up'))
    await sleep(350)

    const downPattern = getPattern(roundStartMidi, 'down')
    await playPattern(downPattern)
    records.push(await awaitSungPattern(downPattern, roundIndex + 1, 'down'))
    await sleep(450)
  }

  phase.value = 'done'
  currentPrompt.value = ''
  reportText.value = buildReport(records)
  isReportOpen.value = props.shouldShowReport
}

function stopWarmup() {
  isCancelled = true
  phase.value = 'idle'
  currentPrompt.value = ''
}

function closeReport() {
  isReportOpen.value = false
  phase.value = 'idle'
}

async function copyReport() {
  await navigator.clipboard?.writeText(reportText.value)
  isReportCopied.value = true

  if (copiedTimeoutId) {
    clearTimeout(copiedTimeoutId)
  }

  copiedTimeoutId = setTimeout(() => {
    isReportCopied.value = false
    copiedTimeoutId = null
  }, 1400)
}

onBeforeUnmount(() => {
  if (copiedTimeoutId) {
    clearTimeout(copiedTimeoutId)
  }
})
</script>

<template>
  <div class="warmup-program">
    <div class="warmup-controls">
      <label>
        <span>{{ labels.start }}</span>
        <select v-model.number="selectedStartMidi" :disabled="isRunning">
          <option v-for="midi in startOptions" :key="midi" :value="midi">
            {{ midiToDisplayNoteName(midi, noteNotation) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ labels.notes }}</span>
        <select v-model.number="selectedPatternLength" :disabled="isRunning">
          <option v-for="count in patternLengthOptions" :key="count" :value="count">
            {{ count }}
          </option>
        </select>
      </label>

      <button v-if="!isRunning" type="button" :disabled="!canStart" @click="startWarmup">
        {{ labels.warmup }}
      </button>

      <button v-else type="button" class="stop-warmup" @click="stopWarmup">
        {{ labels.stop }}
      </button>
    </div>

    <p v-if="currentPrompt" class="warmup-prompt">
      {{ currentRound ? `${currentRound}/${defaultRoundCount}` : '' }} {{ currentPrompt }}
    </p>

    <div v-if="isReportOpen" class="warmup-modal-backdrop" role="presentation">
      <section class="warmup-modal" role="dialog" aria-modal="true" aria-label="Warmup report">
        <h2>{{ labels.report }}</h2>
        <div class="report-field">
          <button type="button" class="copy-report" @click="copyReport">
            {{ isReportCopied ? labels.copied : labels.copy }}
          </button>
          <textarea :value="reportText" readonly />
        </div>
        <button type="button" @click="closeReport">
          {{ labels.close }}
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
.warmup-program {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 0 0 8px;
}

.warmup-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.warmup-controls label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #52615c;
  font-size: 0.74rem;
  font-weight: 850;
}

.warmup-controls select,
.warmup-controls button {
  min-height: 34px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px;
  color: #17201d;
  background: rgba(255, 250, 240, 0.92);
  font: inherit;
  font-weight: 900;
}

.warmup-controls select {
  padding: 0 26px 0 9px;
}

.warmup-controls button {
  min-width: 108px;
  padding: 0 14px;
  color: #fffaf0;
  background: #277a73;
  cursor: pointer;
}

.warmup-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.warmup-controls .stop-warmup {
  background: #d74f2a;
}

.warmup-prompt {
  min-height: 18px;
  margin: 0;
  color: #52615c;
  font-size: 0.78rem;
  font-weight: 850;
}

.warmup-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(23, 32, 29, 0.3);
}

.warmup-modal {
  display: grid;
  gap: 12px;
  width: min(720px, 100%);
  padding: 16px;
  border-radius: 8px;
  background: #fffaf0;
  box-shadow: 0 24px 80px rgba(23, 32, 29, 0.24);
}

.warmup-modal h2 {
  margin: 0;
  color: #17201d;
  font-size: 1.1rem;
}

.report-field {
  position: relative;
}

.warmup-modal textarea {
  width: 100%;
  min-height: 320px;
  resize: vertical;
  border: 1px solid rgba(23, 32, 29, 0.16);
  border-radius: 8px;
  padding: 10px;
  color: #17201d;
  background: #fffdf8;
  font: 0.82rem/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.copy-report {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
  min-height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  color: #fffaf0;
  background: #277a73;
  cursor: pointer;
  font-weight: 900;
}

.warmup-modal > button {
  justify-self: end;
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 8px;
  color: #fffaf0;
  background: #277a73;
  cursor: pointer;
  font-weight: 900;
}

@media (max-width: 560px) {
  .warmup-program {
    margin-bottom: 2px;
  }

  .warmup-controls {
    gap: 6px;
  }

  .warmup-controls select,
  .warmup-controls button {
    min-height: 32px;
  }

  .warmup-prompt {
    font-size: 0.72rem;
  }
}
</style>
