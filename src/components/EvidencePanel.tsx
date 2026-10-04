import { Fragment } from "react";
import { observer } from "mobx-react-lite";
import type { CasebookStore } from "../stores/CasebookStore";
import type { ContextSegment } from "../types/bundle";
import {
    annotationProvenanceHint,
    authorUnitDisplay,
    authorUnitShortDisplay,
    basisReviewClassLabel,
    featureShortLabel,
    localityLabel,
    nativePageLabel,
    originKindLabel,
    originMethodLabel,
    polarityLabel,
    printedPageLabel,
    reviewStatusLabel,
    roleLabel,
    sourceAuthorsDisplay,
    sourceRightsLabel,
    sourceShortLabel,
    sourceYear,
    targetLabel,
} from "../utils/labels";

/** Renders a claim's full curated context, with the segments that make up
 * its own quote span highlighted — the same span `combinedClaims.ts`
 * already recovers (native start_char/end_char for C4, or a reconstructed
 * span for bundles that only carry context segments). A segment counts as
 * "part of the quote" when its own range overlaps the claim's span at all;
 * this highlights whole segments, not a sub-segment character range. */
function FullPassageContext({
    segments,
    span,
}: {
    segments: ContextSegment[];
    span: { start: number; end: number } | null;
}) {
    const ordered = [...segments].sort((a, b) => a.segment_order - b.segment_order);
    return (
        <div className="full-passage-context">
            {ordered.map((segment) => {
                const isQuoted =
                    span !== null && segment.start_char < span.end && span.start < segment.end_char;
                return (
                    <p key={segment.id} className={isQuoted ? "context-segment context-segment-quoted" : "context-segment"}>
                        {segment.text}
                    </p>
                );
            })}
        </div>
    );
}

interface EvidencePanelProps {
    store: CasebookStore;
}

export const EvidencePanel = observer(function EvidencePanel({ store }: EvidencePanelProps) {
    const claim = store.selectedClaim;
    const source = store.selectedSource;

    if (!claim) {
        return (
            <aside className="evidence-panel">
                <h2>Evidence &amp; sources</h2>
                <div className="evidence-panel-empty" aria-hidden="false">
                    <span className="evidence-panel-empty-glyph" aria-hidden="true">
                        ⌗
                    </span>
                    <p className="muted">Select a claim in the Case, Explore, or Operations tab to inspect it here.</p>
                </div>
            </aside>
        );
    }

    const { native, annotation } = claim;
    const contextSegments = annotation.context_segments ?? native.context_segments;
    const nativePage = nativePageLabel(native);

    return (
        <aside className="evidence-panel">
            <h2>Evidence &amp; sources</h2>
            <div className="evidence-anchor">{annotation.anchor}</div>

            <section>
                <blockquote className="quote evidence-main-quote">{native.quote}</blockquote>
                {annotation.quote_trimmed && (
                    <p className="muted quote-abridged-note" title={annotation.quote_trim_note_en}>
                        abridged quotation
                        {nativePage !== "—" ? ` — see the source, p. ${nativePage}` : ""}
                    </p>
                )}
                {typeof annotation.verifier_note_en === "string" && annotation.verifier_note_en && (
                    <div className="verifier-note">
                        <h4>Verifier note</h4>
                        <p>{annotation.verifier_note_en}</p>
                    </div>
                )}
                {contextSegments && contextSegments.length > 0 && (
                    <details className="full-passage-context-accordion">
                        <summary>Full passage context</summary>
                        <FullPassageContext segments={contextSegments} span={claim.span} />
                    </details>
                )}
            </section>

            <section>
                <h3>What is stated</h3>
                <dl>
                    <dt>Feature</dt>
                    <dd>{featureShortLabel(native.feature)}</dd>
                    <dt>Value</dt>
                    <dd>{native.value}</dd>
                    <dt>Polarity</dt>
                    <dd>{polarityLabel(native.polarity)}</dd>
                    <dt>Target</dt>
                    <dd>{targetLabel(native.target)}</dd>
                    {native.locality && (
                        <>
                            <dt>Locality</dt>
                            <dd>{localityLabel(native.locality)}</dd>
                        </>
                    )}
                </dl>
            </section>

            <section>
                <h3>Source &amp; page</h3>
                {source ? (
                    <dl>
                        <dt>Title</dt>
                        <dd>{sourceShortLabel(source)}</dd>
                        <dt>Authors</dt>
                        <dd>{sourceAuthorsDisplay(source)}</dd>
                        <dt>Year</dt>
                        <dd>{sourceYear(source) ?? "—"}</dd>
                        <dt>Page</dt>
                        <dd>{nativePage !== "—" ? nativePage : printedPageLabel(annotation)}</dd>
                        <dt>Rights</dt>
                        <dd>{sourceRightsLabel(source.annotation.rights)}</dd>
                    </dl>
                ) : (
                    <p className="muted">No source record for this claim's document in this bundle.</p>
                )}
            </section>

            {annotation.pair_id && (
                <section>
                    <h3>Pair &amp; basis review</h3>
                    <span className="origin-badge curated">Editorial note</span>
                    <dl>
                        <dt>Pair</dt>
                        <dd>{annotation.pair_id}</dd>
                        {annotation.basis_review_class && (
                            <>
                                <dt>Basis review</dt>
                                <dd>{basisReviewClassLabel(annotation.basis_review_class)}</dd>
                            </>
                        )}
                    </dl>
                </section>
            )}

            <section>
                <h3>Editorial notes</h3>
                <p className="section-hint">{annotationProvenanceHint(annotation.origin_method)}</p>
                <span className="origin-badge curated">
                    {annotation.origin_method ? originMethodLabel(annotation.origin_method) : originKindLabel(annotation.origin_kind)}
                </span>
                {annotation.review_status && (
                    <span className={`review-badge ${annotation.review_status}`}>
                        {reviewStatusLabel(annotation.review_status)}
                    </span>
                )}
                <dl>
                    <dt>Role</dt>
                    <dd>{roleLabel(annotation)}</dd>
                    {annotation.scope_note && (
                        <>
                            <dt>Scope note</dt>
                            <dd>{annotation.scope_note}</dd>
                        </>
                    )}
                    {annotation.author_unit && (
                        <>
                            <dt>Unit as named by the author</dt>
                            <dd>{authorUnitDisplay(annotation.author_unit)}</dd>
                        </>
                    )}
                    {!annotation.author_unit && (annotation.author_units ?? []).length > 0 && (
                        <>
                            <dt>Units as named by the author</dt>
                            <dd>
                                <ul className="author-units-list">
                                    {(annotation.author_units ?? []).map((unit, index) => (
                                        <li key={index}>{authorUnitShortDisplay(unit)}</li>
                                    ))}
                                </ul>
                            </dd>
                        </>
                    )}
                </dl>
            </section>

            <details className="technical-ids-accordion">
                <summary>Technical details (ids)</summary>
                <dl>
                    <dt>Status</dt>
                    <dd>{native.status}</dd>
                    <dt>Claim ID</dt>
                    <dd>
                        <code>{native.claim_id}</code>
                    </dd>
                    <dt>Evidence ID</dt>
                    <dd>
                        <code>{native.evidence_id}</code>
                    </dd>
                    <dt>Chunk ID</dt>
                    <dd>
                        <code>{native.chunk_id}</code>
                    </dd>
                    <dt>Document ID</dt>
                    <dd>
                        <code>{native.document_id}</code>
                    </dd>
                    {(annotation.author_unit ? [annotation.author_unit] : (annotation.author_units ?? []))
                        .filter((unit) => unit.scheme_record)
                        .map((unit, index) => (
                            <Fragment key={index}>
                                <dt>Author unit scheme record</dt>
                                <dd>
                                    <code>{unit.scheme_record}</code>
                                </dd>
                            </Fragment>
                        ))}
                </dl>
            </details>
        </aside>
    );
});
