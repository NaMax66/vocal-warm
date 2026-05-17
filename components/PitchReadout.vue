<script setup lang="ts">
const pitchReadoutFadeInMs = 300

defineProps<{
  note: string
  octave: string
  isVisible: boolean
}>()
</script>

<template>
  <div
    class="readout"
    :class="{ visible: isVisible }"
    :style="{ '--pitch-readout-fade-in-ms': `${pitchReadoutFadeInMs}ms` }"
    aria-live="polite"
  >
    <span class="note">{{ note }}</span>
    <span class="octave">{{ octave }}</span>
  </div>
</template>

<style scoped>
.readout {
  height: 170px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-top: 18px;
  color: #162c39;
  overflow: hidden;
  opacity: 0;
}

.readout.visible {
  opacity: 1;
  animation: pitch-readout-fade-in var(--pitch-readout-fade-in-ms) ease both;
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

@keyframes pitch-readout-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@media (max-width: 900px), (max-width: 1200px) and (max-height: 900px) {
  .readout {
    height: clamp(92px, 15vh, 136px);
    margin: 4px 0;
  }

  .note {
    font-size: clamp(4.6rem, 15vw, 8rem);
  }

  .octave {
    min-width: 32px;
    font-size: clamp(1.8rem, 5vw, 3rem);
  }
}

@media (max-width: 560px) {
  .readout {
    height: 104px;
    margin: 8px 0 10px;
  }

  .note {
    font-size: clamp(4.2rem, 24vw, 6rem);
  }

  .octave {
    min-width: 28px;
    font-size: clamp(1.6rem, 9vw, 2.4rem);
  }
}
</style>
