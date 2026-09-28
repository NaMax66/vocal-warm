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
const showExercisesStorageKey = 'vocalwarm-show-exercises'
const showKeyboardControlsStorageKey = 'vocalwarm-show-keyboard-controls'
const showVolumeMeterStorageKey = 'vocalwarm-show-volume-meter'
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
  const shouldShowExercises = ref(false)
  const shouldShowKeyboardControls = ref(false)
  const shouldShowVolumeMeter = ref(false)

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

  function setShowExercises(value: boolean) {
    shouldShowExercises.value = value
    localStorage.setItem(showExercisesStorageKey, value ? '1' : '0')
  }

  function setShowKeyboardControls(value: boolean) {
    shouldShowKeyboardControls.value = value
    localStorage.setItem(showKeyboardControlsStorageKey, value ? '1' : '0')
  }

  function setShowVolumeMeter(value: boolean) {
    shouldShowVolumeMeter.value = value
    localStorage.setItem(showVolumeMeterStorageKey, value ? '1' : '0')
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
    shouldShowExercises.value = localStorage.getItem(showExercisesStorageKey) === '1'
    shouldShowKeyboardControls.value = localStorage.getItem(showKeyboardControlsStorageKey) === '1'
    shouldShowVolumeMeter.value = localStorage.getItem(showVolumeMeterStorageKey) === '1'

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
    shouldShowExercises,
    shouldShowKeyboardControls,
    shouldShowVolumeMeter,
    setLanguage,
    setNoteNotation,
    setShowWarmupReport,
    setShowExercises,
    setShowKeyboardControls,
    setShowVolumeMeter,
    setSelectedMidi,
    persistKeyboardInstrument,
    persistSamplePreset,
    restoreAppPreferences
  }
}
