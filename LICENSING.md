# PaRAGraph Casebook — licensing

This repository carries three separate sets of rights:

- **Viewer code** — MIT, see [`LICENSE`](LICENSE).
- **Curated content** — CC BY 4.0, full legal text in [`LICENSE-CC-BY`](LICENSE-CC-BY);
  what exactly it covers is set out below.
- **Quoted passages from third-party works** — not licensed by this repository; see
  the carve-out at the end of this file and [`NOTICE.md`](NOTICE.md).

The rest of this file describes the *content* layer (curated annotations, case
narratives, source passports, the graph/claim/evidence structure, and every
other record produced as a result of the editors' own analysis).

## What is covered (CC BY 4.0)

The following are licensed under the Creative Commons Attribution 4.0
International License (CC BY 4.0), SPDX identifier `CC-BY-4.0`:

- Everything under `data/**` that is not itself a quoted passage from a
  source: claim/evidence/feature/source records, the curated `annotation`
  layer on each claim (role, position, printed-page mapping, author-unit
  naming, review status, and so on), `MANIFEST.json`/`counts.json`, and the
  computed native-operation results.
- The editors' own text in case narratives (`CASE_EN.md` for each case bundle),
  excluding quotations from third-party sources.
- The editors' own structure and annotations in curated tables
  (`positions_table.json`, `levels_table.json`, `pairs_table.json`,
  `passports.json`). Embedded third-party quotations and source text
  transcriptions remain excluded from the grant.
- The graph structure itself (`graph.json`, `comparison_graph.json`): which
  nodes and edges exist, and how they connect claims, evidence, features,
  sources, and subgroups. CC BY 4.0 is used rather than a plain content
  license specifically because it also covers the EU's *sui generis*
  database right, which can attach to a structured collection like this one
  independently of copyright in its individual entries.

CC BY 4.0 was chosen by the project's research lead as the license for this
layer. The full legal text is in [`LICENSE-CC-BY`](LICENSE-CC-BY) and at
<https://creativecommons.org/licenses/by/4.0/legalcode>.

**The companion research article is not covered by CC BY 4.0.** It is by
K. A. Kozha and its text is not distributed in this repository (the Article
tab currently shows a placeholder); © the author.

### Attribution

If you reuse or redistribute the CC BY 4.0–covered content, attribute it as:

> Kozha, K. A. & I. Kozha. 2026. *PaRAGraph Casebook: source-grounded cases in
> Yue dialect classification and tone inventories.* Version <number>. Zenodo.
> https://doi.org/<version DOI>

(See the app's About tab, or `CASEBOOK_VERSION` and `CASEBOOK_DOI` in
`src/config.ts`, for the current version and its DOI; all versions:
<https://doi.org/10.5281/zenodo.23140492>.)

## What is not covered: quoted third-party passages

Quoted passages from third-party works are reproduced under the quotation
exception for purposes of analysis and criticism. They are excluded from the
CC BY 4.0 grant above; all rights remain with the respective rightsholders.
See [`NOTICE.md`](NOTICE.md) for the list of quoted works.
