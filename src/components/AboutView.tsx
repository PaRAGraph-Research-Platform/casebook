import { useMemo } from "react";
import { CASES } from "../cases/registry";
import { CASEBOOK_DOI, CASEBOOK_URL, CASEBOOK_VERSION, CONTACT, REPO_URL } from "../config";
import type { CasebookBundle } from "../types/bundle";

const CITATION_TEXT = `Kozha, K. A. & I. Kozha. 2026. PaRAGraph Casebook: source-grounded cases in Yue dialect classification and tone inventories. ${CASEBOOK_VERSION.charAt(0).toUpperCase()}${CASEBOOK_VERSION.slice(1)}. Zenodo. https://doi.org/${CASEBOOK_DOI}`;

const CITATION_BIBTEX = `@misc{kozha2026paragraph,
  author = {Kozha, K. A. and Kozha, I.},
  title = {PaRAGraph Casebook: source-grounded cases in Yue dialect classification and tone inventories},
  year = {2026},
  note = {${CASEBOOK_VERSION}},
  publisher = {Zenodo},
  doi = {${CASEBOOK_DOI}},
  url = {${CASEBOOK_URL}}
}`;

/**
 * Public-facing About page: what this artifact is, how to read the native
 * vs. editorial layers and its declared boundaries. Per case, an "Open
 * questions" section collects whatever English
 * translations of the editors' own open questions the bundle carries
 * (`manifest.open_questions_en`, `levelsTable.curator_questions_en`,
 * `nativeOperations.remains_curated.{note,items}_en`) — a case with none of
 * these simply gets no section, rather than falling back to the editors'
 * own working-language text.
 */
export function AboutView() {
    const caseBundles = useMemo(
        () => CASES.map((caseDef) => ({ caseDef, bundle: caseDef.loadBundle() as CasebookBundle })),
        []
    );

    return (
        <div className="about-view">
            <section>
                <h2>What this is</h2>
                <p>
                    This viewer is a companion artifact to a research article, showing four prepared
                    cases (C1–C4) drawn from a larger research platform (PaRAGraph). Each
                    case ships as its own versioned data bundle:
                </p>
                <ul>
                    {caseBundles.map(({ caseDef, bundle }) => (
                        <li key={caseDef.id}>
                            <strong>{caseDef.shortLabel}</strong> — {bundle.manifest.version}
                        </li>
                    ))}
                </ul>
                <p>
                    It has no dependency on the PaRAGraph backend and makes no live API calls: every
                    graph slice, source record, and recorded operation result comes from vendored,
                    hash-checked JSON shipped with this repository.
                </p>
                {caseBundles.map(({ caseDef, bundle }) => (
                    <SnapshotCheckNote key={`snapshot-${caseDef.id}`} label={caseDef.shortLabel} bundle={bundle} />
                ))}
            </section>

            <section>
                <h2>How to read it</h2>
                <ul>
                    <li>
                        Every claim carries two layers, kept visibly apart: <strong>native fields</strong>{" "}
                        exported directly from the production graph (feature, target, polarity, quote,
                        evidence/chunk/document ids), and an editorial/derived layer added on top (role,
                        printed page, table groupings, anchor-to-claim mapping). That added layer is
                        labelled along three separate axes, shown wherever a bundle records them: <em>how
                        it was obtained</em> (a platform record, an editor's own note, or extracted by a
                        model), <em>how it was computed</em> (exported straight from the graph vs. a view
                        computed from graph data), and its <em>review status</em> (not yet expert-reviewed,
                        or expert-reviewed). A field produced by a model is always labelled as such, never
                        described as an editor's own manual work. Any table row built from curator
                        judgement additionally carries its own "Editorial reconstruction" badge.
                    </li>
                    <li>
                        The Findings tab distinguishes native operations from recorded editorial
                        observations. Native operations with a browser implementation are recomputed from
                        the bundle's own data and checked against a production-verified result; recorded
                        editorial observations are labelled as such. See the public repository for exactly
                        how:{" "}
                        <a href={REPO_URL} target="_blank" rel="noopener">
                            {REPO_URL}
                        </a>
                        .
                    </li>
                    <li>
                        Anchors (e.g. "A1", "K2") are the thread that ties everything together: a token
                        in the case narrative resolves to a claim, which resolves to a quote and a
                        source locator (printed page where the source has one, physical page and OCR
                        method otherwise) — clickable end to end, never a raw id in the main flow.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Boundaries</h2>
                <ul>
                    <li>
                        This is a demonstration of a working approach on a small, prepared slice — not a
                        benchmark of retrieval/extraction quality, and not proof that an equivalent
                        operation is impossible in another system.
                    </li>
                    <li>
                        A claim count is not a count of independent observations or lects: the same
                        underlying fact can be recorded once or several times depending on how a source
                        states it, and the number of documents behind a claim is not itself a measure of
                        independence.
                    </li>
                    <li>
                        A working address (e.g. <code>YUE_SIYI</code>) is an index over a territory this
                        bundle uses to collect statements — not a claim that it equals, or supersedes, a
                        source's own named unit.
                    </li>
                    <li>
                        Polarity, value, and the absence of a record are not the same thing and are never
                        collapsed into one another: a claim's own <code>null</code> fields stay visible
                        as <code>null</code>, not silently coerced to a default.
                    </li>
                    <li>
                        A source's printed page number and its PDF's physical page index are two
                        different fields; where a source carries no printed pagination this viewer says
                        so rather than substituting the physical index.
                    </li>
                    <li>
                        Any correspondence drawn between different sources' or schemes' units (e.g. C3's
                        Levels tab) is an editorial reconstruction, attributed and badged as such — never
                        a native graph relation.
                    </li>
                    <li>
                        A matched operation result confirms citation/adressing integrity — that the
                        claim, evidence, and source records line up the way the bundle says they do — not
                        the scientific truth of what a source states.
                    </li>
                </ul>
            </section>

            <section>
                <h2>Licence, quotations and how to cite</h2>
                <p>
                    This repository carries three different sets of rights, kept deliberately apart:
                </p>
                <ul>
                    <li>
                        <strong>This viewer's own code</strong> is MIT-licensed — see{" "}
                        <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener">
                            LICENSE
                        </a>{" "}
                        in the repository.
                    </li>
                    <li>
                        <strong>The curated content</strong> — annotations, case narratives, source
                        passports, the graph/claim/evidence structure, and every other record produced by
                        the editors' own analysis — is licensed under CC BY 4.0. See{" "}
                        <a href={`${REPO_URL}/blob/main/LICENSING.md`} target="_blank" rel="noopener">
                            LICENSING.md
                        </a>{" "}
                        for exactly what that covers and how to attribute it.
                    </li>
                    <li>
                        <strong>Quoted passages from the sources themselves</strong> are not licensed at
                        all: they are shown under the quotation exception, for analysis and criticism,
                        with the source and page named alongside each one. All rights in that text remain
                        with its own rightsholders. Full source texts and PDFs are never distributed by
                        this repository — see{" "}
                        <a href={`${REPO_URL}/blob/main/NOTICE.md`} target="_blank" rel="noopener">
                            NOTICE.md
                        </a>{" "}
                        for the list of quoted works.
                    </li>
                </ul>
                <p>
                    The companion research article is in preparation; the Article tab will carry its text
                    once a preprint is available.
                </p>
                <h3>How to cite</h3>
                <p>{CITATION_TEXT}</p>
                <details>
                    <summary>BibTeX</summary>
                    <pre className="citation-bibtex">{CITATION_BIBTEX}</pre>
                </details>
                <h3>Contact</h3>
                <p>
                    Questions and corrections:{" "}
                    <a href={CONTACT.url} target="_blank" rel="noopener">
                        {CONTACT.label}
                    </a>
                    .
                </p>
            </section>

            <section>
                <h2>Open questions</h2>
                <p className="muted">
                    Open questions the editors are still working through for a given case, and what the
                    graph does not compute for it — shown here only where an English version exists.
                </p>
                {caseBundles.map(({ caseDef, bundle }) => (
                    <CaseOpenQuestions key={caseDef.id} label={caseDef.shortLabel} bundle={bundle} />
                ))}
            </section>
        </div>
    );
}

/**
 * Renders a case's frozen-snapshot re-check (C4's `snapshotCheck`), when the
 * bundle carries one, entirely from that file's own numbers — never a
 * hardcoded count, so this note tracks whatever a future re-import records
 * instead of going stale.
 */
function SnapshotCheckNote({ label, bundle }: { label: string; bundle: CasebookBundle }) {
    const check = bundle.snapshotCheck;
    if (!check) return null;
    const snapshot = check.aggregate_check.snapshot_summary_2026_09_16;
    const checkedDate = check.checked_at.slice(0, 10);
    return (
        <p className="muted">
            <strong>{label}:</strong> Frozen snapshot 16 Sep 2026: {snapshot.rows} records /{" "}
            {snapshot.documents} documents / {snapshot.tags} locality labels; re-checked against the live
            graph on {checkedDate}:{" "}
            {check.aggregate_check.match ? "exact match" : "mismatch — see snapshot_check.json"}.
        </p>
    );
}

function CaseOpenQuestions({ label, bundle }: { label: string; bundle: CasebookBundle }) {
    const openQuestions = bundle.manifest.open_questions_en ?? [];
    const levelsQuestions = bundle.levelsTable?.curator_questions_en ?? [];
    const remainsCurated = bundle.nativeOperations.remains_curated;
    const remainsCuratedItems = remainsCurated.items_en ?? [];

    const hasAnything =
        openQuestions.length > 0 ||
        levelsQuestions.length > 0 ||
        Boolean(remainsCurated.note_en) ||
        remainsCuratedItems.length > 0;

    if (!hasAnything) return null;

    return (
        <div className="open-questions-case">
            <h3>{label}</h3>
            {(openQuestions.length > 0 || levelsQuestions.length > 0) && (
                <ul>
                    {openQuestions.map((question, index) => (
                        <li key={`manifest-${index}`}>{question}</li>
                    ))}
                    {levelsQuestions.map((question, index) => (
                        <li key={`levels-${index}`}>{question}</li>
                    ))}
                </ul>
            )}
            {(remainsCurated.note_en || remainsCuratedItems.length > 0) && (
                <div>
                    <h4>What the graph does not compute</h4>
                    {remainsCurated.note_en && <p>{remainsCurated.note_en}</p>}
                    {remainsCuratedItems.length > 0 && (
                        <ul>
                            {remainsCuratedItems.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
