# VocalWarm

Simple Nuxt app for vocal warmups. It listens to the microphone, detects pitch, and shows the nearest note.

Russian documentation: [README.ru.md](README.ru.md)

## Project Notes

- Project folder: `\Documents\Codex\VocalWarm`
- App type: Nuxt 3 single-page app.
- `app.vue` wires the page together and keeps only screen-level state.
- Main UI blocks live in `components/`: `AppHeader.vue`, `StartOverlay.vue`, `PitchReadout.vue`, `WarmupProgram.vue`, `TuningMeter.vue`, `PianoKeyboard.vue`, `KeyboardControls.vue`, and `VolumeMeter.vue`.
- Shared translations live in `utils/i18n.ts`.
- Keyboard instrument sample CDN settings live in `utils/instrumentSamples.ts`.
- Shared note math and keyboard range constants live in `composables/useNoteMath.ts`.
- Keyboard audio, Tone.js sampler preload, instrument / sample preset selection, limiter, instrument volume, and note release timing live in `composables/useKeyboardAudio.ts`.
- Microphone capture, autocorrelation pitch detection, detected note state, volume, and tuner status live in `composables/usePitchDetector.ts`.
- Current screen title in the UI: Russian text meaning "Vocal warmup by notes".
- Interface language is selected from the browser language on first load: Russian for `ru-*`, English otherwise.
- Users can switch the interface manually from the settings menu; the choice is stored in `localStorage` as `vocalwarm-language`.
- The app uses the browser Web Audio API and `navigator.mediaDevices.getUserMedia`.
- Keyboard note playback uses Tone.js (`tone`).
- Piano playback uses Salamander Grand Piano samples through `Tone.Sampler`. Organ playback uses FluidR3 GM church organ samples through a small looping sample player so held notes continue until release.
- Piano samples are loaded from public `@audio-samples/piano-velocity*` packages on jsDelivr. Organ samples are loaded from `gleitz/midi-js-soundfonts` as `church_organ`.
- The settings gear between `Stop` and the info button lets users choose language, note notation, instrument (`Piano` or `Organ`), and dynamic preset: `Soft` (`velocity1`, piano +18 dB), `Light` (`velocity2`, piano +14 dB), `Full` (`velocity8`, piano +8 dB), `Strong` (`velocity12`, piano +4 dB), or `Bright` (`velocity16`, piano +2 dB).
- Piano dynamic presets use recorded velocity layers; organ dynamic presets use playback velocity and gain.
- External piano and organ sample files are cached by `/sample-cache-sw.js` in local development and production.
- The selected instrument is stored in `localStorage` as `vocalwarm-keyboard-instrument`; the selected sample preset is stored as `vocalwarm-sample-preset`. The older `vocalwarm-piano-preset` key is still read for migration.
- The default sample preset is `Bright` (`velocity16`) unless a saved user choice exists.
- Switching sample presets preloads the new sampler immediately and shows a small loading indicator while samples are loading.
- Piano playback is routed through a `Tone.Limiter(-1)` to reduce clipping after sample gain boosts.
- Salamander Grand Piano samples are by Alexander Holm and are licensed under CC BY 3.0.
- The keyboard supports sustained notes while holding a key/pointer, and short taps keep notes active for at least about 0.5 seconds before release.
- Pressed key highlighting fades out over about 0.5 seconds to match the short note hold.
- The selected note is marked on the keyboard with a small red cross.
- `WarmupProgram.vue` adds a "Warmup" / "Распевка" call-and-response exercise above the tuning rail: it can play 3-5 notes up, waits for the singer, plays the same pattern down, waits again, transposes up by semitone, and can show a copyable text report at the end when enabled in settings.
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
- Dev URL: `http://localhost:3000/`.
- Production URL: `https://vocal-warm.selfkit.org`.

## Development Direction

- Keep VocalWarm focused on vocal warmups and pitch feedback.
- Prefer simple, readable Vue/Nuxt code before adding libraries.
- Future useful features: warmup exercises, richer keyboard instrument presets, note history, accuracy scoring, range detection, and localized note naming.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/`. Browser microphone access requires `localhost` or HTTPS.
