<script setup lang="ts">
defineProps<{
  label: string
  needleStyle: Record<string, string>
}>()
</script>

<template>
  <div class="tuning-meter" :aria-label="label">
    <span>-50</span>
    <div class="rail">
      <i class="center-line" />
      <i class="needle" :style="needleStyle" />
    </div>
    <span>+50</span>
  </div>
</template>

<style scoped>
.tuning-meter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 26px 0;
  color: #63706b;
  font-size: 0.82rem;
  font-weight: 700;
}

.rail {
  position: relative;
  width: min(100%, 560px);
  height: 48px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, #2b6f9b 0%, #9fc9bd 45%, #277a73 50%, #efb45d 55%, #d74f2a 100%);
  overflow: hidden;
}

.rail::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 999px;
  background: rgba(255, 252, 244, 0.76);
}

.center-line,
.needle {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 8px;
  width: 3px;
  height: 32px;
  border-radius: 8px;
}

.center-line {
  background: rgba(23, 32, 29, 0.28);
}

.needle {
  background: #17201d;
  transition: transform 90ms linear;
}

@media (max-width: 560px) {
  .tuning-meter {
    gap: 10px;
  }
}
</style>
