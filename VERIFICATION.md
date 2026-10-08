# Verification · 8 October 2026

## Automated checks

- `npm run check`: 17 JavaScript files syntax-checked; **32 tests passed**.
- Curriculum: all 19 standard P1 lesson identities; all 38 recognition/writing sets; 133 focus cards; 57 complete sentence builders; contextual pinyin examples; original-content/source disclosures.
- Exercises: stable unique listening choices; shuffled sentence chunks including duplicates; completion calculation; learned-word filtering and review ordering.
- Progress: reload persistence, best-star retention, per-activity checkpoints and attempt evidence, session fallback, export/import/reset, older backups, malformed input and prototype protection.
- Speech: mocked playback/recognition lifecycles, cancellation, optional support, denied/start-error handling and conservative recognized-word matching.
- Server: real HTTP checks for static serving, traversal/symlink protection, malformed URLs and unsupported methods.
- `node scripts/vendor-strokes.mjs --check --font`: **397 currently required curriculum characters** have valid local stroke data and matching pinned manifest hashes. The package contains 398 files because an earlier practice character remains harmlessly bundled. Font subset regenerated from current app/curriculum text.
- `npm run build`: static `dist/` generated successfully.

## Browser checks

Tested against the running local app in the Codex in-app browser. The QA session used `127.0.0.1:4189`; the user preview uses `localhost:4189`, which starts with separate, fresh browser progress.

- Verified the rendered 1A and 1B grids contain ten and nine lesson cards; selected lesson 19 through Practice.
- Completed **all five activities in lesson 1** through UI controls: ten Learn cards, five writing characters, seven listening choices, three sentence builders and three optional speaking cards.
- Opened a word dialog and confirmed local stroke SVGs render. Checked 兴 → xìng / 高兴 in the lesson 19 source-character dialog.
- Drew a mouse stroke on the tracing canvas, confirmed Next unlocks, cleared the canvas and confirmed Next locks again. Completed remaining characters through the explicit paper-practice option.
- Confirmed wrong listening/build answers stay retryable and require correction before moving on.
- Reloaded mid-learning and mid-building; the app resumed on the next saved card.
- Entered two wrong listening answers across a reload, finished and verified two stars; earlier attempts were preserved.
- Practised one speaking card, refreshed, skipped the remainder and verified the practice star survived. No microphone permission was requested for these tests.
- Reviewed a learned word with English switched off and confirmed explicit “Show the meaning” still reveals its meaning; recorded recall and advanced.
- Used keyboard Enter to build and check lesson 19’s first sentence.
- Inspected desktop at the default 1280-pixel viewport, mobile at 390 pixels and narrow mobile at 320 pixels. Fixed 320-pixel navigation overflow and decorative overlap. Home, Review, Practice, Settings and Sources have matching document/viewport widths at 320 pixels; the lesson 19 builder matched at 390 pixels.
- Inspected the source page and optional audio controls. Browser error/warning log was empty at the end of the functional pass.

Screenshots are in `artifacts/`. They show UI states, not audio or physical speech performance.

## Limits

Real child speech, pronunciation accuracy and tone accuracy were not tested or claimed. Playback voice availability depends on the device; the audio control was exercised, but audible sound quality was not assessed. Speech tests use mocks and UI self-practice/Skip. The browser file picker backup workflow was not exercised; export/import validation and persistence were covered at the storage-module level.

The original `zhongwen-kids` app was read as a reference and its licensed static assets reused. Its code and progress were not modified. This document records the checks completed before publication. GitHub deployment status is available in the repository’s [Actions tab](https://github.com/neverdie88/p1-chinese-kids/actions).
