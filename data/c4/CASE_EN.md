# C4. Same field, different units: when numbers are not comparable

*Case material: tone inventories of Guangzhou, Taishan and Xinyi*

## What is being compared?

C4 extends the distinction between a working address, a source-defined category and a decision about applicability to a numerical feature. The shared field TONE_INVENTORY_COUNT provides a retrieval address. Comparability additionally requires an account of the unit counted and the evidence from which the number was obtained. This is the feature-level counterpart of the classification questions in C1–C3. [Concept, §§1–3](../../c4_inputs/chinling26_casebook_handoff_v2_2026-09-19/sources/article_concept.md)

In the supplied Xinyi passport, Ye Guoquan's preface distinguishes nine tonal categories (调类) from eight tonal values (调值). The two numbers express different counts within one account. Conversely, Tang Zhidong and Wang Jianshe both distinguish eight categories, but identify the category with value 13 differently. Numerical difference does not by itself establish disagreement, and numerical agreement does not establish agreement about the categories. These descriptions are transcribed from the project's curated passport; the case does not adjudicate between them. [Xinyi passport](passports.json)

Guangzhou and Taishan extend the comparison. The Guangzhou passport records differences in the treatment of checked syllables and of high-level versus high-falling tones, together with differences in the populations described. The Taishan passport distinguishes five categories from eight tonal values and preserves the qualification attached to relating these counts across sources. These conditions remain attached to the individual descriptions. [Guangzhou / Taishan passports](passports.json)

## Reading the extracted records

The frozen export dated 16 September 2026 contains 504 records. Its three-idiom subset contains 65 records [see G1 below for one representative] grouped into 17 combinations of idiom tag, document and numerical value. This grouping is reproducible, but does not identify independent scholarly analyses: a single document can report more than one author's account. [Snapshot](snapshot_2026-09-16/three_idioms.json); [pair register](pairs_table.json)

The records also illustrate a different problem. Counts obtained from partial tables, recurring headers or indices in dictionary entries do not acquire the evidential status of an explicit inventory statement merely by occupying the same feature field. In the Xinyi subset [X1], six is the record with the deepest run of a single value: it occurs in fifteen of twenty-nine records, drawn from partial tables in 信宜方言志 rather than an inventory statement (pair P12). The reconstructed ledger identifies the affected records and preserves their original quotations separately from the review annotations. Local evidence must therefore be assessed for its scope as well as its contents. This parallels the treatment of contextual applicability in C2. [Selection ledger](../../c4_inputs/chinling26_casebook_handoff_v2_2026-09-19/selection_ledger.md)

Repeated records must likewise be distinguished from independent support. The Taishan dictionary [T1] contributes twelve records with the value five (pair P10); the working review relates them to recurring tables rather than twelve independent analyses. A native, same-chunk overlap check (`shared_basis`) confirms this is not an artefact of duplicated evidence spans: each of the twelve records sits in its own dictionary-entry chunk, so the operation finds no shared basis among them — the repetition is a property of the source's structure (one entry per headword, tone values reappearing across entries), not of the graph's storage. [Pair register, P10 and P12](pairs_table.json); [shared_basis result](expected_native_operations.json)

## Inspectable comparison and the tone passport

The proposed interface would let the reader move from a numerical record to its source attribution, evidence type and conditions of comparison. The passport records the counting unit, treatment of checked tones, contested categories and source locators; its contextual notes preserve positional, lexical and locality qualifications. It is a manually prepared representation proposed for the Casebook. The package does not demonstrate an implemented automatic passport or a completed system for revising classifications. Of the 21 passport rows, 17 link to native claim_ids through two explicit methods: 10 by author + document + value over locality-tagged core records, and 7 by source + value over subgroup-addressed supplement records. Together they cover 59 records in the comparison view; four rows remain unlinked rather than guessed. [Passports](passports.json)

One document illustrates why a document+value grouping is not the same as an independent-analysis count: in the eighth international Yue dialectology proceedings [X2], the Xinyi value 8 is reported three times (pair P17), but the underlying text carries Wang Jianshe's own analysis together with a retelling of Tang Zhidong's — one document, two attributed accounts. [Pair register, P17](pairs_table.json)

The methodological contribution is an explicit basis for deciding which descriptions can enter a comparison while retaining their links to evidence. C4 supplies a concrete setting in which to develop the project's proposed infrastructure for revising knowledge classifications with an auditable connection between source evidence and subsequent conclusions. Demonstrating that infrastructure end to end remains further development work. [Concept, §§1, 3–4](../../c4_inputs/chinling26_casebook_handoff_v2_2026-09-19/sources/article_concept.md)

The historical review labels are retained for inspection, with unresolved cases marked. They are not an extraction-accuracy estimate. In particular, the Cantonese record citing seven bases [G2] requires a decision about the adequacy of its evidence (pair P02, open question). The Xinyi record set also carries an open attribution question for two rows inside pair P13 (信宜方言志, value 8), marked `文中所记` in the source. The proposed operations therefore expose counts and qualifications rather than declare a winning phonological analysis. [Ledger](../../c4_inputs/chinling26_casebook_handoff_v2_2026-09-19/selection_ledger.md); [operation proposal](expected_native_operations.json)

## Anchor index

| Anchor | claim_id | pair | idiom_tag | value | Gloss |
|---|---|---|---|---|---|
| G1 | claim_947e86a84240c486842fe728 | P01 | CANTONESE_STD | 6 | Representative Guangzhou record referenced generically in the reading order |
| G2 | claim_6ba7f9779c451dc91283d69c | P02 | CANTONESE_STD | 7 | "seven bases" quote; open question on evidential adequacy (P02) |
| G3 | claim_2d8222642c1080aa6ca887ee | P03 | CANTONESE_STD | 9 | The Yue Dialect, value 9, prose_quote, pair P03 |
| G4 | claim_6f4c093ac451f3e34ba9318f | P04 | CANTONESE_STD | 10 | Yuè 粵 Dialects, value 10, table, pair P04 |
| G5 | claim_78bb8ee87a98f1b298d39a22 | P05 | CANTONESE_STD | 9 | 广东粤方言概要, value 9, table, pair P05 |
| G6 | claim_11ac1a0479dfbb7c7202b172 | P05 | CANTONESE_STD | 9 | 广东粤方言概要, value 9, prose_quote, pair P05 |
| G7 | claim_9d39c7e293644e0745d36a17 | P05 | CANTONESE_STD | 9 | 广东粤方言概要, value 9, prose_quote, pair P05 |
| G8 | claim_5e363ba8f24c27c0c138ce21 | P06 | CANTONESE_STD | 6 | 第八届国际粤方言研讨会论文集, value 6, prose_quote, pair P06 |
| G9 | claim_a24173d48a82c7cd759300c1 | P07 | CANTONESE_STD | 10 | 第八届国际粤方言研讨会论文集, value 10, prose_quote, pair P07 |
| T1 | claim_02e056b60cf1dfd5e1c3ee7e | P10 | TAISHAN | 5 | First-numbered of 12 Taishan-dictionary records with value 5 (P10) |
| T2 | claim_8d792911665017b15bdbc4f4 | P08 | TAISHAN | 10 | Yuè 粵 Dialects, value 10, table, pair P08 |
| T3 | claim_6ee85f65a7ad0ec5068bb7c2 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T4 | claim_41f1b4b16ab7f8b80d9edd18 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T5 | claim_9928be1df8afabbc0403411a | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T6 | claim_14923c451ca9a098f7175a37 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T7 | claim_aefb671843ec59ddeb8f28d0 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T8 | claim_761068332ea55621facefea0 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T9 | claim_fbfc39b8fa86f9d7a612620f | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T10 | claim_ec78cd50d1af8b6e17de5795 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T11 | claim_6291de79d3ac0cee6250ea6c | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T12 | claim_fef9fea2dc571072302f0c29 | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T13 | claim_6a5d873c43f9a5600d764b0f | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T14 | claim_876d5758efb444e7f1a65e9c | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T15 | claim_e4bbc91c337b012f6490b1cb | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T16 | claim_058ac97559878e44f96a1ede | P09 | TAISHAN | 6 | 台山方言词典, value 6, example, pair P09 |
| T17 | claim_4f61a4043ced905b587cd748 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T18 | claim_fba3c4586e8042159ceafbdd | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T19 | claim_bff930c17ff5f7d9525e0f9a | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T20 | claim_98dcd0bf6af0d33734a8fda0 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T21 | claim_d82677aac2cfe2f1ed78f3b7 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T22 | claim_4754a68dc08240ebab360312 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T23 | claim_d8ac7d66d9ecdd15dcf68a6b | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T24 | claim_0c5154aabe82fbe031cd33f1 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T25 | claim_235ff1422a90eff73100530b | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T26 | claim_64afcc0802bb0dee12c30c1c | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| T27 | claim_f659af1316a02359e55fa1c7 | P10 | TAISHAN | 5 | 台山方言词典, value 5, table, pair P10 |
| X1 | claim_3c296686a817f279934b8917 | P12 | XINYI | 6 | First-numbered of 15 Xinyi records with value 6 from partial tables (P12) |
| X2 | claim_b5e2c481b26969d93857663b | P17 | XINYI | 8 | First-numbered of 3 records in the single document holding Wang's own analysis + a retelling of Tang's (P17) |
| X3 | claim_18271ce5bff6a5eddd2c87da | P11 | XINYI | 9 | The Yue Dialect, value 9, prose_quote, pair P11 |
| X4 | claim_f78c8f31549ba5d9dc3ac20a | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X5 | claim_5ed156f7ee50ac69d81aef88 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X6 | claim_8687d90cdb1455fb42f62678 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X7 | claim_148aa4aa48b640d3f40979a5 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X8 | claim_687209b133edd56e6a87c414 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X9 | claim_19c0e935cdf38a05f2a04655 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X10 | claim_b4c27e4695f6d44e4c6eb1b9 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X11 | claim_42f909ee30b1824655013ca9 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X12 | claim_3c32af2af7b9e7a01132c09e | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X13 | claim_c58bbe5e0b7fbef0d2bc9cf2 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X14 | claim_467b46648c9a038fdd2db1ef | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X15 | claim_3f0e6e8a57f1a01231987c1c | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X16 | claim_583a369a8be53634c14039b6 | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X17 | claim_77e427ae9b1a3aa5688694ac | P12 | XINYI | 6 | 信宜方志, value 6, table, pair P12 |
| X18 | claim_301f77d8b065f3eb9237a8d6 | P13 | XINYI | 8 | 信宜方志, value 8, prose_quote, pair P13 |
| X19 | claim_fa5593dbf73f4967c3ead8e2 | P13 | XINYI | 8 | 信宜方志, value 8, prose_quote, pair P13 |
| X20 | claim_d2e8e9284861f20cd1dd0fc9 | P13 | XINYI | 8 | 信宜方志, value 8, table, pair P13 |
| X21 | claim_227039c0ad76c602939ef7e9 | P14 | XINYI | 3 | 信宜方志, value 3, table, pair P14 |
| X22 | claim_87f4d1d2bc9dc2ca124ac4a0 | P14 | XINYI | 3 | 信宜方志, value 3, table, pair P14 |
| X23 | claim_112adc555ffe9645a883ddef | P15 | XINYI | 9 | 信宜方志, value 9, table, pair P15 |
| X24 | claim_3a811cec6372c98b044d49d3 | P15 | XINYI | 9 | 信宜方志, value 9, prose_quote, pair P15 |
| X25 | claim_6fee508b1a77bb90e6600196 | P15 | XINYI | 9 | 信宜方志, value 9, prose_quote, pair P15 |
| X26 | claim_89e5fce12e22e941acd2361f | P15 | XINYI | 9 | 信宜方志, value 9, table, pair P15 |
| X27 | claim_4b51a6804939cc2aca355b1b | P16 | XINYI | 8 | 广东粤方言概要, value 8, prose_quote, pair P16 |
| X28 | claim_74a6dd7c92012d5e5354e0d8 | P17 | XINYI | 8 | 第八届国际粤方言研讨会论文集, value 8, prose_quote, pair P17 |
| X29 | claim_5027645e8ffea24263a9b36a | P17 | XINYI | 8 | 第八届国际粤方言研讨会论文集, value 8, prose_quote, pair P17 |

Anchors mark specific native records discussed by number or quotation in the text above; they are not a claim that every one of the 65 records is individually walked through here. The full record set with native fields and curated annotation is in `core.json`; group composition is in `pairs_table.json`.
