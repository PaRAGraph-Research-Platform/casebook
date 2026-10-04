<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/paragraph-mark-dark.svg">
    <img src="assets/paragraph-mark.svg" alt="PaRAGraph" width="72" height="72">
  </picture>
</p>

<h1 align="center">PaRAGraph Casebook</h1>

<p align="center">
  Source-grounded cases in Yue dialect classification and tone inventories
</p>

<p align="center">
  <a href="https://www.sciencerag.win/casebook"><strong>Open the live casebook</strong></a>
  &nbsp;·&nbsp; <a href="#how-to-cite">How to cite</a>
  &nbsp;·&nbsp; <a href="#check-it-yourself">Check it yourself</a>
  &nbsp;·&nbsp; <a href="https://www.sciencerag.win/info">About PaRAGraph</a>
</p>

The Casebook is a companion to a research article about PaRAGraph, a source-grounded
research platform that works with scholarly literature through a knowledge graph of
claims, evidence and sources. Each case pairs a short narrative with the slice of the
graph behind it: the statements, the quoted passages that support them, the sources, and
graph operations your browser recomputes from the same data.

## The cases

- **C1 — One territory, four partitions: a shared index is not a shared unit.**
  Yue dialects of south-western Guangdong.
- **C2 — Same variety, new evidence: when a classification changes.**
  Lianzhou 廉州 Yue (Hepu, Beihai, Guangxi).
- **C3 — Same names, different depths: aligning hierarchies of unequal rank.**
  Siyi–Liangyang and the Yue branches of the Language Atlas of China.
- **C4 — Same field, different units: when numbers are not comparable.**
  Tone inventories of Guangzhou, Taishan and Xinyi.

## How to read it

Pick a case with the switcher at the top of the page, then:

- **Case** — the narrative; record ids such as K1 or A1 open the quote, its source and
  page in the Evidence panel.
- **Explore** — the case's graph of claims, evidence, features and sources.
- **Findings** — plain-language results of the graph operations, recomputed in your
  browser; technical detail sits in a closed footnote at the bottom.
- **Positions** (C1), **Levels** (C3), **Passport** (C4) — curated comparison tables.
- **About** — scope, how to tell graph data from editorial notes, open questions.

The Casebook is not the PaRAGraph platform and makes no server or database calls. A
matching result confirms that claims, evidence and sources line up as recorded; it does
not establish the scientific truth of what a source states.

## Check it yourself

Every finding is recomputed from the JSON under `data/` and compared with the result
recorded on the production graph. The same check runs from the command line:

```sh
npm ci
npm test              # includes the row-for-row recomputation checks
npm run build:single  # the exact single-file page served at /casebook
```

The build is deterministic: the commit and sha256 of the published page are listed in
[`/casebook/manifest.json`](https://www.sciencerag.win/casebook/manifest.json), so the
live page can be rebuilt byte for byte. Step-by-step instructions are in
[docs/verification.md](docs/verification.md).

## How to cite

> Kozha, K. A. 2026. PaRAGraph Casebook: source-grounded cases in Yue dialect
> classification and tone inventories. Version 0.3. https://www.sciencerag.win/casebook
> (source code and data: https://github.com/PaRAGraph-Research-Platform/casebook)

```bibtex
@misc{kozha2026paragraph,
  author = {Kozha, K. A.},
  title = {PaRAGraph Casebook: source-grounded cases in Yue dialect classification and tone inventories},
  year = {2026},
  note = {Version 0.3},
  url = {https://www.sciencerag.win/casebook},
  howpublished = {Source code and data: \url{https://github.com/PaRAGraph-Research-Platform/casebook}}
}
```

## License

- **Code** — MIT, see [`LICENSE`](LICENSE).
- **Curated content** (annotations, case narratives, source passports, the graph
  structure) — CC BY 4.0, see [`LICENSE-CC-BY`](LICENSE-CC-BY); scope and attribution in
  [`LICENSING.md`](LICENSING.md).
- **Quoted passages from sources** — not licensed by this repository; shown under the
  quotation exception, all rights remain with their rightsholders. Quoted works are listed
  in [`NOTICE.md`](NOTICE.md).

## Documentation

- [docs/verification.md](docs/verification.md) — how each finding is produced and checked,
  what is recomputed vs. shown as a recorded control, reproducing the published page.
- [docs/architecture.md](docs/architecture.md) — running and building, case bundle
  differences, data layout and versions, source structure, native vs. editorial layer.

## Contact

Questions and corrections: ksenia@sciencerag.win · Platform: https://www.sciencerag.win/info
