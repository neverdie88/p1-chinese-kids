# Curriculum provenance

The app is an independent **Singapore Primary 1 standard Chinese** practice companion for the current 《欢乐伙伴 2.0》 sequence. It covers P1A lessons 1–10 and P1B lessons 11–19. It does not reproduce the textbook readings, illustrations, workbook questions, or page scans.

## Sources verified on 8 October 2026

| Source | Use in the app | Verification and limits |
| --- | --- | --- |
| [MOE: 2024 Primary 1–2 Chinese character list](https://www.moe.gov.sg/-/media/files/primary/2024-character-list-primary-one-to-two-chinese.pdf) | Complete recognition and writing requirements; PDF page 1 = P1A, page 2 = P1B | Both P1 pages were available as indexed text from the official URL. A direct binary download returned an HTTP 202 web challenge, so no PDF is bundled and no successful direct PDF download is claimed. |
| [Dao: Primary Chinese V2023 / 欢乐伙伴 2.0](https://dao.sg/syllabus/2340074) | Lesson order and 19 Chinese lesson titles | The index and every P1 lesson page were read. **The Dao character lists were not used as requirements** because they differ from standard MOE lists; details below. |
| [Independent public character-list transcription](https://www.an2.net/zh-tw/tools/primary-characters/sg) | Cross-check of all 38 character sets | Each P1 recognition and writing set exactly matched the official indexed table, including ordering. Only the P1 sets were retained as factual character metadata. |
| [Public transcript of the MOE character-list document](https://www.scribd.com/document/967999760/2024-Character-List-Primary-One-to-Two-Chinese) | Additional visual-text cross-check during research | The accessible transcript agreed with both sets of P1 requirements. No Scribd document download or textbook content is bundled. |

`p1-characters.json` is the source fixture: titles, book assignments, official page references, lesson URLs, and independently transcribed character lists. It records the access limitation explicitly. The JavaScript module is self-contained so it can run in a simple static browser app; the tests compare it against this fixture.

## Coverage

| Book | Lessons | Recognition characters | Writing characters | Focus cards | Original practice sentences |
| --- | --- | ---: | ---: | ---: | ---: |
| P1A | 1–10 | 182 | 75 | 70 | 30 |
| P1B | 11–19 | 182 | 92 | 63 | 27 |
| Total | 19 | 364 | 167 | 133 | 57 |

Recognition and writing are different requirements. A writing character can have been introduced in an earlier lesson; do **not** assume the writing list is a subset of the same lesson's recognition list. Preserve source ordering and classification.

## Why the Dao character lists were not copied

The public lists were fetched for all 19 lessons. Eighteen lessons had a difference from the standard MOE table, including:

- Lesson 2 recognition uses 巳 where the standard table has 巴.
- Lesson 9 recognition uses 鸟 and 话 where the standard table has 弓 and 语.
- Lesson 10 recognition uses 田 where the standard table has 旧.
- Lesson 18 duplicates 睛 and omits 眼.
- Several writing lists contain the extra characters in the **Higher Chinese** requirements.

`dao-list-discrepancies.json` preserves just the factual sets used for the comparison and the correct standard sets. This prevents a later update from silently replacing standard Chinese requirements with Higher Chinese or transcription errors. The app uses the MOE standard lists throughout.

## Original practice, pinyin and child-facing language

The 133 focus-card glosses, 57 practice sentences, English translations, sentence-piece choices, and 19 sound tips were written for this app. They are supplementary learning activities, **not quoted textbook passages or Dao example sentences**. The lesson titles are curriculum metadata.

The focus cards deliberately combine topic words with selected lesson characters. Early P1 topics introduce useful words orally while character recognition starts with simpler forms. A word such as 学校 therefore appears in the first lesson as supported listening/speaking practice; it is not represented as a first-lesson writing requirement. The complete sourced character bank remains available separately.

Pinyin uses tone marks, common neutral-tone endings in words such as 妈妈、喜欢、朋友、衣服, and spoken tone changes for 一 and 不. It is a pronunciation aid; the parent or teacher can adapt to the child's classroom conventions. The pinyin focus tips are original revision suggestions, not a claim to reproduce the textbook's exact pinyin teaching order. Singapore usage is retained in words such as 华文、课室、冲凉 and 组屋.

`lesson.characterReadings` contains a small set of app-authored pronunciation aids for topic words such as 发 fà (hair), 抹 mā (抹布), 切 qiē (cut fruit), and 兴 xìng (高兴). The MOE character table does not itself specify pinyin. These aids identify the relevant common reading without claiming other readings are incorrect; automatic single-character pinyin elsewhere is a general reading and can change in a word.

Sentence pieces reassemble the corresponding Chinese sentence after removing punctuation. Movable time expressions stay with their subjects in one tile so the exact-order builder does not reject another equally natural position for a time phrase. Location sentences that allowed the same issue were rewritten as short movement sentences. All activities support short, retryable practice. The source list does not imply MOE, publisher, or Dao endorsement.

## Maintenance check

Run `node --test test/curriculum.test.mjs` from the project root. The check covers all lessons, exact character-list fidelity, standard/Higher Chinese mix-up regressions, single-character entries, required language fields, and sentence-piece assembly. These checks validate data structure and source transcription; they do not replace a teacher's review of the original practice material.

For a future edition change, review the official standard Chinese PDF, update the independent fixture, document any access limits, and then update the app data. Do not use a later web list without checking its edition and standard/Higher Chinese distinction.
