<script setup lang="ts">
defineProps<{
  label: string
  meterStyle: Record<string, string>
  isAligned: boolean
}>()
</script>

<template>
  <div class="tuning-meter" :class="{ aligned: isAligned }" :aria-label="label">
    <div class="rail" :style="meterStyle">
      <i class="target-line" />
      <i class="moving-section" />
    </div>
  </div>
</template>

<style scoped>
.tuning-meter {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 74px;
  margin-bottom: 20px;
  color: #52615c;
}

.rail {
  position: relative;
  width: min(100%, 560px);
  height: 74px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(23, 32, 29, 0.08), transparent 34%, transparent 66%, rgba(23, 32, 29, 0.08)),
    #e7ece7;
  border: 1px solid rgba(23, 32, 29, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  overflow: hidden;
  transition:
    background 820ms ease,
    border-color 820ms ease,
    box-shadow 980ms ease;
}

.rail::before,
.rail::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
}

.rail::before {
  top: 50%;
  height: 2px;
  background: rgba(23, 32, 29, 0.32);
  transform: translateY(-50%);
}

.rail::after {
  inset: 0;
  background:
    linear-gradient(180deg, transparent calc(50% - 25px), rgba(23, 32, 29, 0.08) calc(50% - 24px), transparent calc(50% - 23px)),
    linear-gradient(180deg, transparent calc(50% + 23px), rgba(23, 32, 29, 0.08) calc(50% + 24px), transparent calc(50% + 25px));
}

.target-line {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 25vw;
  max-width: calc(100% - 32px);
  min-width: 78px;
  height: 12px;
  border-radius: 8px;
  background: rgba(23, 32, 29, 0.2);
  transform: translate(-50%, -50%);
}

.moving-section {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  width: 25vw;
  max-width: calc(100% - 32px);
  min-width: 78px;
  height: 12px;
  border-radius: 8px;
  background: #17201d;
  box-shadow:
    0 0 0 1px rgba(255, 252, 244, 0.46),
    0 10px 22px rgba(23, 32, 29, 0.18);
  transform: translate(-50%, calc(-50% + var(--pitch-offset, 0px)));
  transition:
    transform var(--pitch-motion-duration, 1180ms) cubic-bezier(0.2, 0, 0.1, 1),
    background 820ms ease,
    box-shadow 980ms ease;
  will-change: transform;
}

.tuning-meter.aligned .rail {
  background:
    linear-gradient(180deg, rgba(19, 146, 87, 0.14), transparent 34%, transparent 66%, rgba(19, 146, 87, 0.14)),
    #e8f7ed;
  border-color: rgba(19, 146, 87, 0.52);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 26px rgba(19, 146, 87, 0.34);
}

.tuning-meter.aligned .rail::before,
.tuning-meter.aligned .moving-section {
  background: #139257;
  box-shadow:
    0 0 0 1px rgba(255, 252, 244, 0.64),
    0 0 26px rgba(19, 146, 87, 0.62);
}

.tuning-meter.aligned .target-line {
  background: rgba(19, 146, 87, 0.22);
}

@media (max-width: 900px), (max-width: 1200px) and (max-height: 900px) {
  .tuning-meter {
    height: clamp(50px, 8vh, 64px);
    margin: 4px 6px;
  }

  .rail {
    height: clamp(50px, 8vh, 64px);
  }
}

@media (max-width: 560px) {
  .tuning-meter {
    height: 58px;
    margin: 30px 6px;
  }

  .rail {
    height: 58px;
  }
}
</style>
