<script setup lang="ts">
import type {
  MicrophoneDeviceOption,
  MicrophoneSettingKey
} from '~/composables/usePitchDetector'

const props = defineProps<{
  text: {
    title: string
    description: string
    device: string
    defaultDevice: string
    inputGain: string
    sensitivity: string
    sensitivityHint: string
    echoCancellation: string
    noiseSuppression: string
    autoGainControl: string
    apply: string
    copyDebug: string
    copied: string
    liveSignal: string
    detectedPitch: string
    noPitch: string
  }
  devices: readonly MicrophoneDeviceOption[]
  deviceId: string
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  inputGain: number
  minimumRms: number
  isListening: boolean
  diagnosticReport: string
  currentRms: number
  currentFrequency: number | null
}>()

const emit = defineEmits<{
  setSetting: [key: MicrophoneSettingKey, value: string | number | boolean]
  apply: []
}>()

const isCopied = ref(false)
let copiedTimeoutId: ReturnType<typeof setTimeout> | null = null

function setBoolean(key: MicrophoneSettingKey, event: Event) {
  emit('setSetting', key, (event.target as HTMLInputElement).checked)
}

async function copyDebugReport() {
  try {
    await navigator.clipboard.writeText(props.diagnosticReport)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.diagnosticReport
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }

  isCopied.value = true
  if (copiedTimeoutId) clearTimeout(copiedTimeoutId)
  copiedTimeoutId = setTimeout(() => {
    isCopied.value = false
  }, 1800)
}

onBeforeUnmount(() => {
  if (copiedTimeoutId) clearTimeout(copiedTimeoutId)
})
</script>

<template>
  <section class="microphone-settings">
    <h2>{{ text.title }}</h2>
    <p>{{ text.description }}</p>

    <div class="live-diagnostics">
      <span>{{ text.liveSignal }} <strong>{{ currentRms.toFixed(4) }}</strong></span>
      <span>{{ text.detectedPitch }} <strong>{{ currentFrequency ? `${currentFrequency.toFixed(1)} Hz` : text.noPitch }}</strong></span>
    </div>

    <label class="field-label">
      <span>{{ text.device }}</span>
      <select
        :value="deviceId"
        @change="$emit('setSetting', 'deviceId', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">{{ text.defaultDevice }}</option>
        <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label }}
        </option>
      </select>
    </label>

    <label class="range-field">
      <span>{{ text.inputGain }} <strong>{{ inputGain.toFixed(1) }}×</strong></span>
      <input
        type="range"
        min="1"
        max="8"
        step="0.5"
        :value="inputGain"
        @input="$emit('setSetting', 'inputGain', Number(($event.target as HTMLInputElement).value))"
      >
    </label>

    <label class="range-field">
      <span>{{ text.sensitivity }} <strong>{{ minimumRms.toFixed(3) }}</strong></span>
      <input
        type="range"
        min="0.001"
        max="0.03"
        step="0.001"
        :value="minimumRms"
        @input="$emit('setSetting', 'minimumRms', Number(($event.target as HTMLInputElement).value))"
      >
      <small>{{ text.sensitivityHint }}</small>
    </label>

    <div class="processing-options">
      <label>
        <input type="checkbox" :checked="echoCancellation" @change="setBoolean('echoCancellation', $event)">
        <span>{{ text.echoCancellation }}</span>
      </label>
      <label>
        <input type="checkbox" :checked="noiseSuppression" @change="setBoolean('noiseSuppression', $event)">
        <span>{{ text.noiseSuppression }}</span>
      </label>
      <label>
        <input type="checkbox" :checked="autoGainControl" @change="setBoolean('autoGainControl', $event)">
        <span>{{ text.autoGainControl }}</span>
      </label>
    </div>

    <div class="action-row">
      <button type="button" class="apply-button" @click="$emit('apply')">
        {{ text.apply }}
      </button>
      <button type="button" class="debug-button" @click="copyDebugReport">
        {{ isCopied ? text.copied : text.copyDebug }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.microphone-settings {
  display: grid;
  gap: 9px;
  padding-top: 11px;
  border-top: 1px solid rgba(23, 32, 29, 0.12);
}

h2,
p {
  margin: 0;
}

h2 {
  color: #17201d;
  font-size: 0.84rem;
  font-weight: 900;
}

p,
small {
  color: #5d6964;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.35;
}

.field-label,
.range-field {
  display: grid;
  gap: 5px;
  color: #17201d;
  font-size: 0.74rem;
  font-weight: 850;
}

.live-diagnostics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}

.live-diagnostics span {
  display: grid;
  gap: 2px;
  padding: 7px;
  border-radius: 6px;
  color: #5d6964;
  background: rgba(39, 122, 115, 0.08);
  font-size: 0.65rem;
  font-weight: 750;
}

.live-diagnostics strong {
  color: #17201d;
  font-size: 0.76rem;
}

.field-label select {
  width: 100%;
  min-height: 38px;
  padding: 0 8px;
  border: 1px solid rgba(23, 32, 29, 0.14);
  border-radius: 6px;
  color: #17201d;
  background: #fffaf0;
  font: inherit;
}

.range-field span {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.range-field input {
  width: 100%;
  accent-color: #277a73;
}

.processing-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 5px;
}

.processing-options label {
  display: grid;
  justify-items: center;
  gap: 5px;
  padding: 7px 4px;
  border-radius: 6px;
  color: #52615c;
  background: rgba(23, 32, 29, 0.05);
  font-size: 0.65rem;
  font-weight: 800;
  text-align: center;
}

.processing-options input {
  width: 17px;
  height: 17px;
  margin: 0;
  accent-color: #277a73;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.action-row button {
  min-height: 40px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 900;
}

.apply-button {
  color: #fffaf0;
  background: #277a73;
}

.debug-button {
  color: #17201d;
  background: rgba(23, 32, 29, 0.08);
}
</style>
