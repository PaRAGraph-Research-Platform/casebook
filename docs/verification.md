# Verification

The Findings/Positions/Levels/Case tabs the app shows a reader are a plain-language
front end; every technical fact behind them is one closed `<details>` disclosure away,
under a "Technical details" heading at the bottom of each tab. This page explains,
step by step, how those facts were produced and how to check them yourself.

## How to verify what the page shows

1. **What a bundle is.** Each case (C1–C4) ships as its own folder under `data/` —
   `CASE_EN.md` (the narrative), `core.json`/`supplement.json` (the claims),
   `graph.json`/`comparison_graph.json` (the graph slice), `sources.json`, and
   `expected_native_operations.json` (the production-verified control results — see
   step 4). Two provenance records sit next to them, both made before publication:
   `MANIFEST.json` (the iteration version and the sha256 of each bundle file) and
   `PUBLIC_EXPORT.json` (which editorial working fields were left out of the public
   data, and the sha256 of the resulting files).
2. **"Recomputed in your browser."** This viewer makes no server calls and queries no
   database at runtime. Every native-operation number/anchor list you see on the
   Findings tab is computed live, in this repository's own TypeScript, straight from
   the JSON files under `data/`, the moment you open the tab or switch case — see
   `src/operations/nativeOperations.ts` (the per-operation compute functions) and
   `src/operations/findings.ts` (turning a result's rows into the finding sentence's
   `{n_rows}`/`{anchors}`/named placeholders). Open a tab's "Technical details"
   disclosure to see, per operation, whether this repository has a compute function
   for it at all ("reproduced in your browser · matches"), or whether it's a recorded
   control result with no independent recomputation ("recorded result only").
3. **What "matches" means.** `expected_native_operations.json` records, per operation,
   the exact Cypher query that was run against the production graph and the exact rows
   it returned (`expected`) — a snapshot of a real database query, not a value this
   repository invented. `runNativeOperations` compares its own freshly computed rows
   against that recorded snapshot, order-insensitively where the underlying query gives
   no ordering guarantee (documented case by case in `nativeOperations.ts`). A mismatch
   is shown, not hidden — see the "mismatch vs. recorded production result" wording and
   its row-level detail in the technical footnote.
4. **Running it yourself.**
   ```sh
   npm install
   npm test         # runs every unit/component test, including the row-for-row
                     # recomputation checks described above
   npm run typecheck
   npm run build
   ```
   `npm test`'s `src/operations/nativeOperations.test.ts` and
   `src/operations/findings.test.ts` are the tests that actually exercise the claims
   in points 2–3 above; a passing run is the same recomputation-vs-recorded-result
   check the live app performs, just from the command line instead of a browser tab.

## What's independently recomputed vs. shown as a control

An operation is independently recomputed when this viewer has JS for its name in
`src/operations/nativeOperations.ts`'s `runNativeOperations` switch; that is a
property of the operation *name*, not of the bundle's own `native`/`partially_native`
status label (which is a data-provenance note the bundle carries for its own reasons —
e.g. C1's `source_comparison_by_feature` is `partially_native` only because its
template covers two of five sources in scope, yet is still fully recomputable for the
selected pair).

For **C2**, six of its seven operations are recomputed and checked row-for-row against
the production-verified `expected` rows. The seventh, `feature_level_split`, is
`partially_native`: its expected rows reference claims from the wider Qinlian target
that fall outside C2's nine-claim comparison scope, so this viewer has no data to
recompute it from — shown as a **recorded control result, not an independent
recomputation**.

For **C1**, all eight declared operations are recomputed, including
`source_comparison_by_feature`. Its ninth, `feature_level_split`, is not part of C1's
`operations` array at all — it is recorded under `not_applicable` with its own reason
(C1 works with metalinguistic composition/rank features, not the phonological feature
`feature_level_split` needs) and rendered as a separate not-applicable card.

For **C3**, all eleven declared operations are recomputed, including the case-specific
`address_level_by_source` (which of its four sources attaches its statements to the
group address `YUE` vs. a named subgroup address) and the three
`target_comparison_by_feature__<pair>`-suffixed operations (one per pair among
`YUE_SIYI`/`YUE_GAOYANG`/`YUE_GUANGFU`, matched by name prefix rather than one shared
operation name — see `runNativeOperations`). `contested_cell` recomputes to exactly
zero rows, matching production: this comparison scope has no target+feature cell with
both an attested and a not_attested record. Like C1, `feature_level_split` (C2's
phonological-feature operation) is recorded under C3's `not_applicable`, not its
`operations` array — C3 works with metalinguistic level/membership/criteria features.

`shared_basis` needed one extra step in both cases: the bundle does not export
`Evidence.start_char`/`end_char` directly. Those spans are reconstructed
(`src/operations/spans.ts`) by finding the minimal contiguous run of a claim's curated
`context_segments` whose concatenated text reconstructs the claim's own quote.

`independent_bases`' `source_ids` column is compared order-insensitively: it comes
from `collect(DISTINCT s.id)` over an `OPTIONAL MATCH` Neo4j does not order, so only
set membership — not array order — is a real query guarantee (confirmed empirically:
C1's recorded `source_ids` order does not match this viewer's own claim-encounter
order, unlike every other `collect(DISTINCT ...)` column in either bundle).

For **C4**, `shared_basis`, `records_by_value`, `source_value_pairs`,
`within_source_divergence`, and `independent_bases / distinct_textual_bases` (C4's own
name for the same idea C1–C3 call `independent_bases`, recording a single
`{components_merged_by_shared_basis, distinct_textual_bases}` totals object rather
than per-feature rows) are all recomputed and checked against production. C4's own
`shared_basis` finds exactly 2 pairs, not the dozens one might expect from "the Taishan
dictionary repeats its header 12/14 times" (P09/P10): each dictionary entry sits in its
own chunk, so there is no same-chunk span overlap to find — the repetition is a
property of the source's structure, not of graph storage (see the bundle's own
`caveat_en` for this operation). C4's sixth declared operation,
`count_independent_analyses`, is recorded under `not_applicable` (technical
idiom_tag+document+value pairs do not substitute for analysis_id/authorship
annotation — one of C4's own pairs, P17, holds one author's own analysis together with
a retelling of another's inside a single document). One known upstream data defect,
found while wiring this up rather than papered over: `expected_native_operations.json`'s
own recorded `source_value_pairs.expected` rows spell one Xinyi document's title
"信宜方志" on all four of its rows, while `sources.json`/every native record's own
`source_title` spell it "信宜方言志" (the correct, longer form — confirmed against
`sources.json`); recomputing from this viewer's own (correctly spelled) `sources.json`
is the honest result, and this one document's four rows show as a mismatch rather than
being silently coerced to match the bundle's own inconsistent expectation.

C4 also carries native `start_char`/`end_char` directly (unlike C1–C3, which need the
`spans.ts` reconstruction above) — the same-shaped span still backs `shared_basis` and
the Evidence panel's "Full passage context" quote highlight, just without a
reconstruction step.

## Single-file build and reproducing the published artifact

`npm run build:single` (`vite.single.config.ts`) writes `dist-single/index.html` with
JS, CSS and the case data inlined — no external scripts, stylesheets or images. This
file is the canonical public copy of the Casebook: the PaRAGraph site vendors it with a
SHA-256 manifest (the source commit of this repository plus the hash of the artifact)
and serves it at https://www.sciencerag.win/casebook. Building must leave the working
tree clean — `dist/` and `dist-single/` are git-ignored — so the recorded source commit
describes exactly what was built.

**Reproducing the published artifact.** The build is deterministic (two consecutive
builds on the same checkout give a byte-identical file; checked with Node v23.10.0):

```sh
# 1. find the commit and hash the published page was built from
curl -s https://www.sciencerag.win/casebook/manifest.json   # fields: source_commit, artifact_sha256
# 2. build exactly that commit
git checkout <source_commit>
npm ci
npm run build:single
# 3. compare with artifact_sha256
shasum -a 256 dist-single/index.html
```
