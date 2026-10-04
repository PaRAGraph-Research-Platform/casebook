import { observer } from "mobx-react-lite";
import { useState } from "react";
import type { AnnotationRecord } from "../types/bundle";
import type { CasebookStore } from "../stores/CasebookStore";
import { printedPageLabel, roleLabel, sourceShortLabel } from "../utils/labels";

interface AnchorIndexProps {
    store: CasebookStore;
}

const QUOTE_TRUNCATE_LENGTH = 240;

/** Printed page when the bundle has one; otherwise the physical page plus
 * an explicit "no printed pagination" note (matching the wording the
 * bundle's own CASE_EN.md anchor table uses for unpaginated sources). */
function locatorLabel(annotation: AnnotationRecord): string {
    const printed = printedPageLabel(annotation);
    if (printed !== "—") return `printed ${printed}`;
    const physical = annotation.physical_page ?? annotation.physical_page_start;
    return physical ? `phys ${physical} / no printed pagination` : "no printed pagination";
}

/**
 * Reader-facing replacement for CASE_EN.md's `## Anchor index` markdown
 * table (see `splitAnchorIndexSection`): the same anchors, in bundle order
 * (core.json then supplement.json), but resolved to their content — role,
 * source, locator, quote — instead of raw claim/evidence ids. Anchor
 * badges reuse the `anchor-link`/`data-anchor` contract CaseView's click
 * delegation already understands, so they select the claim the same way an
 * in-text anchor does. Technical identifiers stay in a collapsed
 * accordion, consistent with the rest of the viewer.
 */
export const AnchorIndex = observer(function AnchorIndex({ store }: AnchorIndexProps) {
    const [expandedAnchors, setExpandedAnchors] = useState<Set<string>>(new Set());

    const claims = store.combinedClaims;
    if (claims.length === 0) {
        return null;
    }

    const toggleExpanded = (anchor: string) => {
        setExpandedAnchors((previous) => {
            const next = new Set(previous);
            if (next.has(anchor)) {
                next.delete(anchor);
            } else {
                next.add(anchor);
            }
            return next;
        });
    };

    return (
        <div className="anchor-index">
            <h2>Anchor index</h2>
            <div className="table-scroll">
            <table className="operation-table anchor-index-table">
                <thead>
                    <tr>
                        <th>Anchor</th>
                        <th>Position / role</th>
                        <th>Source</th>
                        <th>Locator</th>
                        <th>Quote</th>
                    </tr>
                </thead>
                <tbody>
                    {claims.map(({ native, annotation }) => {
                        const source = store.sourceById.get(native.document_id);
                        const quote = native.quote ?? "";
                        const isLong = quote.length > QUOTE_TRUNCATE_LENGTH;
                        const isExpanded = expandedAnchors.has(annotation.anchor);
                        const displayQuote = isLong && !isExpanded ? `${quote.slice(0, QUOTE_TRUNCATE_LENGTH)}…` : quote;

                        return (
                            <tr key={annotation.anchor}>
                                <td>
                                    <button type="button" className="anchor-link" data-anchor={annotation.anchor}>
                                        {annotation.anchor}
                                    </button>
                                </td>
                                <td>{roleLabel(annotation)}</td>
                                <td>{source ? sourceShortLabel(source) : "—"}</td>
                                <td>{locatorLabel(annotation)}</td>
                                <td className="quote anchor-index-quote">
                                    {displayQuote || "—"}
                                    {isLong && (
                                        <button
                                            type="button"
                                            className="quote-toggle"
                                            onClick={() => toggleExpanded(annotation.anchor)}
                                        >
                                            {isExpanded ? "show less" : "show full quote"}
                                        </button>
                                    )}
                                    {typeof annotation.verifier_note_en === "string" && annotation.verifier_note_en && (
                                        <div className="verifier-note verifier-note-inline">
                                            <strong>Verifier note</strong> {annotation.verifier_note_en}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            </div>

            <details className="technical-ids-accordion anchor-index-technical">
                <summary>Technical identifiers</summary>
                <div className="table-scroll">
                <table className="operation-table">
                    <thead>
                        <tr>
                            <th>Anchor</th>
                            <th>Claim ID</th>
                            <th>Evidence ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {claims.map(({ native, annotation }) => (
                            <tr key={annotation.anchor}>
                                <td>{annotation.anchor}</td>
                                <td>
                                    <code>{native.claim_id}</code>
                                </td>
                                <td>
                                    <code>{native.evidence_id}</code>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </details>
        </div>
    );
});
