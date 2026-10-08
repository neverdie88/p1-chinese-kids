# Bundled assets

These files are served locally, so lessons do not require a third-party asset CDN at runtime.

| Asset | Source | License included |
| --- | --- | --- |
| LXGW ZhenKai GB font | [LXGW ZhenKai](https://github.com/lxgw/LxgwZhenKai), copied unchanged from the sibling `zhongwen-kids` app; `p1-zhenkai.woff2` is a web-delivery subset covering this app | `fonts/OFL-ZhenKai.txt` (SIL Open Font License 1.1 with permission for web-font subsets) |
| Hanzi Writer 3.7.3 | [Hanzi Writer](https://github.com/chanind/hanzi-writer), copied unchanged from the sibling app | `vendor/LICENSE-hanzi-writer.txt` (MIT) |
| Selected character stroke data 2.0.1 | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data); distributed from the version-pinned npm CDN | `strokes/ARPHICPL.TXT` (Arphic Public License) |
| pinyin-pro | [pinyin-pro](https://github.com/zh-lx/pinyin-pro), copied unchanged from the sibling app | `vendor/LICENSE-pinyin-pro.txt` (MIT) |
| OpenCC JavaScript Traditional-to-Simplified bundle | [opencc-js](https://github.com/nk2028/opencc-js), copied unchanged from the sibling app | `vendor/LICENSE-opencc-js.txt` and `vendor/THIRD_PARTY_LICENSES-opencc-js.md` (MIT and Apache 2.0 dictionary data) |

Stroke data is derived from the Make Me a Hanzi project. The bundled selection covers the curriculum's recognition and writing characters, focus vocabulary, lesson titles, and original practice sentences. `strokes/manifest.json` records the pinned package version and each file's SHA-256 digest.

To populate or verify this selection from the app directory:

```sh
node scripts/vendor-strokes.mjs
node scripts/vendor-strokes.mjs --check
node scripts/vendor-strokes.mjs --check --font
```

The first command downloads missing files from `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/`. The check command uses local files only. The optional `--font` flag uses FontTools' `pyftsubset` command and Brotli support to regenerate the WOFF2 subset from the curriculum and app source text. Regenerate it when adding Chinese UI text. Runtime use does not fetch stroke data from the internet.
