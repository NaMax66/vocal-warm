# VocalWarm Dev Notes

This file is for future Codex sessions. Keep it concise and update it when project behavior or workflow assumptions change.

## Workspace

- Project folder: `C:\Users\maxim\Documents\Codex\VocalWarm`
- Dev URL: `http://localhost:3000/`
- Production URL: `https://vocal-warm.selfkit.org`
- Do not run `npm run build` unless the user explicitly asks.
- Dev-only layout hack: set `NUXT_PUBLIC_MIC_BAN_LAYOUT_HACK=1` to fall back after microphone permission denial. Always try the real microphone first; only start the fake stable `C4` active session if mic startup fails, so normal browsers with mic access still use real input. Runtime config may expose the flag as number `1` or string `'1'`; treat both as enabled. Keep it off outside local layout work.
- Prefer small, direct Vue/Nuxt changes that match the existing component style.

## Current Structure

- `app.vue` wires the screen together and owns top-level UI state.
- `components/AppHeader.vue` contains the `Stop` button, a wide settings gear menu for language / note notation / samples, and the info popover.
- `components/PianoKeyboard.vue` renders the scrollable C2-B6 keyboard.
- `components/PianoKeyboard.vue` exposes scroll helpers for non-invasive keyboard navigation: center a note range before warmups and bring the selected Space note into view only when it is currently offscreen.
- `components/KeyboardControls.vue` renders the fixed mobile/desktop note control buttons.
- `components/PitchReadout.vue`, `WarmupProgram.vue`, `NoteHoldExercise.vue`, `TuningMeter.vue`, and `VolumeMeter.vue` render tuner feedback and guided exercises.
- `composables/useKeyboardAudio.ts` owns Tone.js loading, sampler preload, instrument / sample preset selection, limiter, playback, and release timing.
- `composables/usePitchDetector.ts` owns microphone capture and pitch detection.
- `composables/useAppPreferences.ts` owns persisted app-level preferences and localStorage key migration.
- `composables/useStablePitchReadout.ts` owns delayed large-note readout state and timers.
- `composables/useSelectedNoteControls.ts` owns Space / arrow-key selected-note controls and hold state.
- `composables/useInactiveTabStop.ts` owns the hidden-tab stop timer.
- `utils/instrumentSamples.ts` owns sample CDN URLs, instrument definitions, and preset gains.
- `utils/instrumentSamples.ts` exposes the keyboard instrument registry contract: each instrument provides instrument creation, gain, and attack velocity for the selected dynamic preset. Add new instruments there instead of adding instrument-specific branches to `useKeyboardAudio.ts`.
- `plugins/register-sample-cache.client.ts` registers `/sample-cache-sw.js` so external piano sample files are cached in local development and production without intercepting app/HMR requests.
- `utils/i18n.ts` owns RU/EN copy.

## Audio

- Piano playback uses Salamander Grand Piano samples through `Tone.Sampler`.
- Organ playback uses FluidR3 GM church organ samples through a small looping sample player, because regular `Tone.Sampler` plays those soundfont samples as short one-shot buffers.
- Microphone startup uses `window.AudioContext` with `webkitAudioContext` fallback and resumes suspended contexts. It first requests raw-ish audio with `echoCancellation`, `noiseSuppression`, and `autoGainControl` disabled, then falls back to `{ audio: true }` if those constraints fail for Apple/Safari compatibility. Sustained singing can disappear on phone browsers when default noise suppression / auto gain treats the note as background.
- Piano samples load from jsDelivr packages named `@audio-samples/piano-velocity*`.
- Sample requests are cached in CacheStorage `vocalwarm-sample-cache-v1`. The service worker caches piano OGG files and the organ soundfont script so repeated local reloads avoid re-downloading them.
- Current presets in `utils/instrumentSamples.ts`:
  - `velocity1` / Soft / ru: Myagkie / `+18 dB`
  - `velocity2` / Light / ru: Legkie / `+14 dB`
  - `velocity8` / Full / ru: Polnye / `+8 dB`
  - `velocity12` / Strong / ru: Silnye / `+4 dB`
  - `velocity16` / Bright / ru: Yarkie / `+2 dB`
- Default preset is `velocity16` unless `localStorage` has a saved choice.
- Piano output is routed through `Tone.Limiter(-1)`.
- On preset change, the sampler is disposed, recreated, and preloaded immediately.
- Organ does not have separate recorded velocity layers; the shared dynamic presets map to playback velocity plus gain.
- `unlockKeyboardAudio()` is called directly from the Start click path before microphone startup so iOS Safari gets a user-gesture audio unlock before later async sample playback.
- `isKeyboardSamplerLoading` drives the gear spinner and loading label.
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
- `WarmupProgram.vue` is intentionally self-contained. It renders the "Распевка" button above the tuning rail, plays configurable 3-5 note ascending then descending call-and-response patterns, waits for sung pitch in `awaitSungPattern()`, transposes by semitone, and can open a copyable text report modal when enabled in settings.
- Large pitch note readout appears only after the same detected note remains stable for `3s`, fades in, and waits briefly before disappearing on note drop/change so small voice slips do not blink it away.
- The hint text under the arrow/Space controls was intentionally removed.
- Do not show numeric cents offset in the readout or beside the pitch monitor.
- `TuningMeter.vue` is an aircraft-navigation-style pitch monitor: one horizontal rail, a 25vw moving section that shifts up/down from cents offset, and the whole rail glows green when aligned within about `10` cents. It currently shows debug scale labels: `+50c` top, `0` center, `-50c` bottom.
- Pitch monitor tuning constants live in `TuningMeter.vue`: `pitchMeterMaxOffsetPx` controls vertical travel from center, `pitchMeterSmoothnessMs` controls movement duration, `pitchMeterGreenZoneCents` controls the centered green zone, and `pitchMeterDirection = -1` means higher pitch moves up. The exact center is `0` cents from the nearest exact note; between notes is around `+/-50` cents and should be visually away from center.
- `TuningMeter.vue` supports normal mode and target-note mode. Normal mode reads nearest-note `cents`; target mode receives `targetMidi`, compares microphone `frequency` to that exact note, and parks the indicator at `-50c` when there is no sung frequency.
- `NoteHoldExercise.vue` renders a single `Train note` / `Тренировать ноту` button. It waits for one played key, sets that key as the tuning target, then plays it 5 times for `2s` with `3s` pauses.
- Button text selection is disabled globally.
- Mobile viewport scaling is disabled with `maximum-scale=1, user-scalable=no`.
- Mobile long-press browser effects are suppressed on note/control buttons with `touch-action`, disabled callout, transparent tap highlight, and prevented context menus where notes are held.
- Mobile landscape keeps page vertical scrolling available and the piano keyboard uses native horizontal pan / momentum scroll.
- Warmup start asks `PianoKeyboard.vue` to smoothly center the full upcoming melody range. Space / arrow selected-note playback asks the keyboard to scroll only if the played note is currently outside the visible keyboard viewport.

## Local Storage

- `vocalwarm-language`: selected UI language.
- `vocalwarm-note-notation`: selected note notation (`letter` or `solfege`).
- `vocalwarm-show-warmup-report`: opens the warmup report modal after a completed warmup when set to `1`; default is off.
- `vocalwarm-keyboard-instrument`: selected keyboard instrument (`piano` or `organ`).
- `vocalwarm-sample-preset`: selected dynamic/sample preset.
- `vocalwarm-piano-preset`: legacy selected piano sample preset; still read as a fallback for migration.
- `vocalwarm-selected-midi`: selected note for Space / arrow controls.
- `vocalwarm-keyboard-scroll-left`: horizontal scroll position of the piano keyboard.

## Docs

- Keep `README.md` and `README.ru.md` in sync with behavior.
- Current README files document instrument and sample presets, localStorage keys, limiter, preload behavior, outside-click menu closing, selected-note marker, short-tap release behavior, and keyboard scroll persistence.

## Refactoring Direction

- Keep `app.vue` as an orchestrator: top-level session state, persisted settings, microphone/audio composables, and event wiring between widgets.
- Keep persisted app settings, readout timers, selected-note controls, and hidden-tab timers in their composables instead of growing `app.vue`.
- Keep instrument-specific sample source and dynamic behavior behind the registry in `utils/instrumentSamples.ts`; `useKeyboardAudio.ts` should stay generic over the selected instrument.
- Keep widget-specific behavior inside the widget component. For example, `TuningMeter.vue` owns rail geometry, target-note display logic, green-zone decisions, motion duration, direction, and scale labels.
- Keep keyboard scroll math inside `PianoKeyboard.vue`; parent components should use its exposed methods instead of querying key DOM directly.
- Keep each exercise self-contained (`WarmupProgram.vue`, `NoteHoldExercise.vue`) with its own phase machine, prompts, timing constants, and note playback requests. Exercises should emit events instead of reaching into audio or detector composables directly.
- If exercises grow beyond a few independent components, introduce a small exercise contract or switcher around `targetMidi`, running state, prompt text, and `noteStart` / `noteEnd` events instead of expanding `app.vue`.
- Move new RU/EN strings toward `utils/i18n.ts` when the copy stabilizes; short experimental exercise labels may live locally while behavior is still being shaped.

## TODO

- Fix simultaneous piano playback and pitch detection so playing a sample does not break or confuse microphone pitch tracking.
- Add installable PWA manifest and offline app shell support.
- Add a debug menu that works in production and can toggle key runtime settings.
- Add keyboard blocking with clear loading text while piano samples are loading.
- Make note central showing delay less

## Verification

- Lightweight checks used so far:
  - `git diff --check`
  - `Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing | Select-Object StatusCode,StatusDescription`
  - In-app browser smoke check and console error check when useful.
- Build has intentionally not been run during this work.
