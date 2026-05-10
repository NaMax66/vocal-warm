# VocalWarm

Simple Nuxt app for vocal warmups. It listens to the microphone, detects pitch, and shows the nearest note.

Russian documentation: [README.ru.md](README.ru.md)

## Project Notes

- Project folder: `\Documents\Codex\VocalWarm`
- App type: Nuxt 3 single-page app.
- `app.vue` wires the page together and keeps only screen-level state.
- Main UI blocks live in `components/`: `AppHeader.vue`, `StartOverlay.vue`, `PitchReadout.vue`, `TuningMeter.vue`, `PianoKeyboard.vue`, `KeyboardControls.vue`, and `VolumeMeter.vue`.
- Shared translations live in `utils/i18n.ts`.
- Piano sample CDN settings live in `utils/pianoSamples.ts`.
- Shared note math and keyboard range constants live in `composables/useNoteMath.ts`.
- Keyboard audio, Tone.js sampler preload, sample preset selection, limiter, instrument volume, and note release timing live in `composables/useKeyboardAudio.ts`.
- Microphone capture, autocorrelation pitch detection, detected note state, volume, and tuner status live in `composables/usePitchDetector.ts`.
- Current screen title in the UI: Russian text meaning "Vocal warmup by notes".
- Interface language is selected from the browser language on first load: Russian for `ru-*`, English otherwise.
- Users can switch the interface manually with the `RU` / `EN` buttons; the choice is stored in `localStorage` as `vocalwarm-language`.
- The app uses the browser Web Audio API and `navigator.mediaDevices.getUserMedia`.
- Keyboard note playback uses Tone.js (`tone`).
- Keyboard playback uses Salamander Grand Piano samples through `Tone.Sampler`.
- Piano samples are loaded from public `@audio-samples/piano-velocity*` packages on jsDelivr.
- The sound settings gear under the `Stop` button lets users choose the piano velocity layer: `Soft` (`velocity1`, +18 dB), `Light` (`velocity2`, +14 dB), `Full` (`velocity8`, +8 dB), `Strong` (`velocity12`, +4 dB), or `Bright` (`velocity16`, +2 dB).
- The selected sample preset is stored in `localStorage` as `vocalwarm-piano-preset`.
- Switching sample presets preloads the new sampler immediately and shows a small loading indicator while samples are loading.
- Piano playback is routed through a `Tone.Limiter(-1)` to reduce clipping after sample gain boosts.
- Salamander Grand Piano samples are by Alexander Holm and are licensed under CC BY 3.0.
- The keyboard supports sustained notes while holding a key/pointer, and short taps keep notes active for at least about 0.5 seconds before release.
- Pressed key highlighting fades out over about 0.5 seconds to match the short note hold.
- The selected note is marked on the keyboard with a small red cross.
- The note control selects C2-B6 with arrow keys; holding Space sustains the selected note.
- The selected note for Space control is stored in `localStorage` as `vocalwarm-selected-midi`.
- The keyboard horizontal scroll position is stored in `localStorage` as `vocalwarm-keyboard-scroll-left`.
- The sound settings menu closes when clicking outside it.
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
- Future useful features: warmup exercises, richer keyboard instrument presets, note history, accuracy scoring, range detection, and localized note naming.

## Run

```bash
npm install
npm run dev
```

Open the local URL from the terminal. Browser microphone access requires `localhost` or HTTPS.
