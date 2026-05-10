<script setup lang="ts">
defineProps<{
  kicker: string
  action: string
  hint: string
}>()

defineEmits<{
  start: []
}>()
</script>

<template>
  <div class="start-overlay">
    <span class="overlay-kicker">{{ kicker }}</span>
    <button class="overlay-action" type="button" @click.stop="$emit('start')">
      {{ action }}
    </button>
    <span class="overlay-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.start-overlay {
  position: absolute;
  z-index: 60;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  border: 0;
  border-radius: inherit;
  color: #17201d;
  background:
    linear-gradient(135deg, rgba(255, 252, 244, 0.34), rgba(232, 242, 236, 0.2)),
    rgba(255, 252, 244, 0.16);
  pointer-events: auto;
  text-align: center;
}

.start-overlay::before {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.06)),
    rgba(255, 252, 244, 0.08);
  pointer-events: none;
}

.overlay-action:hover,
.overlay-action:focus-visible {
  transform: translateY(-2px);
  color: #fffaf0;
  background: #b83e20;
  border-color: #b83e20;
  outline: 0;
}

.overlay-kicker,
.overlay-hint {
  position: relative;
  z-index: 1;
  color: #52615c;
  padding: 5px 10px;
  border-radius: 8px;
  background: rgba(255, 252, 244, 0.72);
  box-shadow: 0 8px 24px rgba(31, 41, 37, 0.08);
  font-weight: 800;
}

.overlay-kicker {
  font-size: 0.85rem;
  text-transform: uppercase;
}

.overlay-action {
  text-transform: uppercase;
  position: relative;
  z-index: 1;
  min-width: min(74vw, 320px);
  padding: 22px 42px;
  border: 1px solid #d74f2a;
  border-radius: 8px;
  color: #fffaf0;
  background: #d74f2a;
  cursor: pointer;
  box-shadow:
    0 18px 60px rgba(215, 79, 42, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px) saturate(1.1);
  font-size: clamp(2.2rem, 8vw, 5.8rem);
  font-weight: 900;
  line-height: 1;
  transition:
    transform 160ms ease,
    color 160ms ease,
    background 160ms ease;
}

.overlay-hint {
  max-width: min(70vw, 380px);
  font-size: 0.96rem;
}
</style>
