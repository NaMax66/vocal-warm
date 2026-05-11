# VocalWarm Dev Notes

This file is for future Codex sessions. Keep it concise and update it when project behavior or workflow assumptions change.

## Workspace

- Project folder: `C:\Users\maxim\Documents\Codex\VocalWarm`
- Dev URL: `http://127.0.0.1:3000/`
- Do not run `npm run build` unless the user explicitly asks.
- Prefer small, direct Vue/Nuxt changes that match the existing component style.

## Current Structure

- `app.vue` wires the screen together and owns top-level UI state.
- `components/AppHeader.vue` contains language controls, the `Stop` button, and the sound preset gear menu.
- `components/PianoKeyboard.vue` renders the scrollable C2-B6 keyboard.
- `components/KeyboardControls.vue` renders the fixed mobile/desktop note control buttons.
- `components/PitchReadout.vue`, `TuningMeter.vue`, and `VolumeMeter.vue` render tuner feedback.
- `composables/useKeyboardAudio.ts` owns Tone.js loading, sampler preload, sample preset selection, limiter, playback, and release timing.
- `composables/usePitchDetector.ts` owns microphone capture and pitch detection.
- `utils/pianoSamples.ts` owns sample CDN URLs and preset gains.
- `utils/i18n.ts` owns RU/EN copy.

## Audio

- Piano playback uses Salamander Grand Piano samples through `Tone.Sampler`.
- Samples load from jsDelivr packages named `@audio-samples/piano-velocity*`.
- Current presets in `utils/pianoSamples.ts`:
  - `velocity1` / Soft / ru: Myagkie / `+14 dB`
  - `velocity2` / Light / ru: Legkie / `+10 dB`
  - `velocity8` / Full / ru: Polnye / `+8 dB`
  - `velocity12` / Strong / ru: Silnye / `+4 dB`
  - `velocity16` / Bright / ru: Yarkie / `+2 dB`
- Default preset is `velocity16` unless `localStorage` has a saved choice.
- Piano output is routed through `Tone.Limiter(-1)`.
- On preset change, the sampler is disposed, recreated, and preloaded immediately.
- `isPianoSamplerLoading` drives the gear spinner and loading label.
- Short taps should keep a note active for at least about `0.5s`; release is also `0.5s`.
- `pressedMidi` highlighting is delayed to match the short-tap minimum duration.
- When Space is held and the selected note changes with arrows, the previous note should release immediately and the next selected note should start immediately.
- Voice-detected keyboard highlighting should fade in smoothly but disappear immediately when the detected note changes or drops. Manual `pressedMidi` key highlighting should keep smooth transitions both ways.

## UI Behavior

- Interface language defaults from browser language: RU for `ru-*`, EN otherwise.
- Language switch is in the top-right control cluster.
- Note notation switch is next to language and toggles letter notes (`C`) versus solfege (`До`). It changes display labels only; Tone.js playback still uses letter note names internally.
- Sound preset gear sits under the `Stop` button, near the right edge.
- Sound menu includes a short explanation of velocity layers and closes on outside click.
- The selected keyboard note has a small red ASCII `x` marker. Use ASCII here to avoid encoding weirdness in shell output.
- Keyboard key heights were increased about 10%.
- Mobile control buttons are fixed at the bottom and use taller tap targets.
- The hint text under the arrow/Space controls was intentionally removed.
- Do not show numeric cents offset in the readout or beside the pitch monitor.
- `TuningMeter.vue` is an aircraft-navigation-style pitch monitor: one horizontal rail, a 25vw moving section that shifts very smoothly up/down from cents offset, and the whole rail glows green when aligned within about `10` cents. Do not restore numeric `-50/+50` labels or the old vertical needle meter.
- Pitch monitor tuning constants live in `app.vue`: `pitchMeterMaxOffsetPx` controls vertical travel from center, `pitchMeterSmoothnessMs` controls movement duration, and `pitchMeterGreenZoneCents` controls the centered green zone. The exact center is `0` cents from the nearest exact note; between notes is around `+/-50` cents and should be visually away from center.
- Button text selection is disabled globally.
- Mobile viewport scaling is disabled with `maximum-scale=1, user-scalable=no`.
- Mobile long-press browser effects are suppressed on note/control buttons with `touch-action`, disabled callout, transparent tap highlight, and prevented context menus where notes are held.

## Local Storage

- `vocalwarm-language`: selected UI language.
- `vocalwarm-note-notation`: selected note notation (`letter` or `solfege`).
- `vocalwarm-piano-preset`: selected piano sample preset.
- `vocalwarm-selected-midi`: selected note for Space / arrow controls.
- `vocalwarm-keyboard-scroll-left`: horizontal scroll position of the piano keyboard.

## Docs

- Keep `README.md` and `README.ru.md` in sync with behavior.
- Current README files document sample presets, localStorage keys, limiter, preload behavior, outside-click menu closing, selected-note marker, short-tap release behavior, and keyboard scroll persistence.

## Verification

- Lightweight checks used so far:
  - `git diff --check`
  - `Invoke-WebRequest -Uri http://127.0.0.1:3000/ -UseBasicParsing | Select-Object StatusCode,StatusDescription`
  - In-app browser smoke check and console error check when useful.
- Build has intentionally not been run during this work.
