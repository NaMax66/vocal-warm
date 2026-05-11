<script setup lang="ts">
const props = defineProps<{
  label: string
  activeSteps: number
}>()

const totalSteps = 12

const meterSteps = computed(() => Array.from({ length: totalSteps }, (_, index) => ({
  index,
  isActive: index < props.activeSteps,
  height: `${30 + index * 5}%`,
  tone: index >= 8 ? 'high' : index >= 4 ? 'mid' : 'low'
})))
</script>

<template>
  <div class="volume" :aria-label="label">
    <div class="volume-steps" aria-hidden="true">
      <i
        v-for="step in meterSteps"
        :key="step.index"
        :class="[{ active: step.isActive }, step.tone]"
        :style="{ '--step-height': step.height }"
      />
    </div>
  </div>
</template>

<style scoped>
.volume {
  width: min(50%, 420px);
  min-height: 30px;
  display: grid;
  margin: 18px auto 0;
}

.volume-steps {
  height: 30px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  align-items: end;
  gap: 3px;
}

.volume-steps i {
  display: block;
  height: var(--step-height);
  border-radius: 3px 3px 1px 1px;
  background: rgba(23, 32, 29, 0.12);
  transition:
    background 90ms linear,
    opacity 90ms linear;
}

.volume-steps i.active.low {
  background: #8fb8c7;
}

.volume-steps i.active.mid {
  background: #d8b442;
}

.volume-steps i.active.high {
  background: #277a73;
}

@media (max-width: 560px) {
  .volume {
    width: min(76%, 320px);
    min-height: 22px;
    margin-top: 8px;
  }

  .volume-steps {
    height: 22px;
  }
}
</style>
