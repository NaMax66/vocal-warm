export type Language = 'en' | 'ru'
export type StatusKey = 'idle' | 'listening' | 'waiting' | 'stopped' | 'micUnavailable'

export const supportedLanguages: Language[] = ['en', 'ru']

export const copy = {
  en: {
    title: 'Vocal warmup by notes',
    start: 'Start',
    stop: 'Stop',
    inactiveSession: 'Session inactive',
    startHint: 'Start listening and allow microphone access',
    volume: 'Volume',
    inTune: 'in tune',
    sharp: (value: number) => `↑ ${value} c.`,
    flat: (value: number) => `↓ ${value} c.`,
    meterLabel: 'Offset from the nearest note',
    keyboardLabel: 'Piano keyboard from C2 to B6',
    keyboardControl: 'Keyboard control',
    soundSettings: 'Sound samples',
    soundDescription: 'Choose piano or organ. Piano uses recorded velocity layers; organ uses the same choices as volume dynamics.',
    soundLoading: 'Loading samples',
    keyboardInstruments: {
      piano: 'Piano',
      organ: 'Organ'
    },
    soundPresets: {
      velocity1: 'Soft',
      velocity2: 'Light',
      velocity8: 'Full',
      velocity12: 'Strong',
      velocity16: 'Bright'
    },
    selectedNote: 'Selected note',
    status: {
      idle: 'Press start and allow microphone access',
      listening: 'Listening',
      waiting: 'Play or sing one note',
      stopped: 'Stopped',
      micUnavailable: 'Microphone unavailable'
    },
    micError: 'Could not start the microphone'
  },
  ru: {
    title: '\u0420\u0430\u0441\u043f\u0435\u0432\u043a\u0430 \u043f\u043e \u043d\u043e\u0442\u0430\u043c',
    start: '\u0421\u0442\u0430\u0440\u0442',
    stop: '\u0421\u0442\u043e\u043f',
    inactiveSession: '\u0421\u0435\u0441\u0441\u0438\u044f \u043d\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u0430',
    startHint: '\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u043f\u0440\u043e\u0441\u043b\u0443\u0448\u0438\u0432\u0430\u043d\u0438\u0435 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443',
    volume: '\u0413\u0440\u043e\u043c\u043a\u043e\u0441\u0442\u044c',
    inTune: '\u0442\u043e\u0447\u043d\u043e',
    sharp: (value: number) => `\u2191 ${value} \u0446.`,
    flat: (value: number) => `\u2193 ${value} \u0446.`,
    meterLabel: '\u041e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 \u043e\u0442 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0439 \u043d\u043e\u0442\u044b',
    keyboardLabel: '\u0424\u043e\u0440\u0442\u0435\u043f\u0438\u0430\u043d\u043d\u0430\u044f \u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430 \u043e\u0442 C2 \u0434\u043e B6',
    keyboardControl: '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435',
    soundSettings: '\u0421\u044d\u043c\u043f\u043b\u044b',
    soundDescription: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u0438\u0430\u043d\u0438\u043d\u043e \u0438\u043b\u0438 \u043e\u0440\u0433\u0430\u043d. \u041f\u0438\u0430\u043d\u0438\u043d\u043e \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0435\u0442 velocity-\u0441\u043b\u043e\u0438, \u043e\u0440\u0433\u0430\u043d - \u0442\u0435 \u0436\u0435 \u0432\u044b\u0431\u043e\u0440\u044b \u043a\u0430\u043a \u0434\u0438\u043d\u0430\u043c\u0438\u043a\u0443 \u0433\u0440\u043e\u043c\u043a\u043e\u0441\u0442\u0438.',
    soundLoading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430 \u0441\u044d\u043c\u043f\u043b\u043e\u0432',
    keyboardInstruments: {
      piano: '\u041f\u0438\u0430\u043d\u0438\u043d\u043e',
      organ: '\u041e\u0440\u0433\u0430\u043d'
    },
    soundPresets: {
      velocity1: '\u041c\u044f\u0433\u043a\u0438\u0435',
      velocity2: '\u041b\u0435\u0433\u043a\u0438\u0435',
      velocity8: '\u041f\u043e\u043b\u043d\u044b\u0435',
      velocity12: '\u0421\u0438\u043b\u044c\u043d\u044b\u0435',
      velocity16: '\u042f\u0440\u043a\u0438\u0435'
    },
    selectedNote: '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u0430\u044f \u043d\u043e\u0442\u0430',
    status: {
      idle: '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u0441\u0442\u0430\u0440\u0442 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043e\u0441\u0442\u0443\u043f \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443',
      listening: '\u0421\u043b\u0443\u0448\u0430\u044e',
      waiting: '\u0421\u044b\u0433\u0440\u0430\u0439\u0442\u0435 \u0438\u043b\u0438 \u0441\u043f\u043e\u0439\u0442\u0435 \u043e\u0434\u043d\u0443 \u043d\u043e\u0442\u0443',
      stopped: '\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e',
      micUnavailable: '\u041c\u0438\u043a\u0440\u043e\u0444\u043e\u043d \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d'
    },
    micError: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d'
  }
}
