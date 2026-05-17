import { midiToNoteName } from '~/composables/useNoteMath'

type StartKeyboardNote = (noteName: string, midi: number) => Promise<void>
type StopKeyboardNote = () => Promise<void>
type SelectedNotePlayedCallback = (midi: number) => void

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

export function useSelectedNoteControls(
  isListening: Ref<boolean>,
  selectedMidi: Ref<number>,
  setSelectedMidi: (midi: number) => void,
  startKeyboardNote: StartKeyboardNote,
  stopKeyboardNote: StopKeyboardNote,
  onSelectedNotePlayed?: SelectedNotePlayedCallback
) {
  const isSelectedNoteHolding = ref(false)
  const selectedNoteLabel = computed(() => midiToNoteName(selectedMidi.value))

  async function stepSelectedMidi(direction: number) {
    setSelectedMidi(selectedMidi.value + direction)

    if (isSelectedNoteHolding.value) {
      onSelectedNotePlayed?.(selectedMidi.value)
      await startKeyboardNote(selectedNoteLabel.value, selectedMidi.value)
    }
  }

  async function holdSelectedNote() {
    if (isSelectedNoteHolding.value) {
      return
    }

    isSelectedNoteHolding.value = true
    onSelectedNotePlayed?.(selectedMidi.value)
    await startKeyboardNote(selectedNoteLabel.value, selectedMidi.value)
  }

  async function releaseSelectedNote() {
    isSelectedNoteHolding.value = false
    await stopKeyboardNote()
  }

  function handleGlobalKeydown(event: KeyboardEvent) {
    if (!isListening.value || isEditableTarget(event.target)) {
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      stepSelectedMidi(-1)
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      stepSelectedMidi(1)
      return
    }

    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault()
      holdSelectedNote()
    }
  }

  function handleGlobalKeyup(event: KeyboardEvent) {
    if (!isListening.value || isEditableTarget(event.target)) {
      return
    }

    if (event.code === 'Space') {
      event.preventDefault()
      releaseSelectedNote()
    }
  }

  function startSelectedNoteControls() {
    window.addEventListener('keydown', handleGlobalKeydown)
    window.addEventListener('keyup', handleGlobalKeyup)
  }

  function disposeSelectedNoteControls() {
    window.removeEventListener('keydown', handleGlobalKeydown)
    window.removeEventListener('keyup', handleGlobalKeyup)
  }

  return {
    selectedNoteLabel,
    stepSelectedMidi,
    holdSelectedNote,
    releaseSelectedNote,
    startSelectedNoteControls,
    disposeSelectedNoteControls
  }
}
