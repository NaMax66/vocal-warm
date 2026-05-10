<script setup lang="ts">
defineProps<{
  note: string
  octave: string
  frequency: number | null
  centsLabel: string
}>()
</script>

<template>
  <div class="readout" aria-live="polite">
    <span class="note">{{ note }}</span>
    <span class="octave">{{ octave }}</span>
  </div>

  <div class="frequency-row">
    <span>{{ frequency ? `${frequency.toFixed(1)} Hz` : '-- Hz' }}</span>
    <span>{{ centsLabel }}</span>
  </div>
</template>

<style scoped>
.readout {
  min-height: 210px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 32px 0 18px;
  color: #162c39;
}

.note {
  font-size: clamp(7rem, 28vw, 14rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: 0;
}

.octave {
  min-width: 48px;
  color: #277a73;
  font-size: clamp(2.6rem, 8vw, 5rem);
  font-weight: 850;
}

.frequency-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #3d4c47;
  font-size: clamp(1rem, 3vw, 1.25rem);
  font-weight: 750;
}

@media (max-width: 560px) {
  .readout {
    min-height: 170px;
  }
}
</style>
