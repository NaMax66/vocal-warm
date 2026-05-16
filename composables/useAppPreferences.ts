import { keyboardMaxMidi, keyboardMinMidi, noteNotations, type NoteNotation } from '~/composables/useNoteMath'
import { supportedLanguages, type Language } from '~/utils/i18n'
import {
  isKeyboardInstrumentId,
  isSamplePresetId,
  type KeyboardInstrumentId,
  type SamplePresetId
} from '~/utils/instrumentSamples'

const languageStorageKey = 'vocalwarm-language'
const noteNotationStorageKey = 'vocalwarm-note-notation'
const showWarmupReportStorageKey = 'vocalwarm-show-warmup-report'
const keyboardInstrumentStorageKey = 'vocalwarm-keyboard-instrument'
const samplePresetStorageKey = 'vocalwarm-sample-preset'
const legacyPianoPresetStorageKey = 'vocalwarm-piano-preset'
const selectedMidiStorageKey = 'vocalwarm-selected-midi'

type RestoreAppPreferencesOptions = {
  restoreKeyboardInstrument: (instrumentId: KeyboardInstrumentId) => void
  restoreSamplePreset: (presetId: SamplePresetId) => void
}

function resolveLanguage(browserLanguage: string | undefined): Language {
  return browserLanguage?.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

export function useAppPreferences() {
  const language = ref<Language>('en')
  const noteNotation = ref<NoteNotation>('letter')
  const selectedMidi = ref(60)
  const shouldShowWarmupReport = ref(false)

  function setLanguage(nextLanguage: Language) {
    language.value = nextLanguage
    localStorage.setItem(languageStorageKey, nextLanguage)
  }

  function setNoteNotation(nextNotation: NoteNotation) {
    noteNotation.value = nextNotation
    localStorage.setItem(noteNotationStorageKey, nextNotation)
  }

  function setShowWarmupReport(value: boolean) {
    shouldShowWarmupReport.value = value
    localStorage.setItem(showWarmupReportStorageKey, value ? '1' : '0')
  }

  function setSelectedMidi(midi: number) {
    selectedMidi.value = Math.max(keyboardMinMidi, Math.min(keyboardMaxMidi, midi))
    localStorage.setItem(selectedMidiStorageKey, String(selectedMidi.value))
  }

  function persistKeyboardInstrument(instrumentId: KeyboardInstrumentId) {
    localStorage.setItem(keyboardInstrumentStorageKey, instrumentId)
  }

  function persistSamplePreset(presetId: SamplePresetId) {
    localStorage.setItem(samplePresetStorageKey, presetId)
    localStorage.setItem(legacyPianoPresetStorageKey, presetId)
  }

  function restoreAppPreferences({
    restoreKeyboardInstrument,
    restoreSamplePreset
  }: RestoreAppPreferencesOptions) {
    const savedLanguage = localStorage.getItem(languageStorageKey) as Language | null
    language.value = savedLanguage && supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : resolveLanguage(navigator.language)

    const savedNoteNotation = localStorage.getItem(noteNotationStorageKey) as NoteNotation | null
    if (savedNoteNotation && noteNotations.includes(savedNoteNotation)) {
      noteNotation.value = savedNoteNotation
    }

    shouldShowWarmupReport.value = localStorage.getItem(showWarmupReportStorageKey) === '1'

    const savedKeyboardInstrumentId = localStorage.getItem(keyboardInstrumentStorageKey)
    if (isKeyboardInstrumentId(savedKeyboardInstrumentId)) {
      restoreKeyboardInstrument(savedKeyboardInstrumentId)
    }

    const savedSamplePresetId = localStorage.getItem(samplePresetStorageKey) ?? localStorage.getItem(legacyPianoPresetStorageKey)
    if (isSamplePresetId(savedSamplePresetId)) {
      restoreSamplePreset(savedSamplePresetId)
    }

    const savedSelectedMidi = Number(localStorage.getItem(selectedMidiStorageKey))
    if (
      Number.isInteger(savedSelectedMidi)
      && savedSelectedMidi >= keyboardMinMidi
      && savedSelectedMidi <= keyboardMaxMidi
    ) {
      selectedMidi.value = savedSelectedMidi
    }
  }

  return {
    language,
    noteNotation,
    selectedMidi,
    shouldShowWarmupReport,
    setLanguage,
    setNoteNotation,
    setShowWarmupReport,
    setSelectedMidi,
    persistKeyboardInstrument,
    persistSamplePreset,
    restoreAppPreferences
  }
}
