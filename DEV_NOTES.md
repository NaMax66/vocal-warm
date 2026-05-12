# VocalWarm Dev Notes

This file is for future Codex sessions. Keep it concise and update it when project behavior or workflow assumptions change.

## Workspace

- Project folder: `C:\Users\maxim\Documents\Codex\VocalWarm`
- Dev URL: `http://127.0.0.1:3000/`
- Do not run `npm run build` unless the user explicitly asks.
- Dev-only layout hack: set `NUXT_PUBLIC_MIC_BAN_LAYOUT_HACK=1` to fall back after microphone permission denial. Always try the real microphone first; only start the fake stable `C4` active session if mic startup fails, so normal browsers with mic access still use real input. Runtime config may expose the flag as number `1` or string `'1'`; treat both as enabled. Keep it off outside local layout work.
- Prefer small, direct Vue/Nuxt changes that match the existing component style.

## Current Structure

- `app.vue` wires the screen together and owns top-level UI state.
- `components/AppHeader.vue` contains the `Stop` button, a wide settings gear menu for language / note notation / samples, and the info popover.
- `components/PianoKeyboard.vue` renders the scrollable C2-B6 keyboard.
- `components/KeyboardControls.vue` renders the fixed mobile/desktop note control buttons.
- `components/PitchReadout.vue`, `TuningMeter.vue`, and `VolumeMeter.vue` render tuner feedback.
- `composables/useKeyboardAudio.ts` owns Tone.js loading, sampler preload, sample preset selection, limiter, playback, and release timing.
- `composables/usePitchDetector.ts` owns microphone capture and pitch detection.
- `utils/pianoSamples.ts` owns sample CDN URLs and preset gains.
- `utils/i18n.ts` owns RU/EN copy.

## Audio

- Piano playback uses Salamander Grand Piano samples through `Tone.Sampler`.
- Microphone startup uses `window.AudioContext` with `webkitAudioContext` fallback, resumes suspended contexts, and requests `{ audio: true }` for Apple/Safari compatibility. Avoid restoring strict `echoCancellation/noiseSuppression/autoGainControl` constraints unless tested on iOS.
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
- App name, version, repo link, and Salamander Grand Piano / CC BY 3.0 sample attribution live in the `i` info popover.
- The large brand/title header is visible before listening starts, then hidden during the active singing UI.
- Start overlay is intentionally clickable as a whole, with the topbar above it, so in-app browser clicks can start the dev mic-ban layout hack reliably.
- If the tab stays hidden for 30 seconds while listening, the app calls `stopListening()` and returns to inactive mode. Returning to the tab before 30 seconds cancels the timeout.
- Note notation switch lives in the settings gear menu and toggles letter notes (`C`) versus solfege (`До`). It changes display labels only; Tone.js playback still uses letter note names internally.
- Settings gear sits between the `Stop` button and the info button near the right edge.
- Settings menu includes language, notation, a short explanation of velocity layers, and sample preset choices; it closes when clicking outside it.
- The selected keyboard note has a small red ASCII `x` marker. Use ASCII here to avoid encoding weirdness in shell output.
- Keyboard key heights were increased about 10%.
- Keyboard control buttons should stay centered as a compact group on desktop and centered within the fixed mobile pad.
- Mobile control buttons are fixed at the bottom and use taller tap targets.
- Volume meter has no visible text labels; keep only the bars and an accessibility label.
- Large pitch note readout appears only after the same detected note remains stable for `3s`, fades in, and waits briefly before disappearing on note drop/change so small voice slips do not blink it away.
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
