import { Fragment } from "react";
import { observer } from "mobx-react-lite";
import type { CasebookStore } from "../stores/CasebookStore";
import type { OperationRunResult } from "../operations/nativeOperations";
import { computeFindingVars, tokenizeFinding, type FindingToken } from "../operations/findings";
import { MajorityBlock } from "./MajorityBlock";
import { REPO_URL } from "../config";
import type { ContextFindingEntry, NativeOperationDefinition, NotApplicableOperation } from "../types/bundle";
import {
    featureShortLabel,
    humanizeOperationName,
    operationCaveatAddition,
    operationQuestionLabel,
    operationStatusLabel,
    operationTitleLabel,
    sourceShortLabel,
} from "../utils/labels";

interface OperationsViewProps {
    store: CasebookStore;
}

/** Operations whose rows describe a *pair/group* of claims sharing a basis
 * (a same-passage pair for `shared_basis`, a target+feature cell with
 * opposite polarity for `contested_cell`) — worth showing the participants'
 * own quotation(s) once, under the finding sentence, rather than leaving the
 * reader to click each anchor chip separately to see what they say. */
const PAIR_QUOTE_OPERATIONS = new Set(["shared_basis", "contested_cell"]);

/** Row keys known to carry a claim id (or an array of claim ids) across
 * every operation this viewer computes — the same convention the technical
 * footnote's own row-humanizer uses (see `CLAIM_ID_KEYS`/`CLAIM_ID_ARRAY_KEYS`
 * below), reused here to find a pair-quote operation's participants without
 * hardcoding one operation's own column names. */
const PARTICIPANT_ID_KEYS = ["claim_id", "claim_a", "claim_b"];
const PARTICIPANT_ID_ARRAY_KEYS = ["claim_ids", "target_a_claims", "target_b_claims"];

/** Renders a `tokenizeFinding` token list: plain text as-is, an
 * `anchors_of`-shaped var as grouped `.anchor-link` chips — one chip-group
 * per contributing row (e.g. one `shared_basis` pair), each group's chips
 * joined by "·" and groups joined by ", " so multiple pairs read as
 * "K4 · K5, S1 · S2" rather than one flat pile — any other resolved var as
 * plain inline text. */
function FindingTokens({ tokens, onAnchorClick }: { tokens: FindingToken[]; onAnchorClick: (anchor: string) => void }) {
    return (
        <>
            {tokens.map((token, index) => {
                if (token.type === "var" && token.anchorGroups && token.anchorGroups.length > 0) {
                    return (
                        <span key={index}>
                            {token.anchorGroups.map((group, groupIndex) => (
                                <Fragment key={groupIndex}>
                                    {groupIndex > 0 && ", "}
                                    {group.map((anchor, anchorIndex) => (
                                        <Fragment key={anchor}>
                                            {anchorIndex > 0 && " · "}
                                            <button type="button" className="anchor-link" onClick={() => onAnchorClick(anchor)}>
                                                {anchor}
                                            </button>
                                        </Fragment>
                                    ))}
                                </Fragment>
                            ))}
                        </span>
                    );
                }
                return <span key={index}>{token.text}</span>;
            })}
        </>
    );
}

/** Every distinct claim id a set of rows mentions across the known
 * claim-id-shaped columns, in first-encounter order. */
function participantClaimIds(rows: Array<Record<string, unknown>>): string[] {
    const ids: string[] = [];
    const seen = new Set<string>();
    const add = (id: unknown) => {
        if (typeof id === "string" && !seen.has(id)) {
            seen.add(id);
            ids.push(id);
        }
    };
    for (const row of rows) {
        for (const key of PARTICIPANT_ID_KEYS) add(row[key]);
        for (const key of PARTICIPANT_ID_ARRAY_KEYS) {
            const value = row[key];
            if (Array.isArray(value)) for (const id of value) add(id);
        }
    }
    return ids;
}

/**
 * `shared_basis`/`contested_cell`'s own special case (see
 * `PAIR_QUOTE_OPERATIONS`): shows the participating claims' own quotation(s)
 * once each — grouped by identical quote text, so two claims that literally
 * quote the same sentence never show the same quotation twice — with the
 * contributing anchors as chips underneath each one. Returns null when
 * there is nothing to show.
 */
function PairQuoteBlock({ store, rows }: { store: CasebookStore; rows: Array<Record<string, unknown>> }) {
    const participants = participantClaimIds(rows)
        .map((id) => store.claimById.get(id))
        .filter((claim): claim is NonNullable<typeof claim> => Boolean(claim));
    if (participants.length === 0) return null;

    const groupsByQuote = new Map<string, typeof participants>();
    for (const claim of participants) {
        const quote = claim.native.quote ?? "";
        const group = groupsByQuote.get(quote) ?? [];
        group.push(claim);
        groupsByQuote.set(quote, group);
    }

    return (
        <div className="finding-shared-quote">
            {[...groupsByQuote.entries()].map(([quote, group]) => (
                <div key={quote || group[0].native.claim_id}>
                    {quote && <blockquote className="quote">{quote}</blockquote>}
                    <div className="finding-participants">
                        {group.map((claim) => (
                            <button
                                key={claim.native.claim_id}
                                type="button"
                                className="anchor-link"
                                onClick={() => store.selectAnchor(claim.annotation.anchor)}
                            >
                                {claim.annotation.anchor}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface FindingCardProps {
    store: CasebookStore;
    definition: NativeOperationDefinition;
    result: OperationRunResult | undefined;
}

/**
 * The reader-facing unit of the Findings tab: title, the finding itself
 * (large, serif, its own placeholders already substituted with numbers/
 * grouped anchor chips), the participants' own quotation(s) for a
 * `shared_basis`/`contested_cell`-shaped finding, and a one-line "why it
 * matters" gloss. `question_en` is deliberately not shown here — it moved to
 * the technical footnote (see `TechOperationBlock`) — and there are no
 * tables, no NATIVE/PARTIAL pills, no raw ids in this card.
 */
function FindingCard({ store, definition, result }: FindingCardProps) {
    const claimAnchor = (id: string) => store.claimById.get(id)?.annotation.anchor ?? id;
    const titleEn = operationTitleLabel(definition.name, definition.title_en ?? humanizeOperationName(definition.name));
    const rows = result ? (result.recomputed ? result.computedRows : result.expectedRows) : [];
    const isEmpty = rows.length === 0;
    const expected = isEmpty ? [] : rows;

    const template = isEmpty ? definition.finding_empty_en ?? "No rows in this selection." : definition.finding_en ?? "";
    const resolvedVars = computeFindingVars(definition.finding_vars, expected, claimAnchor);
    const tokens = tokenizeFinding(template, resolvedVars);

    return (
        <li className="finding-card">
            <h3>{titleEn}</h3>
            <p className="finding-text">
                <FindingTokens tokens={tokens} onAnchorClick={(anchor) => store.selectAnchor(anchor)} />
            </p>
            {!isEmpty && PAIR_QUOTE_OPERATIONS.has(definition.name) && <PairQuoteBlock store={store} rows={rows} />}
            {definition.why_it_matters_en && <p className="finding-why">{definition.why_it_matters_en}</p>}
        </li>
    );
}

/** Reader-facing card for a not-applicable entry — no compute function
 * exists for it in this case, by the editors' own design decision, not a
 * bug. Uses the same optional finding-style fields a future bundle build
 * may add (`title_en`/`finding_en`/`why_it_matters_en`), falling back to a
 * humanized name + the bundle's own `reason_en`. */
function NotApplicableCard({
    name,
    entry,
    store,
}: {
    name: string;
    entry: NotApplicableOperation;
    store: CasebookStore;
}) {
    return (
        <li className="finding-card finding-card-not-applicable">
            <h3>{entry.title_en ?? humanizeOperationName(name)}</h3>
            <p className="finding-text">
                {entry.finding_en ?? entry.reason_en ?? (
                    <button type="button" className="link-button" onClick={() => store.setActiveTab("about")}>
                        See dataset notes
                    </button>
                )}
            </p>
            {entry.why_it_matters_en && <p className="finding-why">{entry.why_it_matters_en}</p>}
        </li>
    );
}

/**
 * Reader-facing card for a `context_findings` entry (C4's `addressing_gap`):
 * a slice-wide observation the bundle-build side already counted against
 * the production graph, with its numbers baked directly into `finding_en`'s
 * prose — no per-row recomputation to check here, so this renders the
 * bundle's own text as-is rather than routing it through
 * `computeFindingVars`/`tokenizeFinding` (which exist to fill placeholders
 * this entry's `finding_en` doesn't have).
 */
function ContextFindingCard({ entry }: { entry: ContextFindingEntry }) {
    return (
        <li className="finding-card">
            <h3>{entry.title_en}</h3>
            <p className="muted finding-provenance">
                Recorded editorial observation — supplied with this bundle; not recomputed in this browser.
            </p>
            <p className="finding-text">{entry.finding_en}</p>
            {entry.why_it_matters_en && <p className="finding-why">{entry.why_it_matters_en}</p>}
        </li>
    );
}

export const OperationsView = observer(function OperationsView({ store }: OperationsViewProps) {
    const results = store.nativeOperationResults;
    const notApplicable = Object.entries(store.bundle.nativeOperations.not_applicable ?? {});
    const contextFindings = Object.entries(store.bundle.nativeOperations.context_findings ?? {});
    // Every operation is still recomputed and listed in the technical
    // footnote below regardless of this flag (see TechnicalFootnote) — only
    // the main, reader-facing flow is filtered to reader_visible === true.
    // Absent (older/synthetic bundles) defaults to visible, so this view
    // degrades to "show everything" rather than "show nothing" for a bundle
    // that predates this field.
    const visibleOperations = store.bundle.nativeOperations.operations.filter(
        (definition) => definition.reader_visible ?? true
    );
    const visibleNotApplicable = notApplicable.filter(([, entry]) => entry.reader_visible === true);
    const visibleContextFindings = contextFindings.filter(([, entry]) => entry.reader_visible === true);

    return (
        <div className="operations-view">
            {store.caseDef.hasPairsToggle && <MajorityBlock store={store} />}

            <ul className="findings-list">
                {visibleOperations.map((definition) => (
                    <FindingCard key={definition.name} store={store} definition={definition} result={results[definition.name]} />
                ))}
                {visibleNotApplicable.map(([name, entry]) => (
                    <NotApplicableCard key={name} name={name} entry={entry} store={store} />
                ))}
                {visibleContextFindings.map(([name, entry]) => (
                    <ContextFindingCard key={name} entry={entry} />
                ))}
            </ul>

            <TechnicalFootnote store={store} results={results} />
        </div>
    );
});

/* ---------------------------------------------------------------------- */
/* Technical footnote — everything the old, table-first Operations tab     */
/* used to show up front, now a closed accordion far from the first lines. */
/* ---------------------------------------------------------------------- */

const HIDDEN_IN_HUMANIZED = new Set(["evidence_id", "ev_a", "ev_b", "chunk_id"]);
const CLAIM_ID_KEYS = new Set(["claim_id", "claim_a", "claim_b"]);
const CLAIM_ID_ARRAY_KEYS = new Set(["claim_ids", "target_a_claims", "target_b_claims"]);
const SOURCE_ID_KEYS = new Set(["document_id"]);
const SOURCE_ID_ARRAY_KEYS = new Set(["source_ids"]);
const FEATURE_KEYS = new Set(["feature"]);

function humanizeRow(
    row: Record<string, unknown>,
    claimAnchor: (id: string) => string,
    sourceLabel: (id: string) => string
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        if (HIDDEN_IN_HUMANIZED.has(key)) continue;
        if (CLAIM_ID_KEYS.has(key) && typeof value === "string") {
            out[key] = claimAnchor(value);
        } else if (CLAIM_ID_ARRAY_KEYS.has(key) && Array.isArray(value)) {
            out[key] = value.map((v) => claimAnchor(String(v))).join(", ");
        } else if (SOURCE_ID_KEYS.has(key) && typeof value === "string") {
            out[key] = sourceLabel(value);
        } else if (SOURCE_ID_ARRAY_KEYS.has(key) && Array.isArray(value)) {
            out[key] = value.map((v) => sourceLabel(String(v))).join(", ");
        } else if (FEATURE_KEYS.has(key) && typeof value === "string") {
            out[key] = featureShortLabel(value);
        } else {
            out[key] = value;
        }
    }
    return out;
}

function formatCell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
}

function RawTable({ rows, columns, columnLabel }: { rows: Array<Record<string, unknown>>; columns: string[]; columnLabel?: (column: string) => string }) {
    return (
        <div className="table-scroll">
            <table className="operation-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column} title={column}>
                                {columnLabel ? columnLabel(column) : column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index}>
                            {columns.map((column) => (
                                <td key={column}>{formatCell(row[column])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function verdictLine(result: OperationRunResult | undefined): string {
    if (!result) return "not yet computed";
    if (!result.recomputed) return "recorded result only (no independent recomputation for this operation)";
    if (result.matchesExpected) return `reproduced in your browser · matches (${result.computedRows.length} rows)`;
    return `mismatch vs. the recorded production result — ${result.computedRows.length} rows computed, ${result.expectedRows.length} rows recorded`;
}

function TechOperationBlock({ store, definition, result }: FindingCardProps) {
    const claimAnchor = (claimId: string) => store.claimById.get(claimId)?.annotation.anchor ?? claimId;
    const sourceLabel = (documentId: string) => {
        const source = store.sourceById.get(documentId);
        return source ? sourceShortLabel(source) : documentId;
    };
    const titleEn = operationTitleLabel(
        definition.name,
        definition.title_en ?? result?.titleEn ?? humanizeOperationName(definition.name)
    );
    const questionEn = operationQuestionLabel(definition.name, definition.question_en);
    const caveatAddition = operationCaveatAddition(definition.name);
    const rows = result ? (result.recomputed ? result.computedRows : result.expectedRows) : [];
    const columnLabel = (column: string) => definition.columns_en?.[column] ?? column;

    return (
        <div className="tech-operation-block">
            <h4>{titleEn}</h4>
            <p className="muted tech-operation-question">{questionEn}</p>
            <p className="tech-operation-status">
                <span className={`status-badge ${definition.status}`}>{operationStatusLabel(definition.status)}</span>{" "}
                {verdictLine(result)}
            </p>
            {(definition.caveat_en ?? definition.caveat ?? caveatAddition) && (
                <p className="caveat">{definition.caveat_en ?? definition.caveat ?? caveatAddition}</p>
            )}
            {result && !result.matchesExpected && result.mismatchDetail && (
                <pre className="mismatch-detail">{result.mismatchDetail}</pre>
            )}
            {rows.length === 0 ? (
                <p className="muted">No rows.</p>
            ) : (
                <RawTable
                    rows={rows.map((row) => humanizeRow(row, claimAnchor, sourceLabel))}
                    columns={Object.keys(humanizeRow(rows[0], claimAnchor, sourceLabel))}
                    columnLabel={columnLabel}
                />
            )}
            <details className="raw-rows-accordion">
                <summary>Cypher and raw rows</summary>
                <pre className="mismatch-detail">{definition.cypher}</pre>
                {rows.length > 0 && <RawTable rows={rows} columns={Object.keys(rows[0])} />}
            </details>
        </div>
    );
}

function TechnicalFootnote({
    store,
    results,
}: {
    store: CasebookStore;
    results: Record<string, OperationRunResult>;
}) {
    const notApplicable = Object.entries(store.bundle.nativeOperations.not_applicable ?? {});

    return (
        <details className="tech-footnote">
            <summary>Technical details — how these findings were checked</summary>
            <p>
                The native operations below are checked against the same claim/evidence data this page
                ships with: where a native operation has a browser implementation, it is recomputed and
                checked row-for-row against a result recorded from the production graph. A technical block
                identifies any operation carried as a recorded result only. Curated editorial observations
                in the findings list are supplied as recorded bundle content and are not recomputed in this
                browser. The full method, underlying data, and recomputation code are in the public
                repository:{" "}
                <a href={REPO_URL} target="_blank" rel="noopener">
                    {REPO_URL}
                </a>
                .
            </p>
            {store.bundle.nativeOperations.operations.map((definition) => (
                <TechOperationBlock key={definition.name} store={store} definition={definition} result={results[definition.name]} />
            ))}
            {notApplicable.map(([name, entry]) => (
                <div key={name} className="tech-operation-block">
                    <h4>{humanizeOperationName(name)}</h4>
                    <p className="muted">not applicable — {entry.reason_en ?? "see the repository for details"}</p>
                </div>
            ))}
        </details>
    );
}
