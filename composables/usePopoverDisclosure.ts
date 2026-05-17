export function usePopoverDisclosure() {
  const isOpen = ref(false)
  const root = ref<HTMLElement | null>(null)

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function closeOnOutsidePointer(event: PointerEvent) {
    const target = event.target as Node

    if (root.value && !root.value.contains(target)) {
      isOpen.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('pointerdown', closeOnOutsidePointer)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', closeOnOutsidePointer)
  })

  return {
    isOpen,
    root,
    toggle
  }
}
