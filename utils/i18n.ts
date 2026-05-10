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
    waitingForSound: 'Waiting for a steady sound',
    inTune: 'in tune',
    sharp: (value: number) => `${value} c. sharp`,
    flat: (value: number) => `${value} c. flat`,
    meterLabel: 'Offset from the nearest note',
    keyboardLabel: 'Piano keyboard from C2 to B6',
    keyboardControl: 'Keyboard control',
    selectedNote: 'Selected note',
    holdHint: 'Use arrows to move. Hold Space to sustain.',
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
    waitingForSound: '\u0416\u0434\u0443 \u0443\u0441\u0442\u043e\u0439\u0447\u0438\u0432\u044b\u0439 \u0437\u0432\u0443\u043a',
    inTune: '\u0442\u043e\u0447\u043d\u043e',
    sharp: (value: number) => `\u0432\u044b\u0448\u0435 \u043d\u0430 ${value} \u0446.`,
    flat: (value: number) => `\u043d\u0438\u0436\u0435 \u043d\u0430 ${value} \u0446.`,
    meterLabel: '\u041e\u0442\u043a\u043b\u043e\u043d\u0435\u043d\u0438\u0435 \u043e\u0442 \u0431\u043b\u0438\u0436\u0430\u0439\u0448\u0435\u0439 \u043d\u043e\u0442\u044b',
    keyboardLabel: '\u0424\u043e\u0440\u0442\u0435\u043f\u0438\u0430\u043d\u043d\u0430\u044f \u043a\u043b\u0430\u0432\u0438\u0430\u0442\u0443\u0440\u0430 \u043e\u0442 C2 \u0434\u043e B6',
    keyboardControl: '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435',
    selectedNote: '\u0412\u044b\u0431\u0440\u0430\u043d\u043d\u0430\u044f \u043d\u043e\u0442\u0430',
    holdHint: '\u0421\u0442\u0440\u0435\u043b\u043a\u0438 \u0434\u0432\u0438\u0433\u0430\u044e\u0442. \u041f\u0440\u043e\u0431\u0435\u043b \u0443\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442 \u0437\u0432\u0443\u043a.',
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
