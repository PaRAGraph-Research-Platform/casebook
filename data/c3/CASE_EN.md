# C3. Same names, different depths: aligning hierarchies of unequal rank

*Case material: Siyi–Liangyang and the Yue branches of the Language Atlas of China*

**Prepared research case.** This is an editorial account of a versioned set of source statements
(bundle iteration `c3-internal-0.2`), not a recorded model answer. It concerns the way published
classifications of Yue cut the language into levels: the Atlas of 2012 makes one cut, and
Yue-Hashimoto makes a deeper one. The working addresses in this case are `YUE_SIYI`,
`YUE_GAOYANG` and `YUE_GUANGFU`, plus the group address `YUE` where a source speaks about the
division of the whole language.

**A working address is an index, not a classification.** `YUE_SIYI` collects statements that
concern the same stretch of territory. It does not assert that the 四邑片 of the Atlas and the
四邑片 of Yue-Hashimoto are the same unit, have the same membership, or sit at the same rank.
There is **no canonical address for Liangyang** in the graph, and none was created for this
bundle: that absence is part of what the case shows.

## The question

The Atlas presents Guangfu, Siyi and Gaoyang as three of seven coordinate branches. Yue-Hashimoto
presents Siyi–Liangyang as one of two large districts, inside which Siyi is a branch of its own.
What exactly does each scheme say, at what level, and how far may the two be laid side by side?

## Two schemes, kept apart

### 1. The Language Atlas of China (2nd edition, 2012): one cut, seven coordinate 片

Section 2.1 of the Atlas divides Yue, on the basis of its internal differences, into seven 片
*pian*: Guangfu, Siyi, Gaoyang, Wuhua, Goulou, Yongxun and Qinlian.
**[A1; physical p.185 / printed p.127]** This is the running text of the volume, not the map
legend; the legend carries the same units separately **[S7, S8, S9; physical p.39 / the map
insert has no printed page number]**. The Atlas states no unit between Yue and 片, and it does
not rank the seven against one another.

Its 四邑片 covers seven units of the Tanjiang basin — Jiangmen (Pengjiang and Jianghai), Xinhui,
Enping, Kaiping, Taishan, Heshan and the Doumen district of Zhuhai. **[A2; same page]** Its
高陽片 covers eleven units of Maoming and Yangjiang plus part of Wuchuan, **Yangjiang and
Yangchun among them**. **[A3; same page]** Its 廣府片 covers thirty-five units of the Pearl River
Delta, the upper Xijiang basin in Guangxi, Hong Kong and Macau. **[S10; same page]**

The same line of work made a narrower cut in its first edition: Yue-Hashimoto 1991a reports that
Xiong Zhenghui 1987 divided the Yue of Guangdong into five 片. **[S3; physical p.3 / printed
p.166]** Five 片 of one province and seven 片 of the whole language are editions of one scheme,
not two schemes.

### 2. Yue-Hashimoto: two 區 districts, then 片, then 小片

The Chinese primary source — 余靄芹, 《粵語方言分區問題初探》, *方言* 1991(3):164–181 — prints the
scheme as a table. Table 5 (表五 粵語分區表) has a column for 區, a column for 片 and a column for
小片, and divides Yue into **two 區 districts, five 片 and four 小片** — seven terminal cells,
printed with the map codes A–G. **[Y1; physical p.13 / printed p.176]** The running text of the
same section states the top cut in prose. **[S1; same page]** The source's own gloss for the
table is «两区七片» (two districts, seven pian); the verifier's note on this record observes that
the gloss compresses the seven terminal cells, since C–F are formally 小片, not 片.

Inside that table:

- the **四邑兩陽區 Siyi–Liangyang district** contains 四邑片 (A) and 兩陽片 (B)
  **[Y2; physical p.13 / printed p.176]**;
- the **三角洲區 Delta district** contains 北三角洲片 (with the subdivisions 三邑肇慶小片 C and
  內陸小片 D), 南三角洲片 (with 欽廉小片 E and 中山小片 F) and **廣府片 (G)**
  **[Y3; same page]**;
- 兩陽片 contains Yangjiang and Yangchun in 1991a's own table and prose **[Y4; same page]**; the
  Appendix witness (based on Yue 1988) adds Hecun in Xinhui at the same place in the scheme —
  the two witnesses are kept apart in [levels_table.json](levels_table.json), row L-Y4.

The stated ground for the top cut is that Siyi and Liangyang share more with each other than
with the rest of Yue and form a distinctive area. **[S2; physical p.4 / printed p.167]**

The same scheme is published a second time, independently, in the Appendix to
*Development of the Stop Endings in the Yue Dialects*, which says outright that its
classification is based on Yue 1988. **[S4; physical p.25 / printed p.241]** There the dialect
lists are headed 四邑兩陽區四邑片 and 四邑兩陽區兩陽片 **[H1; physical p.26 / printed p.242]**, and
the Guangfu list is headed 三角洲區廣府片 **[H2; physical p.25 / printed p.241]**.

Two things follow directly. **Siyi is a 片 inside a 區**, not a 區; and **Guangfu is a 片 inside
the Delta 區**, one level below the top cut, not a branch coordinate with Siyi.

### 3. A third source that holds both schemes at once

Kwok, Tsou and Chin state the Atlas scheme — Yue divided into seven sub-groups or 片
**[K2; physical p.2 of the source PDF]** — and, in a later paragraph, report that
Yue-Hashimoto (1988) divides Yue into two major groups, 四邑兩陽 Siyi Liang-Yang and the Delta
group. **[K1; physical p.4 of the source PDF]**

The next sentence of that paragraph is the only place in this bundle where the two schemes are
related to each other:

> The former roughly corresponds to the Sìyì sub-group and parts of the Gāoyáng sub-group in the
> *Atlas*, and the latter to the remaining sub-groups in the *Atlas*’ classification.

That sentence is present in the stored source text and was read on the page, but **no record in
the graph carries it**: the adjacent record K1 stops at the previous sentence. It is therefore
carried as a curated annotation with its exact segment locator, in
[levels_table.json](levels_table.json), and not as a relation between units.

## What the reader may and may not conclude

- The two schemes differ **in depth, not only in boundaries**. One cuts Yue once; the other cuts
  it twice before reaching the same names.
- **Siyi–Liangyang is not an eighth Atlas branch.** It is a 區 standing above 片 in its own
  scheme, and placing it beside the Atlas 片 would misread both.
- **Liangyang is not Gaoyang.** The correspondence the third source reports is between the whole
  Siyi–Liangyang district on one side and Atlas Siyi plus *parts* of Gaoyang on the other, and it
  is explicitly approximate. The source does not enumerate which parts.
- What is visible in the slice itself is that 兩陽片 holds Yangjiang and Yangchun (1991a's own
  witness), which the Atlas keeps inside 高陽片; the Appendix witness additionally places Hecun
  in Xinhui at the same place in the scheme, and that locality sits in Atlas Siyi territory.
- The same name does not guarantee the same unit: 廣府片 appears in both schemes with different
  extents and at different levels.
- The absence of a canonical Liangyang address is shown, not filled in. The district is reachable
  only through the working address of its Siyi 片.

The curated table of "scheme — source — unit — level term — contains — comparability", with the
unknowns marked, is in [levels_table.json](levels_table.json). Its comparability column and the
cross-scheme row are editorial judgements, not graph facts.

## What the graph lets the reader inspect

The core of this iteration contains **eleven statements** across the two schemes and the third
source, each with its native feature ID, working address and path through Evidence to Source. The
core graph has **34 nodes and 44 native relationships**. With the ten supplementary records the
comparison graph has **55 nodes and 84 native relationships** over **four sources**.

The primary operation for this case is **changing the selected source**: the visible statements
about level and membership change with it, while the prepared account above does not regenerate.
An empty result means that this bundle holds no matching record — not that a scheme does not
exist.

## Native operations

Eleven operations run on this slice. Each is plain Cypher over native fields, recorded with its
parameters and its checked result in
[expected_native_operations.json](expected_native_operations.json); all eleven were run against
production on 2026-09-11 and returned the recorded rows.

- **Change the selected source** (`source_filter`, 21 rows). The case operation: seven records
  for the Atlas, seven for Yue-Hashimoto 1991a, five for the Appendix and two for
  Kwok–Tsou–Chin.
- **Where each source attaches its statements** (`address_level_by_source`, 7 rows). A finding of
  its own: Yue-Hashimoto 1991a attaches six of its seven records to the group address `YUE` and
  only one to a subgroup, because it describes how the language is divided rather than a property
  of one unit. The Atlas attaches six records to subgroups and one to the group;
  Kwok–Tsou–Chin attaches both of its records to the group.
- **What each source says under each category** (`source_split`, 10 rows).
- **Statements resting on the same passage** (`shared_basis`, 3 rows). Two of the three pairs are
  inside Table 5: the record for the whole table spans the text that the two district records
  span in part, so **Y1, Y2 and Y3 are one textual basis, not three**. The third pair is H1 and
  S5 in the Appendix list.
- **How many independent textual bases** (`independent_bases`, 4 rows). Twenty-one statements
  rest on twenty-one Evidence nodes in nine chunks from four sources; nine of them fall under
  `METALINGUISTIC_HIERARCHY_LEVEL` and come from three sources. Distinct sources are distinct
  documents, not proven scholarly independence: the Appendix and Kwok–Tsou–Chin both report the
  same classification of 1988.
- **The working addresses side by side** (`target_comparison_by_feature__*`, 4 rows each for the
  three pairs Siyi–Gaoyang, Siyi–Guangfu, Gaoyang–Guangfu), each with the caveat that most
  statements in this slice address the group and not a subgroup.
- **Two sources side by side** (`source_comparison_by_feature`, 4 rows, marked **partially
  native**). The shipped template compares exactly two sources; this slice has four, so the
  operation describes the selected pair only.
- **Where the record disagrees with itself** (`contested_cell`, **0 rows**). No feature category
  in this slice carries opposite polarity for one address. This is an absence of records, not a
  demonstration that the sources agree — they disagree about levels, and that disagreement is not
  encoded as polarity anywhere in the ontology.
- **Polarity against the recorded value** (`polarity_value_consistency`, 21 rows). Every record
  is `attested` with no `present` flag: these are metalinguistic statements, so the flag does not
  apply.

The C2 operation `feature_level_split` is **not applicable** here and is recorded as such with
its reason.

What these operations do **not** supply: the assignment of statements to schemes, the nesting of
units inside each scheme, the comparability column, the printed pages, the cross-scheme sentence,
the refusal to equate Liangyang with Gaoyang, and the observation that the two witnesses of the
same scheme name one 小片 differently. Those remain curated annotations and are listed as such in
the bundle.

## Anchor index

| Anchor | Scheme | Claim | Evidence | Locator |
|---|---|---|---|---|
| A1 | Atlas 2012 | `claim_a0314ec98e293304abc62820` | `ev_603ec447e1748395f65b` | phys 185 / printed 127 |
| A2 | Atlas 2012 | `claim_4cf43021976128a0939ce88a` | `ev_688c22d1deb961cb05ec` | phys 185 / printed 127 |
| A3 | Atlas 2012 | `claim_cfd92b2d77712342e18c6b94` | `ev_1564e8a9cd0931eb7dd7` | phys 185 / printed 127 |
| S3 | Atlas 1987 as reported | `claim_aa92e8f4fc855dec53d7283c` | `ev_d61455de953a195be0c8` | phys 3 / printed 166 |
| S7 | Atlas 2012 legend | `claim_66b3f7fd220461711e8179a5` | `ev_819f48681462c3dcebe6` | phys 39 / no printed pagination |
| S8 | Atlas 2012 legend | `claim_f16d4e4818149ecd18572ffd` | `ev_77dba06c63e35b54bea1` | phys 39 / no printed pagination |
| S9 | Atlas 2012 legend | `claim_af34594b628a1e6beffc3217` | `ev_b88be6ec37bece3e6c4f` | phys 39 / no printed pagination |
| S10 | Atlas 2012 | `claim_3df3f20280195743a03d07c7` | `ev_f3437b394feb2adc88ff` | phys 185 / printed 127 |
| Y1 | Yue-Hashimoto 1991a | `claim_39ec5fd17ce8736f5973a464` | `ev_0e46deee89182712d021` | phys 13 / printed 176 |
| Y2 | Yue-Hashimoto 1991a | `claim_1bcde9febf2f8e5ecfadf6d2` | `ev_6cf783004b36e8b58c54` | phys 13 / printed 176 |
| Y3 | Yue-Hashimoto 1991a | `claim_b51e88ef7598892203251d11` | `ev_7e621afd66859f1de4b8` | phys 13 / printed 176 |
| Y4 | Yue-Hashimoto 1991a | `claim_4633dd0cf013feb72f12f718` | `ev_34ebb48de4435dee6eaf` | phys 13 / printed 176 |
| S1 | Yue-Hashimoto 1991a | `claim_42f9f425ffebb57645ea174d` | `ev_3398343c20d867919499` | phys 13 / printed 176 |
| S2 | Yue-Hashimoto 1991a | `claim_a7dce69f9acdc82051a3063d` | `ev_74bb6aa72ea74890ddc4` | phys 4 / printed 167 |
| H1 | Appendix (Yue 1988) | `claim_5764dbb5750b494ed12fd4e1` | `ev_90550a4228a3d348f4b5` | phys 26 / printed 242 |
| H2 | Appendix (Yue 1988) | `claim_0389da505b6cbdff6eb65755` | `ev_08bb66c847967b940a6e` | phys 25 / printed 241 |
| S4 | Appendix (Yue 1988) | `claim_25877c451d37e0193fd6c4be` | `ev_59a84c79fb5d2d336c97` | phys 25 / printed 241 |
| S5 | Appendix (Yue 1988) | `claim_78346e25a965145f19bd44af` | `ev_b5c69a7cf7d4d859b2f2` | phys 26 / printed 242 |
| S6 | Appendix (Yue 1988) | `claim_83a5a2d025e75af3ca9a90ed` | `ev_61e4b79abcdc6debf14c` | phys 26 / printed 242 |
| K1 | Kwok–Tsou–Chin | `claim_67e2ee896580e24fd0ec3cb1` | `ev_c0d6f0cb40851b93461a` | phys 4 / no printed pagination |
| K2 | Kwok–Tsou–Chin | `claim_6330081035a097caf275c64e` | `ev_11c5995ab0a5dc9f40f0` | phys 2 / no printed pagination |

Evidence IDs above are reproduced from the export; the authoritative pairing of claim, evidence
and segment context is in [core.json](core.json) and [supplement.json](supplement.json).
Bibliographic metadata, including the defective year recorded for Kwok–Tsou–Chin, are in
[sources.json](sources.json).

