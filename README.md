# VocalWarm

Simple Nuxt app for vocal warmups. It listens to the microphone, detects pitch, and shows the nearest note.

Russian documentation: [README.ru.md](README.ru.md)

## Project Notes

- Project folder: `C:\Users\maxim\Documents\Codex\VocalWarm`
- App type: Nuxt 3 single-page app.
- Main UI and pitch logic live in `app.vue`.
- Current screen title in the UI: Russian text meaning "Vocal warmup by notes".
- Interface language is selected from the browser language on first load: Russian for `ru-*`, English otherwise.
- Users can switch the interface manually with the `RU` / `EN` buttons; the choice is stored in `localStorage` as `vocalwarm-language`.
- The app uses the browser Web Audio API and `navigator.mediaDevices.getUserMedia`.
- Pitch detection is implemented with autocorrelation over an `AnalyserNode` time-domain buffer.
- The analyser uses `fftSize = 4096`.
- Microphone constraints intentionally disable `echoCancellation`, `noiseSuppression`, and `autoGainControl` for cleaner pitch tracking.
- Notes are displayed with English note names: `C`, `C#`, `D`, `D#`, `E`, `F`, `F#`, `G`, `G#`, `A`, `A#`, `B`.
- The UI shows nearest note, octave, frequency in Hz, cents offset, tuning meter, a scrollable C2-B6 piano keyboard, volume meter, status, and microphone errors.
- The detected note is highlighted on the keyboard when it is within C2-B6.
- Browser microphone access requires `localhost` or HTTPS.
- The last known dev URL is `http://127.0.0.1:3000/`.

## Development Direction

- Keep VocalWarm focused on vocal warmups and pitch feedback.
- Prefer simple, readable Vue/Nuxt code before adding libraries.
- Future useful features: warmup exercises, target-note playback from the keyboard, note history, accuracy scoring, range detection, and localized note naming.

## Run

```bash
npm install
npm run dev
```

Open the local URL from the terminal. Browser microphone access requires `localhost` or HTTPS.
