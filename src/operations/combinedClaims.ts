import type { AnnotationRecord, CoreRecord, NativeClaimFields, SupplementRecord } from "../types/bundle";
import { findQuoteSpan, type QuoteSpan } from "./spans";

export interface CombinedClaim {
    native: NativeClaimFields;
    annotation: AnnotationRecord;
    /** Recovered evidence span within native.chunk_id, or null when the
     * annotation's context segments describe a different (curated) chunk. */
    span: QuoteSpan | null;
}

/**
 * Merges core.json and supplement.json into one list of native-claim +
 * curated-annotation pairs, with an evidence span where one is available.
 *
 * Some bundles (C3) export `NativeClaimFields.start_char`/`end_char`
 * directly — that is the real Evidence node span, native data, and takes
 * priority over reconstruction. Others (C1, C2) don't re-export it, so the
 * span is recovered from the annotation's own curated context segments
 * instead (see spans.ts).
 *
 * Some supplement records deliberately get span=null: their
 * annotation.context_chunk_id points at another record's table (a curated
 * cross-reference), not at their own evidence chunk — so no native span can
 * be reconstructed for them, matching the bundle's documented distinction
 * between native and curated fields (C2's S4 is the canonical example).
 *
 * A record whose public quote was abridged for redistribution
 * (`annotation.quote_trimmed`, the upstream "trimmed_quotation" rule)
 * has had `native.quote`/`context_segments`
 * swapped for the shorter public projection before publication — but its
 * `start_char`/`end_char` are untouched (they are not text, so the
 * projection never rewrites them) and still describe the *original* evidence
 * span. Operations that compare spans across claims (e.g. the shared-basis/
 * independent-bases check) need that original span, not one reconstructed
 * from the shorter public quote — so a trimmed record with no native
 * start_char/end_char gets span=null rather than a reconstruction attempt
 * that could silently match the wrong stretch of the abridged context.
 */
export function buildCombinedClaims(
    core: CoreRecord[],
    supplement: SupplementRecord[]
): CombinedClaim[] {
    const records: CombinedClaim[] = [];

    for (const item of [...core, ...supplement]) {
        let span: QuoteSpan | null;
        if (typeof item.native.start_char === "number" && typeof item.native.end_char === "number") {
            span = { start: item.native.start_char, end: item.native.end_char };
        } else if (item.annotation.quote_trimmed) {
            span = null;
        } else {
            // context_chunk_id (when the bundle declares one explicitly) takes
            // priority: some supplement records intentionally point their
            // curated context at a different chunk than their own evidence.
            // Bundles that don't declare it (C1's core and supplement both,
            // C2's core) fall back to the first context segment's chunk.
            const contextChunkId =
                item.annotation.context_chunk_id ?? item.annotation.context_segments?.[0]?.chunk_id;
            const ownChunk = contextChunkId === item.native.chunk_id;
            span = ownChunk ? findQuoteSpan(item.native.quote, item.annotation.context_segments) : null;
        }
        records.push({ native: item.native, annotation: item.annotation, span });
    }

    return records;
}
