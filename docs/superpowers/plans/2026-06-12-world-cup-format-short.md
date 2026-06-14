# World Cup Format Short Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and verify a 33-35 second, 1080x1920 English YouTube Short that explains the 2026 World Cup format using original Broadcast Energy motion graphics, generated stadium backgrounds, male narration, and original audio.

**Architecture:** A small Node.js production tool owns the canonical timeline, renders deterministic SVG overlays with Sharp, and streams composited frames into FFmpeg. Seedance supplies four text-free atmospheric background clips, Windows SAPI supplies the approved male English narration, and a generated WAV bed supplies music and effects without copyright risk.

**Tech Stack:** Node.js 22, `node:test`, Sharp, `ffmpeg-static`, Windows PowerShell/System.Speech, Seedance 2.0, MP4/H.264/AAC.

---

## File Map

- Create: `tools/world-cup-short/package.json` - local commands and pinned dependencies.
- Create: `tools/world-cup-short/src/timeline.mjs` - canonical script, scenes, captions, colors, and timing.
- Create: `tools/world-cup-short/src/render-frame.mjs` - frame-level SVG motion graphics.
- Create: `tools/world-cup-short/src/audio.mjs` - original sports bed, bass hits, risers, and crowd-like noise.
- Create: `tools/world-cup-short/src/render-video.mjs` - background normalization, frame streaming, audio mix, and MP4 encoding.
- Create: `tools/world-cup-short/scripts/synthesize-voice.ps1` - Microsoft David narration to WAV.
- Create: `tools/world-cup-short/scripts/build.ps1` - one-command production entry point.
- Create: `tools/world-cup-short/test/timeline.test.mjs` - timing and factual-content tests.
- Create: `tools/world-cup-short/test/render-frame.test.mjs` - SVG output and safe-area tests.
- Create: `tools/world-cup-short/test/audio.test.mjs` - WAV duration and peak-level tests.
- Create: `tools/world-cup-short/test/validate-output.mjs` - final MP4 metadata and decode validation.
- Generate: `tools/world-cup-short/assets/backgrounds/scene-01.mp4` through `scene-04.mp4`.
- Generate: `tools/world-cup-short/build/voice.wav`, `bed.wav`, and intermediate MP4 files.
- Generate: `tools/world-cup-short/output/world-cup-format-changed-forever.mp4`.
- Generate: `tools/world-cup-short/output/contact-sheet.jpg` for visual inspection.

### Task 1: Scaffold The Production Tool

**Files:**
- Create: `tools/world-cup-short/package.json`
- Create: `tools/world-cup-short/.gitignore`

- [ ] **Step 1: Create the package manifest**

```json
{
  "name": "world-cup-format-short",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/*.test.mjs",
    "render": "node src/render-video.mjs",
    "validate": "node test/validate-output.mjs"
  },
  "dependencies": {
    "ffmpeg-static": "5.2.0",
    "sharp": "0.34.2"
  }
}
```

- [ ] **Step 2: Ignore generated media and dependencies**

```gitignore
node_modules/
build/
output/
assets/backgrounds/*.mp4
```

- [ ] **Step 3: Install pinned dependencies**

Run:

```powershell
rtk npm install --prefix tools/world-cup-short
```

Expected: `node_modules/ffmpeg-static` and `node_modules/sharp` exist with no audit-blocking install error.

- [ ] **Step 4: Verify the FFmpeg binary**

Run:

```powershell
rtk powershell -Command "& '.\tools\world-cup-short\node_modules\ffmpeg-static\ffmpeg.exe' -version"
```

Expected: output begins with `ffmpeg version`.

- [ ] **Step 5: Commit the scaffold**

```powershell
rtk git add tools/world-cup-short/package.json tools/world-cup-short/package-lock.json tools/world-cup-short/.gitignore
rtk git commit -m "build: scaffold World Cup short renderer"
```

### Task 2: Define And Test The Canonical Timeline

**Files:**
- Create: `tools/world-cup-short/src/timeline.mjs`
- Create: `tools/world-cup-short/test/timeline.test.mjs`

- [ ] **Step 1: Write timing and factual-content tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { DURATION, scenes, voiceScript } from "../src/timeline.mjs";

test("timeline is continuous and exactly 35 seconds", () => {
  assert.equal(DURATION, 35);
  assert.equal(scenes[0].start, 0);
  assert.equal(scenes.at(-1).end, DURATION);
  for (let index = 1; index < scenes.length; index += 1) {
    assert.equal(scenes[index - 1].end, scenes[index].start);
  }
});

test("timeline contains the approved factual claims", () => {
  assert.match(voiceScript, /48 teams instead of 32/i);
  assert.match(voiceScript, /12 groups/i);
  assert.match(voiceScript, /eight best third-place teams/i);
  assert.match(voiceScript, /fair-play points/i);
});

test("captions stay short enough for a vertical phone frame", () => {
  for (const scene of scenes) {
    for (const caption of scene.captions) {
      assert.ok(caption.length <= 31, `${caption} is too long`);
    }
  }
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
```

Expected: FAIL because `src/timeline.mjs` does not exist.

- [ ] **Step 3: Implement the timeline**

```js
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const DURATION = 35;

export const palette = {
  navy: "#071631",
  blue: "#124B96",
  red: "#D20B35",
  yellow: "#FFDC38",
  white: "#FFFFFF",
  green: "#18B66B"
};

export const voiceScript = [
  "The World Cup is not the same anymore.",
  "For the first time, we have 48 teams instead of 32.",
  "That means 12 groups, four teams in each group, and here's the crazy part:",
  "You don't even need to finish top two to survive.",
  "The eight best third-place teams can still reach the knockout stage.",
  "So now, one goal difference, one late goal, even fair-play points from yellow cards could decide everything.",
  "This World Cup is going to be more chaotic than ever.",
  "So tell me: is the new format better, or did FIFA ruin it?"
].join(" ");

export const scenes = [
  { id: "hook", start: 0, end: 2, background: 1, captions: ["THE WORLD CUP", "CHANGED FOREVER"] },
  { id: "expansion", start: 2, end: 6, background: 1, captions: ["48 TEAMS", "NOT 32"] },
  { id: "groups", start: 6, end: 11, background: 2, captions: ["12 GROUPS", "OF 4"] },
  { id: "third-place", start: 11, end: 18, background: 2, captions: ["THIRD PLACE", "CAN QUALIFY"] },
  { id: "fine-margins", start: 18, end: 25, background: 3, captions: ["ONE GOAL", "MATTERS"] },
  { id: "chaos", start: 25, end: 32, background: 4, captions: ["PURE CHAOS"] },
  { id: "cta", start: 32, end: 35, background: 4, captions: ["BETTER OR RUINED?", "COMMENT BELOW"] }
];

export function sceneAt(time) {
  return scenes.find((scene) => time >= scene.start && time < scene.end) ?? scenes.at(-1);
}
```

- [ ] **Step 4: Run tests**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
```

Expected: three timeline tests PASS.

- [ ] **Step 5: Commit the timeline**

```powershell
rtk git add tools/world-cup-short/src/timeline.mjs tools/world-cup-short/test/timeline.test.mjs
rtk git commit -m "feat: define World Cup short timeline"
```

### Task 3: Generate Original Background Clips

**Files:**
- Generate: `tools/world-cup-short/assets/backgrounds/scene-01.mp4`
- Generate: `tools/world-cup-short/assets/backgrounds/scene-02.mp4`
- Generate: `tools/world-cup-short/assets/backgrounds/scene-03.mp4`
- Generate: `tools/world-cup-short/assets/backgrounds/scene-04.mp4`

- [ ] **Step 1: Generate the hook and expansion background**

Use Seedance 2.0, `9:16`, `1080p`, 6 seconds, no audio:

```text
Original abstract football broadcast opener, dark navy world map made from glowing dots, generic international flag colors sweeping past, dramatic stadium floodlights, energetic forward camera push, blue red and yellow sports-news palette, no logos, no readable text, no trophy replicas, no broadcast footage, vertical social video
```

- [ ] **Step 2: Generate the groups background**

Use Seedance 2.0, `9:16`, `1080p`, 12 seconds, no audio:

```text
Original modern football stadium seen from high above at night, clean green pitch geometry, blue and navy atmosphere, subtle red light streaks, slow controlled camera drift, empty center area for infographic overlays, no logos, no readable text, no identifiable teams, vertical social video
```

- [ ] **Step 3: Generate the fine-margins background**

Use Seedance 2.0, `9:16`, `1080p`, 8 seconds, no audio:

```text
Original close cinematic view of a generic football rolling beside a white goal line under stadium lights, tense slow motion, scoreboard-like light flickers in navy red and yellow, no players, no logos, no readable text, no broadcast footage, vertical social video
```

- [ ] **Step 4: Generate the chaos and CTA background**

Use Seedance 2.0, `9:16`, `1080p`, 12 seconds, no audio:

```text
Original generic football crowd silhouettes waving unbranded colorful flags under bright stadium floodlights, energetic but clean sports-commercial style, navy blue red and golden yellow lighting, center kept readable for captions, no logos, no readable text, no identifiable people, vertical social video
```

- [ ] **Step 5: Download each successful output under its exact target filename**

Expected: all four files exist and each opens as a vertical MP4 without a watermark.

### Task 4: Synthesize The Male Voice-over

**Files:**
- Create: `tools/world-cup-short/scripts/synthesize-voice.ps1`
- Generate: `tools/world-cup-short/build/voice.wav`

- [ ] **Step 1: Create the PowerShell narration script**

```powershell
param(
  [Parameter(Mandatory = $true)][string]$OutputPath
)

Add-Type -AssemblyName System.Speech
$scriptText = @"
The World Cup is not the same anymore.
For the first time, we have 48 teams instead of 32.
That means 12 groups, four teams in each group, and here's the crazy part:
You don't even need to finish top two to survive.
The eight best third-place teams can still reach the knockout stage.
So now, one goal difference, one late goal, even fair-play points from yellow cards could decide everything.
This World Cup is going to be more chaotic than ever.
So tell me: is the new format better, or did FIFA ruin it?
"@

$directory = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $directory | Out-Null

$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speaker.SelectVoice("Microsoft David Desktop")
$speaker.Rate = 2
$speaker.Volume = 100
$speaker.SetOutputToWaveFile($OutputPath)
$speaker.Speak($scriptText)
$speaker.Dispose()
```

- [ ] **Step 2: Generate narration**

Run:

```powershell
rtk powershell -ExecutionPolicy Bypass -File tools/world-cup-short/scripts/synthesize-voice.ps1 -OutputPath tools/world-cup-short/build/voice.wav
```

Expected: `voice.wav` exists, is intelligible, and is no longer than 35 seconds.

- [ ] **Step 3: Listen for clipped words and unnatural pauses**

If the read exceeds 35 seconds, remove `from yellow cards` from both the narration script and `voiceScript`. Do not increase the voice rate above `2`.

- [ ] **Step 4: Commit the narration script**

```powershell
rtk git add tools/world-cup-short/scripts/synthesize-voice.ps1
rtk git commit -m "feat: add male World Cup narration"
```

### Task 5: Render Deterministic Broadcast Graphics

**Files:**
- Create: `tools/world-cup-short/src/render-frame.mjs`
- Create: `tools/world-cup-short/test/render-frame.test.mjs`

- [ ] **Step 1: Write frame-rendering tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { renderOverlaySvg } from "../src/render-frame.mjs";

test("expansion frame contains the approved numbers", () => {
  const svg = renderOverlaySvg(3);
  assert.match(svg, />32</);
  assert.match(svg, />48</);
});

test("group frame contains groups A through L", () => {
  const svg = renderOverlaySvg(8);
  for (const label of "ABCDEFGHIJKL") assert.match(svg, new RegExp(`>${label}<`));
});

test("third-place frame names eight qualifying teams", () => {
  const svg = renderOverlaySvg(15);
  assert.match(svg, /8 BEST THIRD-PLACE TEAMS/);
});

test("all primary text stays inside the 120px safe margin", () => {
  const svg = renderOverlaySvg(34);
  assert.doesNotMatch(svg, /x="[0-9]{1,2}"/);
  assert.doesNotMatch(svg, /y="18[1-9][0-9]"/);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
```

Expected: FAIL because `render-frame.mjs` does not exist.

- [ ] **Step 3: Implement frame-level SVG**

`render-frame.mjs` must export:

```js
export function renderOverlaySvg(time) {
  const scene = sceneAt(time);
  const local = (time - scene.start) / (scene.end - scene.start);
  const enter = easeOutBack(Math.min(1, local * 4));
  const pulse = 1 + Math.sin(time * Math.PI * 4) * 0.018;

  const sceneBody = {
    hook: hookSvg(enter),
    expansion: expansionSvg(enter, pulse),
    groups: groupsSvg(enter),
    "third-place": thirdPlaceSvg(enter),
    "fine-margins": fineMarginsSvg(time, enter),
    chaos: chaosSvg(enter),
    cta: ctaSvg(enter)
  }[scene.id];

  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920"
    xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow"><feDropShadow dx="8" dy="10" stdDeviation="0" flood-color="#071631"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="rgba(7,22,49,.18)"/>
    ${sceneBody}
  </svg>`;
}
```

Implement the seven scene helpers with these exact visual requirements:

- `hookSvg`: white two-line title, yellow underline, red `FORMAT UPDATE` ticker.
- `expansionSvg`: white `32`, yellow `48`, red arrow, `48 TEAMS. NOT 32.` lower third.
- `groupsSvg`: a 4x3 grid containing A-L with yellow active tiles.
- `thirdPlaceSvg`: table rows `1ST`, `2ND`, `3RD`; `3RD` flips from `?` to a green check; footer says `8 BEST THIRD-PLACE TEAMS`.
- `fineMarginsSvg`: three score strips `+1`, `0`, `-1`, then a yellow card and `FAIR PLAY` meter.
- `chaosSvg`: `ONE LATE GOAL` transitions to `PURE CHAOS`.
- `ctaSvg`: blue/red split card containing `BETTER` and `RUINED?`, with `COMMENT BELOW`.

Use `C:/Windows/Fonts/impact.ttf` for headlines and `C:/Windows/Fonts/arialbd.ttf` for secondary labels through SVG `@font-face`.

- [ ] **Step 4: Run tests**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
```

Expected: all timeline and frame tests PASS.

- [ ] **Step 5: Commit graphics**

```powershell
rtk git add tools/world-cup-short/src/render-frame.mjs tools/world-cup-short/test/render-frame.test.mjs
rtk git commit -m "feat: render Broadcast Energy graphics"
```

### Task 6: Generate Original Music And Effects

**Files:**
- Create: `tools/world-cup-short/src/audio.mjs`
- Create: `tools/world-cup-short/test/audio.test.mjs`
- Generate: `tools/world-cup-short/build/bed.wav`

- [ ] **Step 1: Write WAV tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildBedSamples } from "../src/audio.mjs";

test("audio bed is exactly 35 seconds at 48 kHz", () => {
  const samples = buildBedSamples();
  assert.equal(samples.length, 35 * 48000 * 2);
});

test("audio bed leaves voice-over headroom", () => {
  const samples = buildBedSamples();
  const peak = samples.reduce((max, sample) => Math.max(max, Math.abs(sample)), 0);
  assert.ok(peak <= 0.72);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
```

Expected: FAIL because `audio.mjs` does not exist.

- [ ] **Step 3: Implement the stereo audio bed**

`audio.mjs` must:

- Generate 48 kHz stereo Float32 samples for exactly 35 seconds.
- Add a 58 Hz decaying bass hit at `0.0` and `2.0` seconds.
- Add low-volume kick pulses at 120 BPM.
- Add filtered deterministic noise risers before `6`, `11`, `18`, `25`, and `32` seconds.
- Add a low crowd-like filtered noise layer from `25` through `32` seconds.
- Fade all music to silence from `32.0` through `34.2` seconds so the final question lands cleanly.
- Clamp the final sample peak to `0.72`.
- Export `writeBedWav(outputPath)` using a 16-bit PCM WAV header.

- [ ] **Step 4: Generate and test the audio bed**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
rtk powershell -Command "& 'C:\Program Files\nodejs\node.exe' -e \"import('./tools/world-cup-short/src/audio.mjs').then(m => m.writeBedWav('./tools/world-cup-short/build/bed.wav'))\""
```

Expected: all audio tests PASS and `bed.wav` is exactly 35 seconds.

- [ ] **Step 5: Commit audio generation**

```powershell
rtk git add tools/world-cup-short/src/audio.mjs tools/world-cup-short/test/audio.test.mjs
rtk git commit -m "feat: generate original sports audio bed"
```

### Task 7: Assemble The Final MP4

**Files:**
- Create: `tools/world-cup-short/src/render-video.mjs`
- Create: `tools/world-cup-short/scripts/build.ps1`
- Generate: `tools/world-cup-short/output/world-cup-format-changed-forever.mp4`

- [ ] **Step 1: Implement video assembly**

`render-video.mjs` must:

1. Resolve the FFmpeg path from `ffmpeg-static`.
2. Normalize each generated background to `1080x1920`, 30 fps, H.264, no audio.
3. Concatenate normalized clips into a 35-second background according to `timeline.mjs`.
4. Spawn FFmpeg with raw RGBA stdin at `1080x1920`, 30 fps.
5. For each of 1050 frames:
   - Decode the matching normalized background frame.
   - Render `renderOverlaySvg(frame / FPS)` through Sharp.
   - Composite the overlay over the background.
   - Write raw RGBA bytes to FFmpeg stdin.
6. Encode visual output with:

```text
-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -movflags +faststart
```

7. Mix narration and bed using:

```text
[1:a]volume=1.0[voice];
[2:a]volume=0.22[bed];
[voice][bed]amix=inputs=2:duration=longest:normalize=0,
alimiter=limit=0.95[aout]
```

8. Encode audio as AAC, 48 kHz, 192 kbps.
9. Stop at exactly 35 seconds.

- [ ] **Step 2: Create the one-command build script**

```powershell
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

New-Item -ItemType Directory -Force -Path "$root\build", "$root\output" | Out-Null

& powershell -ExecutionPolicy Bypass -File "$root\scripts\synthesize-voice.ps1" `
  -OutputPath "$root\build\voice.wav"

& node "$root\src\audio.mjs" "$root\build\bed.wav"
& node "$root\src\render-video.mjs"
& node "$root\test\validate-output.mjs"
```

- [ ] **Step 3: Run the production build**

Run:

```powershell
rtk powershell -ExecutionPolicy Bypass -File tools/world-cup-short/scripts/build.ps1
```

Expected: build completes with exit code `0` and produces the target MP4.

- [ ] **Step 4: Commit the renderer**

```powershell
rtk git add tools/world-cup-short/src/render-video.mjs tools/world-cup-short/scripts/build.ps1
rtk git commit -m "feat: assemble World Cup format short"
```

### Task 8: Validate And Visually Review The Deliverable

**Files:**
- Create: `tools/world-cup-short/test/validate-output.mjs`
- Generate: `tools/world-cup-short/output/contact-sheet.jpg`

- [ ] **Step 1: Implement automated MP4 validation**

`validate-output.mjs` must execute FFmpeg against the final MP4 and assert:

```js
assert.match(stderr, /Video: h264/);
assert.match(stderr, /1080x1920/);
assert.match(stderr, /30 fps/);
assert.match(stderr, /Audio: aac/);

const duration = Number(stderr.match(/Duration: 00:00:(\d+\.\d+)/)?.[1]);
assert.ok(duration >= 33 && duration <= 35.2, `Unexpected duration: ${duration}`);
```

Then decode the full file to a null sink:

```text
-v error -i output/world-cup-format-changed-forever.mp4 -f null -
```

Expected: no decode errors.

- [ ] **Step 2: Generate a seven-frame contact sheet**

Extract frames at `1`, `4`, `8`, `14`, `21`, `28`, and `33.5` seconds, scale
each to `270x480`, tile them, and write `output/contact-sheet.jpg`.

- [ ] **Step 3: Run all automated checks**

Run:

```powershell
rtk npm test --prefix tools/world-cup-short
rtk npm run validate --prefix tools/world-cup-short
```

Expected: every test PASS and the final MP4 decodes without errors.

- [ ] **Step 4: Inspect the contact sheet and play the final MP4**

Confirm:

- Every required caption is readable on a phone-sized frame.
- No AI-generated text or logos appear in the background.
- The group grid contains exactly A-L.
- The third-place scene says `8 BEST THIRD-PLACE TEAMS`.
- The voice remains louder than music and effects.
- The CTA stays visible from 32 through 35 seconds.
- No watermark appears.

- [ ] **Step 5: Fix any visual or audio issue and rebuild**

Only adjust the responsible module:

- Timing or copy: `src/timeline.mjs`.
- Typography or layout: `src/render-frame.mjs`.
- Music/effects: `src/audio.mjs`.
- Voice pacing: `scripts/synthesize-voice.ps1`.

Re-run the full build and validation after any adjustment.

- [ ] **Step 6: Commit validation code**

```powershell
rtk git add tools/world-cup-short/test/validate-output.mjs
rtk git commit -m "test: validate final World Cup short"
```

### Task 9: Deliver Publishing Assets

**Files:**
- Create: `tools/world-cup-short/output/publishing.txt`

- [ ] **Step 1: Write publishing metadata**

```text
Title:
The World Cup Format Just Changed Forever

Description:
The 2026 World Cup format is completely different: 48 teams, 12 groups, and a new knockout path. Is this better for football or did FIFA go too far?

Hashtags:
#WorldCup2026 #FIFAWorldCup #Football #Soccer #Shorts #WorldCup #FIFA
```

- [ ] **Step 2: Final verification**

Run:

```powershell
rtk powershell -Command "Get-Item tools/world-cup-short/output/world-cup-format-changed-forever.mp4,tools/world-cup-short/output/contact-sheet.jpg,tools/world-cup-short/output/publishing.txt | Select-Object Name,Length"
```

Expected: all three files exist and have non-zero size.

- [ ] **Step 3: Report the absolute deliverable paths**

Provide clickable links to the MP4, contact sheet, and publishing metadata.
