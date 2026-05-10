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
    <button class="overlay-action" type="button" @click="$emit('start')">
      {{ action }}
    </button>
    <span class="overlay-hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.start-overlay {
  position: absolute;
  z-index: 2;
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
    linear-gradient(135deg, rgba(255, 252, 244, 0.3), rgba(232, 242, 236, 0.14)),
    rgba(255, 252, 244, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(2px) saturate(1.06);
  pointer-events: none;
  text-align: center;
}

.start-overlay::before {
  content: '';
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(23, 32, 29, 0.12);
  border-radius: 8px;
  pointer-events: none;
}

.start-overlay:hover .overlay-action {
  transform: translateY(-2px);
  background: rgba(255, 252, 244, 0.58);
  border-color: rgba(215, 79, 42, 0.56);
}

.overlay-kicker,
.overlay-hint {
  position: relative;
  z-index: 1;
  color: #52615c;
  font-weight: 800;
}

.overlay-kicker {
  font-size: 0.85rem;
  text-transform: uppercase;
}

.overlay-action {
  position: relative;
  z-index: 1;
  min-width: min(74vw, 320px);
  padding: 22px 42px;
  border: 1px solid rgba(215, 79, 42, 0.32);
  border-radius: 8px;
  color: #d74f2a;
  background: rgba(255, 252, 244, 0.42);
  cursor: pointer;
  pointer-events: auto;
  box-shadow:
    0 18px 60px rgba(31, 41, 37, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);
  backdrop-filter: blur(10px) saturate(1.1);
  font-size: clamp(2.2rem, 8vw, 5.8rem);
  font-weight: 900;
  line-height: 1;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.overlay-hint {
  max-width: min(70vw, 380px);
  font-size: 0.96rem;
}
</style>
