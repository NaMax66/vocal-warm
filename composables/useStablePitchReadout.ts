import { noteNameToDisplayName, type NoteNotation } from '~/composables/useNoteMath'

export function useStablePitchReadout(
  note: Ref<string>,
  octave: Ref<string>,
  noteNotation: Ref<NoteNotation>
) {
  const stableNote = ref('--')
  const stableOctave = ref('')
  const isPitchReadoutVisible = ref(false)
  const stableDisplayNote = computed(() => (
    stableNote.value === '--'
      ? stableNote.value
      : noteNameToDisplayName(stableNote.value, noteNotation.value)
  ))

  const pitchReadoutDelayMs = 1000
  const pitchReadoutGraceMs = 900
  let stableNoteTimeoutId: ReturnType<typeof setTimeout> | null = null
  let stableNoteHideTimeoutId: ReturnType<typeof setTimeout> | null = null

  function clearStableNoteTimeout() {
    if (!stableNoteTimeoutId) {
      return
    }

    clearTimeout(stableNoteTimeoutId)
    stableNoteTimeoutId = null
  }

  function clearStableNoteHideTimeout() {
    if (!stableNoteHideTimeoutId) {
      return
    }

    clearTimeout(stableNoteHideTimeoutId)
    stableNoteHideTimeoutId = null
  }

  function hideStableNoteAfterGrace() {
    clearStableNoteHideTimeout()

    stableNoteHideTimeoutId = setTimeout(() => {
      isPitchReadoutVisible.value = false
      stableNote.value = '--'
      stableOctave.value = ''
      stableNoteHideTimeoutId = null
    }, pitchReadoutGraceMs)
  }

  const stopStablePitchWatch = watch([note, octave], ([nextNote, nextOctave]) => {
    clearStableNoteTimeout()

    if (nextNote === '--' || !nextOctave) {
      hideStableNoteAfterGrace()
      return
    }

    if (nextNote === stableNote.value && nextOctave === stableOctave.value) {
      clearStableNoteHideTimeout()
      isPitchReadoutVisible.value = true
      return
    }

    hideStableNoteAfterGrace()

    stableNoteTimeoutId = setTimeout(() => {
      if (note.value !== nextNote || octave.value !== nextOctave) {
        return
      }

      clearStableNoteHideTimeout()
      stableNote.value = nextNote
      stableOctave.value = nextOctave
      isPitchReadoutVisible.value = true
      stableNoteTimeoutId = null
    }, pitchReadoutDelayMs)
  })

  function disposeStablePitchReadout() {
    stopStablePitchWatch()
    clearStableNoteTimeout()
    clearStableNoteHideTimeout()
  }

  return {
    stableOctave,
    stableDisplayNote,
    isPitchReadoutVisible,
    disposeStablePitchReadout
  }
}
