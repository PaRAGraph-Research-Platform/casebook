# C1. One territory, four partitions: a shared index is not a shared unit

*Case material: Yue dialects of south-western Guangdong*

**Prepared research case.** This is an editorial account of a versioned set of source
statements (bundle iteration `c1-internal-0.2`), not a recorded model answer. It concerns the
Yue dialects of south-western Guangdong — the area around Wuchuan 吳川, Huazhou 化州,
Zhanjiang 湛江, Yangjiang 陽江 and Yangchun 陽春. The working addresses in this case are
`YUE_GAOYANG` and `YUE_WUHUA`, plus the group address `YUE` where a source speaks about the
whole of Yue.

**A working address is an index, not a classification.** `YUE_GAOYANG` and `YUE_WUHUA` collect
statements that concern the same stretch of territory. They do not assert that the units named
by different authors are the same unit, that they have the same membership, or that they sit at
the same rank.

## The question

Four published proposals cut this area in four different ways. What exactly does each of them
say, at what rank, with what membership — and how far can they be compared at all?

## Four positions, kept apart

### 1. The Language Atlas of China (2nd edition, 2012): Wuhua is a separate pian

The Atlas divides Yue into seven 片 *pian*: Guangfu, Siyi, Gaoyang, Wuhua, Goulou, Yongxun and
Qinlian. **[A1; physical p.185 / printed p.127]** Its Wuhua 吳化片 covers three municipal
names — Potou district of Zhanjiang, Wuchuan and Huazhou. **[A2; same page]** Its Gaoyang
高陽片 covers eleven municipal names in Maoming and Yangjiang, and also Wuchuan and Zhanjiang
again. **[S1; same page]**

Wuchuan and Huazhou therefore appear under **both** units in the Atlas description itself — and
the Atlas's own detailed section marks both as partial rather than whole: *part* of Wuchuan and
the *eastern part* of Huazhou, each identified by named townships. The same municipal name
recurring in a different position's account is evidence that the two accounts name the same
municipality, not that they cover the same territory. The Atlas text does not say the two lists
are disjoint, and this bundle does not turn them into a partition.

### 2. A Gao-Lei pian in the Outline, and Hou's merger as reported by Kwok, Tsou and Chin

The *Outline of Yue Dialects in Guangdong* divides Guangdong Yue into five pian — Yuehai,
Siyi, Gao-Lei, Guanbao, Xiangshan **[S2; physical p.14 / printed p.5]** — and its
Gao-Lei 高雷片 covers Zhanjiang, Maoming, Yangjiang, Yangchun, Gaozhou, Xinyi, Huazhou,
Wuchuan, Dianbai, Suixi, Lianjiang, Leizhou and Xuwen. **[B1; physical p.10 / printed p.1]**
That single unit spans what the Atlas splits into Gaoyang and Wuhua — but the Outline states
its own scheme, not that equivalence.

Separately, Kwok, Tsou and Chin report that **Hou (2002)** proposes a model in which the Wuhua
sub-group is merged into the Gaoyang sub-group. **[B2; physical p.4 of the source PDF]** This
is a **secondary report**: it must be cited as "Hou, as reported by Kwok, Tsou and Chin". The
bundle contains no copy of Hou 2002, no membership list for that model and no statement of its
criteria. The stored quotation begins mid-clause; the attribution to Hou is recovered from the
surrounding chunk, which is included in `core.json`.

### 3. Yue-Hashimoto 1991a: a different rank system altogether

The Chinese primary source — 余靄芹, 《粵語方言分區問題初探》, *方言* 1991(3):164–181 — was
ingested into production on 2026-09-10 and now has its own Source → Evidence → Claim path. Its
Table 5 divides Yue into **two 區 districts, five 片 and four 小片** (seven terminal cells,
printed with the map codes A-G): the Siyi–Liangyang district (Siyi pian A, Liangyang pian B) and
the Delta district (Northern Delta pian, with the Sanyi-Zhaoqing subdivision C and the Interior
subdivision D; Southern Delta pian, with the Qinlian subdivision E and the Zhongshan subdivision
F; Guangfu pian G). **[C1; physical p.13 / printed p.176]** The source's own gloss for the whole
table is «两区七片» (two districts, seven pian); the verifier's note on this record points out
that this expression compresses the seven terminal cells, since C-F are formally 小片, not 片.

Within that scheme:

- the **Interior subdivision 內陸小片** of the Northern Delta contains Huaxian (Huazhou),
  Wuchuan and most of interior Guangxi **[C2; physical p.15 / printed p.178]**, assigned there
  because their affinities run towards the interior Guangxi dialects **[S4, S5; physical p.13 /
  printed p.176]**;
- the **Liangyang pian 兩陽片** contains Yangjiang and Yangchun in 1991a's own Table 5 and
  running prose **[C3; physical p.13 / printed p.176]**; a second, independently published
  witness of the same scheme — the Appendix to *Development of the Stop Endings in the Yue
  Dialects*, based on Yue 1988 — adds Hecun in Xinhui at the same place. The two witnesses are
  kept apart in [positions_table.json](positions_table.json), not merged into one membership.

This scheme has **no unit corresponding to Gaoyang and no unit corresponding to Wuhua.** It is
not a re-drawing of the Atlas boundaries; it is a different set of levels with a different top
cut. The same source also objects to the earlier five-pian scheme precisely because Wuchuan,
Huazhou and Zhanjiang are listed under two pian at once with no explanation given.
**[S3; physical p.4 / printed p.167]**

### 4. Zhang and Zhuang (2008): Liangyang and Gaohua

Zhang and Zhuang propose separating the Yue of the Moyang river basin as its own
兩陽片 *Liangyang pian*, and naming the Yue south and west of Xinyi and Gaozhou — the area of
the old Gaozhou and Huazhou circuits — 高化片 *Gaohua pian*. **[D1; physical p.15 / printed
p.421]** The same paper tabulates the Atlas Gaoyang membership beside the Outline's label
Gao-Lei pian. **[D2; physical p.3 / printed p.409]**

## What the reader may and may not conclude

- Four sources use **four different units** over one area, and two of them (positions 3 and 4)
  put Yangjiang and Yangchun into a unit of their own that the Atlas keeps inside Gaoyang.
- The shared working address lets the reader assemble these statements. It does **not**
  establish that any two of the named units are the same unit.
- Repeated localities inside a single source's own description (Wuchuan and Huazhou under both
  Atlas units) forbid rendering any of these lists as a strict partition of territory.
- Rank is a property of the source, not of the working address. The right field is
  `source_classification_level`, with values 片 for positions 1, 2 and 4, and 區 / 片 / 小片 for
  position 3.

The curated table of "source — unit — membership — rank — comparability", with the unknowns
marked, is in [positions_table.json](positions_table.json). Its comparability column is an
editorial judgement, not a graph fact.

## What the graph lets the reader inspect

The core of this iteration contains **nine statements** — two or three per position — each with
its native feature ID, working address and path through Evidence to Source. The core graph has
**28 nodes and 36 native relationships**. With the five supplementary records the comparison
graph has **37 nodes and 55 native relationships** over **five sources**.

The primary operation for this case is **changing the selected source**: the visible statements
about composition and rank change with it, while the prepared account above does not
regenerate. An empty result means that this bundle holds no matching record — not that a
position does not exist.

## Native operations

Eight operations run on this slice. Each is plain Cypher over native fields, recorded with its
parameters and its checked result in
[expected_native_operations.json](expected_native_operations.json); all eight were run against
production on 2026-09-10 and returned the recorded rows.

- **Change the selected source** (`source_filter`, 14 rows). The case operation: three records
  for the Atlas, two for the Outline, one for Kwok–Tsou–Chin, six for Yue-Hashimoto 1991a and
  two for Zhang–Zhuang.
- **What each source says under each category** (`source_split`, 8 rows).
- **Statements resting on the same passage** (`shared_basis`, 1 row). One pair: S4 and S5, the
  Wuchuan and the Huazhou assignment, share a single Evidence node. They are one textual basis,
  not two.
- **How many independent textual bases** (`independent_bases`, 2 rows). Fourteen statements rest
  on thirteen Evidence nodes in eleven chunks from five sources; after merging the one
  shared-basis pair the slice has **thirteen independent textual supports**. Distinct sources
  are distinct documents, not proven scholarly independence — position 2's two components share
  no text, but position 4 explicitly discusses positions 1 and 2.
- **The two working addresses side by side** (`target_comparison_by_feature`, 2 rows). The
  canonical two-target comparison, which the C2 slice could not run because it had one address.
  Here Gaoyang collects three distribution records and one rank record, Wuhua one and one.
- **Two sources side by side** (`source_comparison_by_feature`, 2 rows, marked **partially
  native**). The shipped template compares exactly two sources; this slice has five, so the
  operation describes the selected pair only.
- **Where the record disagrees with itself** (`contested_cell`, **0 rows**). No feature category
  in this slice carries opposite polarity for one address. This is an absence of records in the
  slice, not a demonstration that the sources agree — they disagree about units and ranks, and
  that disagreement is not encoded as polarity anywhere in the ontology.
- **Polarity against the recorded value** (`polarity_value_consistency`, 14 rows). Every record
  is `attested` or `uncertain` with no `present` flag: these are metalinguistic statements, so
  the flag does not apply.

The C2 operation `feature_level_split` is **not applicable** here and is recorded as such with
its reason.

What these operations do **not** supply: the mapping of statements to positions, the
comparability column, the printed pages, the absence of a Gaoyang-like unit in position 3, and
any judgement about whether two authors' units coincide. Those remain curated annotations and
are listed as such in the bundle.

## Anchor index

| Anchor | Position | Claim | Evidence | Locator |
|---|---|---|---|---|
| A1 | 1 | `claim_a0314ec98e293304abc62820` | `ev_603ec447e1748395f65b` | phys 185 / printed 127 |
| A2 | 1 | `claim_7d20d293e2afdcc5a3805279` | `ev_59bf6ca648b749806c6e` | phys 185 / printed 127 |
| S1 | 1 | `claim_cfd92b2d77712342e18c6b94` | `ev_1564e8a9cd0931eb7dd7` | phys 185 / printed 127 |
| B1 | 2 | `claim_6b54aa03df9869457d6b0be1` | `ev_dea784d6623c1326529f` | phys 10 / printed 1 |
| S2 | 2 | `claim_4be864f26c82a0d72ff8ceb2` | `ev_87d96a8644318887c028` | phys 14 / printed 5 |
| B2 | 2 | `claim_678197917767d8ecc05f4e2d` | `ev_49b1be3cce76c62ebf9e` | phys 4 / no printed pagination |
| C1 | 3 | `claim_39ec5fd17ce8736f5973a464` | `ev_0e46deee89182712d021` | phys 13 / printed 176 |
| C2 | 3 | `claim_6033e81c656f778b7c6fffe5` | `ev_e569e70c617d0cd2223c` | phys 15 / printed 178 |
| C3 | 3 | `claim_4633dd0cf013feb72f12f718` | `ev_34ebb48de4435dee6eaf` | phys 13 / printed 176 |
| S3 | 3 | `claim_5d449dc7fe41fd5ef3eab9b3` | `ev_942fcfe0a4b8317288aa` | phys 4 / printed 167 |
| S4 | 3 | `claim_c1754227eae26797a003f693` | `ev_375b51f97446c5ef274c` | phys 13 / printed 176 |
| S5 | 3 | `claim_022833074dd15cd7808893e7` | `ev_375b51f97446c5ef274c` | phys 13 / printed 176 |
| D1 | 4 | `claim_2802a2ca639ec1cc8be8fd4b` | `ev_237494d2a04b1362ac02` | phys 15 / printed 421 |
| D2 | 4 | `claim_689186fdf155a69d661380e0` | `ev_8897ff59e0ca705f8750` | phys 3 / printed 409 |

Full source context and exact segment IDs are in [core.json](core.json) and
[supplement.json](supplement.json). Bibliographic metadata, including the distinction between
Yue-Hashimoto 1991a and 1991b, are in [sources.json](sources.json).

