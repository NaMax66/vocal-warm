<script setup lang="ts">
defineProps<{
  note: string
  octave: string
  isVisible: boolean
}>()
</script>

<template>
  <div class="readout" :class="{ visible: isVisible }" aria-live="polite">
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
  transition: none;
}

.readout.visible {
  opacity: 1;
  transition: opacity 640ms ease;
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
