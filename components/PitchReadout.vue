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
  min-height: 160px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin: 18px 0 10px;
  color: #162c39;
}

.note {
  font-size: clamp(5rem, 20vw, 10rem);
  font-weight: 900;
  line-height: 0.82;
  letter-spacing: 0;
}

.octave {
  min-width: 38px;
  color: #277a73;
  font-size: clamp(2rem, 6vw, 3.8rem);
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
    min-height: 90px;
    margin: 8px 0 6px;
  }

  .note {
    font-size: clamp(4.2rem, 24vw, 6rem);
  }

  .octave {
    min-width: 28px;
    font-size: clamp(1.6rem, 9vw, 2.4rem);
  }

  .frequency-row {
    gap: 10px;
    padding: 0 8px;
    font-size: 0.92rem;
  }
}
</style>
