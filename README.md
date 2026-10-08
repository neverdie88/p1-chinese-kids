# Little Lantern · Singapore P1 Chinese

A standalone companion to Singapore Primary 1 **standard Chinese** (《欢乐伙伴 2.0》, books 1A and 1B), with the warm visual style and short learning loop of the neighbouring `zhongwen-kids` app.

**[Open the app](https://neverdie88.github.io/p1-chinese-kids/)** · [GitHub repository](https://github.com/neverdie88/p1-chinese-kids)

## Run

Requires Node.js 20 or later. No package installation is needed.

```sh
git clone https://github.com/neverdie88/p1-chinese-kids.git
cd p1-chinese-kids
npm start
```

Open **http://127.0.0.1:4189**. The server binds only to the local machine; use `PORT=4190 npm start` if 4189 is occupied. For a static host, `npm run build` creates `dist/`. All app asset links are relative, so a subdirectory deployment works. Nothing is deployed by these commands.

Pushes to `main` run the tests, verify the bundled stroke data, build the site and publish `dist/` to GitHub Pages through `.github/workflows/pages.yml`. Font subsetting is a local maintenance step; publication uses the bundled font and needs no Python dependencies.

## Learning content

- All **19 lesson themes**, in 1A/1B order.
- **133 focus-word cards** with pinyin, English, emoji and Mandarin playback; repeated words deliberately recur across lessons.
- **57 original practice sentences**, with sentence-building and optional speaking.
- The standard P1 **364 recognition characters and 167 writing characters**, checked against MOE’s indexed character list and an independent transcription.
- **398 local stroke diagrams** covering all curriculum characters.

Every lesson has five activities:

1. **Learn:** short word and sentence cards; marked words join the review garden.
2. **Write:** stroke animation, finger/mouse tracing, and a paper-practice option. Tracing is not handwriting assessment.
3. **Listen:** repeatable Mandarin audio, four choices and retry feedback. A “Show the word” option supports browsers without audio.
4. **Build:** reorder sentence chunks, with a spoken/pinyin hint and retries.
5. **Speak:** listen and repeat, optionally checking recognized words through the browser’s speech service. Self-reported practice and Skip remain available.

The **Review** word garden revisits learned vocabulary and prioritizes words with less successful recall. **Practice** starts a fresh writing, listening or building attempt for any lesson. **Settings** controls pinyin, English, voice/speed and progress backups.

### Scope and sources

This is an independently written learning companion, not an official MOE/publisher product or a full textbook reproduction. Topic vocabulary and sentences can include oral language beyond a lesson’s required character list. No full textbook PDF, scans or textbook passages are included. Lesson/source links are visible in the app.

The official character PDF’s indexed text could be checked, but direct retrieval was unavailable. Some public Dao lists mix Higher Chinese additions or contain transcription errors; Dao is used for lesson titles only. See [sources/README.md](sources/README.md), the source fixture and discrepancy audit for exact evidence and limitations.

## Progress and speech

Progress, activity checkpoints, attempt evidence, best stars, settings and review results use the distinct browser key `p1-chinese-kids-v1`. They do not share the older Book 2 app’s state. Save/restore a JSON backup in Settings to move progress across browsers. If storage is unavailable, learning remains usable for the session and the footer says so.

Stars recognize activity effort; retries are allowed. Listen/Build award one to three stars, retaining the best attempt. Speaking can be skipped without a microphone. Scores and whether speaking was practised survive leaving and resuming an activity.

Playback uses the device’s Mandarin voice. Optional microphone recognition depends on browser support, permission and sometimes an online speech provider; audio may be sent to that provider. The app saves no recordings. Recognized-word matching is **not** pronunciation or tone grading. These APIs are optional and do not block other activities.

## Maintenance and checks

```sh
npm run check          # syntax + curriculum, exercise, progress, speech and server tests
npm run check:source   # curriculum integrity and source-fixture checks
node scripts/vendor-strokes.mjs --check
npm run build
```

The runtime has no external JavaScript dependencies or model downloads. Font and character data are bundled. On first use a system voice might need device support or an internet connection; the app itself needs no third-party CDN at runtime.

Main files:

| File | Responsibility |
| --- | --- |
| `public/curriculum.mjs` | Source-linked lesson metadata and original learning content |
| `public/app.js` | Navigation, screens, learning interactions and canvas |
| `public/exercises.mjs` | Stable choice/tile generation and review/progress helpers |
| `public/progress-store.mjs` | Safe persistence, import/export, evidence and best stars |
| `public/speech.mjs` | Optional browser playback and speech recognition |
| `public/styles.css` | Responsive cream/coral/mint visual system |
| `server.mjs` | Loopback static server with traversal protection |

After changing curriculum characters or Chinese interface text, run:

```sh
node scripts/vendor-strokes.mjs --font
```

This fetches any missing pinned Hanzi Writer data and regenerates the WOFF2 subset (Python FontTools required for subsetting only). `--check --font` verifies existing data and refreshes the font without downloading stroke files. [public/ASSET-LICENSES.md](public/ASSET-LICENSES.md) lists third-party font and stroke licenses. Rebuild `dist/` after making source changes.

Browser verification results are recorded in [VERIFICATION.md](VERIFICATION.md).
