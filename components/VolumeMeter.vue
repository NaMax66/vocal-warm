<script setup lang="ts">
defineProps<{
  label: string
  status: string
  barStyle: Record<string, string>
}>()
</script>

<template>
  <div class="volume">
    <div class="volume-label">
      <span>{{ label }}</span>
      <span>{{ status }}</span>
    </div>
    <div class="volume-track">
      <i :style="barStyle" />
    </div>
  </div>
</template>

<style scoped>
.volume {
  display: grid;
  gap: 10px;
}

.volume-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #5d6964;
  font-size: 0.92rem;
  font-weight: 700;
}

.volume-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(23, 32, 29, 0.12);
  overflow: hidden;
}

.volume-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #277a73;
  transition: width 80ms linear;
}
</style>
