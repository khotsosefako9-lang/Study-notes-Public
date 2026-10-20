# Video Editor

Turns raw footage into vertical 40–60 second clips for Reels and TikTok, starting with the REACH Summerstrand pre-Bible-study game shows.

Tooling:
- [FFmpeg](https://ffmpeg.org/): cutting, reframing to 9:16, warm grade, loudness
- [Whisper](https://github.com/openai/whisper): word-level transcription for captions
- [Remotion](https://github.com/remotion-dev/remotion): animated game boards and captions in React

## Game templates

Each template is a Remotion composition at 1080×1920, 30 fps, in the church's colours (cream, gold, orange and dark brown, with Poppins and Mulish fonts). The boards sit in the lower half, clear of Instagram's caption area. Rules follow the [Bible study games site](https://github.com/khotsosefako9-lang/Bible-Study).

| Composition | Game | What it animates |
| --- | --- | --- |
| `FastMoney` | Two players, five questions, 200-point goal | Answers typing in, points counting up, player and combined totals, progress bar to the goal, 20s/25s countdown, Player 1's answers covered while Player 2 plays |
| `ChurchFeud` | Two teams, top answers, three strikes | Flip-up answer slots, bank, team scores, strike counter and big red ✕, steal. `layout: "split"` keeps the board under the footage; `"insert"` cuts to a full-screen board during `boardShots` |
| `Tenable` | Ten answers, three lives | Pyramid filling with each correct answer, hearts lost on a wrong answer with a red flash, missed answers revealed at the end, score out of 10 |

All three also take `captions` (word timings from Whisper, current word in gold) and `stamps` (pop-up words such as "Steal!", "Tenable!" or "200 reached!").

Example props for each game are in `projects/examples/`. Every time in a props file is in seconds on the edited clip.

## Making a reel

1. Put the raw footage anywhere and write a cut list, one segment per line (`<file> <start> <end>`):

   ```
   raw/IMG_0412.MOV 0:12.5 0:19
   raw/IMG_0412.MOV 1:03 1:20.4
   ```

2. Cut, reframe to 9:16, apply the warm grade and level the audio:

   ```
   python3 scripts/roughcut.py cuts.txt public/footage/tenable.mp4 --crop-x 0.5
   ```

3. Transcribe and copy the words into the reel's props file:

   ```
   whisper public/footage/tenable.mp4 --model small --language en --word_timestamps True --output_format json --output_dir out
   python3 scripts/captions.py out/tenable.json projects/2026-10-21/tenable.json
   ```

4. Fill in the props file (`video`, `durationInSeconds`, answers and the times they're said), preview, then render:

   ```
   npx remotion studio
   npx remotion render src/index.ts Tenable out/tenable.mp4 --props=projects/2026-10-21/tenable.json
   ```

Footage lives in `public/footage/` and renders in `out/`; neither is committed.

## Setup

```
npm install
pip install openai-whisper
```

Whisper downloads its model from `openaipublic.azureedge.net` on first use, so that host must be reachable.
