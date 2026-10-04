# Architecture

This repository is standalone: it has no dependency on the PaRAGraph platform's
backend, no live API calls, and no external network requests. Everything it shows comes
from vendored JSON/Markdown bundles under `data/`, prepared from the PaRAGraph
platform's graph and published here in cleaned form. `npm run build` produces a `dist/`
folder that works from a plain static file server (or `vite preview`) with no
server-side component, and `npm run build:single` produces the single-file build that
is published as the canonical public copy (see [verification.md](verification.md#single-file-build-and-reproducing-the-published-artifact)).

## Running it

```sh
npm install
npm run dev          # local dev server with hot reload
npm run build         # produces dist/ (static, no server needed)
npm run preview       # serves the dist/ build locally
npm test              # runs the vitest suite
npm run typecheck     # tsc --noEmit
npm run build:single  # produces dist-single/index.html (everything inlined)
npm run notice        # regenerates NOTICE.md from data/
```

`npm run build` output in `dist/` can be opened via `vite preview`, any static file
server, or (after adjusting absolute paths if needed) directly from `file://`, since
`vite.config.ts` sets `base: "./"`.

## Case bundles

A case switcher above the tabs lets the reader pick which case bundle is active; the
Case/Explore/Operations tabs (plus a C1-only Positions tab, a C3-only Levels tab, and a
C4-only Passport tab) always operate on the active case. An Article tab and an About
tab are both independent of the active case: Article is reserved for the companion
research article and currently shows a placeholder; About
explains what the artifact is, how to read its native/editorial layers, its declared
boundaries, and its current release state. Switching cases rebuilds the store from scratch, so filters, selection,
and the active tab reset.

- **C1** (`data/c1/`) — four published proposals for how the Gaoyang and
  Wuhua Yue subgroups are divided, compared across two working addresses
  (`YUE_GAOYANG`, `YUE_WUHUA`) and a group address (`YUE`). Ships a curated
  `positions_table.json` (source — unit — membership — rank — comparability), shown
  on its own Positions tab; rows are clickable and highlight the claims they draw on.
- **C2** (`data/c2/`) — why Lianzhou's dialect classification changed,
  compared across one working address and two sources.
- **C3** (`data/c3/`) — why the Siyi–Liangyang district (Yue-Hashimoto)
  and the Atlas's coordinate 片 branches are not equivalent units, across three
  working addresses (`YUE_SIYI`, `YUE_GAOYANG`, `YUE_GUANGFU`) and four sources. Ships
  a curated `levels_table.json` (two level schemes — Atlas's single 片 cut and
  Yue-Hashimoto's 區→片→小片 nesting — plus the one curated sentence that relates
  them), shown on its own Levels tab; rows are clickable the same way Positions rows
  are.
- **C4** (`data/c4/`) — one feature, `TONE_INVENTORY_COUNT`, across three
  localities (`CANTONESE_STD`/Guangzhou, `TAISHAN`, `XINYI`): 65 records reduced to 17
  computed technical (locality + document + value) pairs. Unlike C1–C3, whose main
  comparison axis is a working target/address, C4's is locality — so it gets an
  Explore-tab **Locality** filter (`hasLocalityFilter`) instead of a target filter.
  Ships a curated `pairs_table.json` (the 17-pair register, `hasPairsToggle`) that
  backs the Operations tab's "What does the majority say?" block (records vs. pairs,
  filterable by the curated `basis_review_class` A/B/C review), and three curated
  `passports.json` entries (Guangzhou/Taishan/Xinyi source-passport transcriptions),
  shown on its own Passport tab (`hasPassportView`); a passport row is clickable only
  when it resolves to native `claim_ids` (17 of 21 rows, covering 59 records: 10 rows
  found by locality tag and 7 via subgroup address; 4 rows have no matching record).
  No
  Positions/Levels view. Its own frozen-snapshot re-check
  (`snapshot_2026-09-16/snapshot_check.json`) backs one extra sentence on the About tab.

Case bundles differ in more than content: C1's graph nodes carry `label` instead of
`type` (normalized on import), adds a `Group` node type and `ABOUT_GROUP` edge type,
has no single-target scope (`scope.targets`, plural) and so gets an Explore-tab target
filter, has no C2-style curated-context toggle (locality is mostly null by default
rather than a curation flag), and has no separate
`expected_comparison_operations.json` (its equivalent groupings live inside
`expected_operations.json`). C3 also has a plural target scope (three working
addresses, three `target_comparison_by_feature__<pair>` operations named by pair
rather than one shared operation name) and a case-specific
`address_level_by_source` native operation (which source of the four attaches its
statements to the group address vs. a named subgroup address). C4's
`expected_native_operations.json` carries no `scope`/`remains_curated` keys at all
(its input is a fixed 65-UUID curator handoff, not a query-defined scope) —
`loadC4Bundle()` synthesizes a minimal, honest stand-in for both rather than the
generic Explore/About code needing a C4-specific branch — and its
`native.locality` field carries the idiom_tag directly (not a nullable curation flag,
as in C1–C3), which is what the locality filter and Passport/majority views read.
`src/types/bundle.ts` and `src/cases/registry.ts` describe this variance explicitly
rather than assuming a single fixed shape.

## Data layout and versions

There is one folder per case under `data/` (`c1`–`c4`): `CASE_EN.md` (the narrative),
`core.json`/`supplement.json` (the claims), `graph.json`/`comparison_graph.json` (the graph
slice), `sources.json`, `expected_native_operations.json` (production-verified control
results) and case-specific curated tables. Two provenance records sit next to them, both made
before publication: `MANIFEST.json` (the iteration version and the sha256 of each bundle file)
and `PUBLIC_EXPORT.json` (which editorial working fields were left out of the public data, and
the sha256 of the resulting files).

The iteration of a case's data is recorded in its `MANIFEST.json` (`version`) and shown on the
About tab; repository releases are marked with git tags. The bundles are prepared upstream from
the PaRAGraph platform's graph and are not regenerated from this repository.

## Source structure

- `src/types/bundle.ts` — TypeScript shape of the bundle's JSON files, generalized
  across every case bundle's own variant fields (see "Case bundles" above).
- `src/cases/registry.ts` — the `CaseDefinition` for each case: id, title, anchor
  regex, which optional filters/views apply, and its bundle loader.
- `src/data/loadBundle.ts` — static (build-time) import of each vendored bundle, plus
  normalization (`label`→`type` graph nodes, wrapped vs. bare `sources.json`) into one
  common `CasebookBundle` shape.
- `src/operations/` — pure recomputation of each case's native operations
  (`nativeOperations.ts`), evidence-span reconstruction from curated context segments
  (`spans.ts`), the core+supplement claim merge (`combinedClaims.ts`), and C4's
  "What does the majority say?" record/pair counts (`majorityCounts.ts`).
- `src/stores/CasebookStore.ts` — MobX store: active case, filters, selection, active
  tab, and all derived (computed) visible-claim / visible-graph / counts state.
- `src/utils/labels.ts` — human-readable label helpers (anchor, short feature name,
  author-year source label, printed page) shared by every view, so the main UI never
  shows raw claim/evidence/chunk/document ids outside an explicit accordion. Also
  where the native/editorial layer distinction below is spelled out for the UI:
  `originKindLabel()` and `operationStatusLabel()`.
- `src/components/` — `CaseView` (rendered CASE_EN.md with clickable anchors, per the
  active case's own scheme, plus an `AnchorIndex` panel tucked into a "Technical
  details" footnote — see below), `ExploreView` (filterable graph, with a type legend
  and a plain-language summary line), `OperationsView` (the reader-facing "Findings"
  tab: one plain-language finding per native operation, computed automatically when
  the tab opens or the case switches — see `src/stores/CasebookStore.ts`'s
  `nativeOperationResults` — with every table/Cypher/raw-id detail moved into a
  closed "Technical details" footnote at the bottom), `PositionsView`
  (C1's curated positions table), `LevelsView` (C3's curated levels table: two level
  schemes shown as nested lists derived from `level_term`'s own wording, plus a
  cross-scheme correspondence card and a "What this case does not claim" block),
  `PassportView` (C4's three curated tone passports, switchable by locality; a row is
  clickable only when it resolves to native `claim_ids`), `MajorityBlock` (C4's
  Operations-tab "What does the majority say?" record-vs-pair bar chart, filterable by
  `basis_review_class`; all counting logic lives in `operations/majorityCounts.ts` and
  `CasebookStore.majorityCounts`, not in this component),
  `AboutView` (case-independent: what the artifact is, how to read the native/editorial
  layers, declared boundaries, current release state, and — per case — an "Open
  questions" section), `EvidencePanel` (persistent claim/evidence/source detail, with a
  collapsed "Technical identifiers" accordion for raw ids), `ForceGraph.tsx` (a cut-down
  fork of the PaRAGraph platform's own force-graph component, stripped of framework
  coupling and the full-corpus clustering layout — this graph has six node types and
  at most ~40 nodes; settles to a fixed layout via a bounded cooldown and re-fits the
  viewport via `zoomToFit` on engine stop and on resize), `ArticleView` (case-independent:
  the placeholder while no article text is vendored, otherwise the article's status
  banner, table of contents and rendered body).
- `src/article/` — `anchorMap.ts` (contextual case/record-id link resolution, with its
  own unit tests), `frontmatter.ts` (hand-rolled YAML-frontmatter parsing), and
  `loadArticle.ts` (static import of `data/article/`, mirroring `src/data/loadBundle.ts`;
  the article text itself is optional).
- `src/utils/renderArticleMarkdown.ts` — renders the article body to HTML: resolves
  anchor placeholders to chips, builds the h1 table of contents, wraps tables in
  `.table-scroll`, and opens external links (doi/arxiv/w3.org/…) in a new tab.

## Native vs. editorial layer

Every bundle carries two layers, and the UI keeps them visibly distinct rather than
flattening them into one voice:

- **Native fields** — `NativeClaimFields`/graph fields exported directly from the
  production graph (feature, target, polarity, quote, evidence/chunk/document ids, …).
  Shown as-is under "Native fields" in the Evidence panel.
- **Editorial layer** — annotation fields a human curator added on top (role, printed
  page, positions table, anchor-to-claim mapping, …). Never labelled with the bundle's
  own internal jargon; `originKindLabel()` in `src/utils/labels.ts` maps
  `curated_annotation` → "Editorial note", `native_export` → "From graph", and
  `computed_view` → "Computed" everywhere a provenance badge is shown (Evidence panel,
  Positions table). `operationStatusLabel()` does the same for a native operation's
  `partially_native` status, rendering it as "Partial: computed for the selected pair"
  rather than the raw status word.

CASE_EN.md's own `## Anchor index` markdown table (a raw claim/evidence-id lookup, not
reader-facing) is stripped from the rendered document (`splitAnchorIndexSection` in
`src/utils/renderCaseMarkdown.ts`) and replaced with the `AnchorIndex` component,
which renders the same anchors from `core.json`/`supplement.json` — role, source,
locator, quote — instead of raw ids.

For a selected claim whose source record is present in the bundle, the Evidence panel shows
that source's human-readable `annotation.rights` label (see [`LICENSING.md`](../LICENSING.md)).
