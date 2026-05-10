<script setup lang="ts">
const props = defineProps<{
  label: string
  status: string
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
  <div class="volume">
    <div class="volume-label">
      <span>{{ label }}</span>
      <span>{{ status }}</span>
    </div>
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
  display: grid;
  gap: 8px;
  margin: 18px auto 0;
}

.volume-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #5d6964;
  font-size: 0.74rem;
  font-weight: 800;
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
    margin-top: 8px;
    gap: 5px;
  }

  .volume-steps {
    height: 22px;
  }
}
</style>
