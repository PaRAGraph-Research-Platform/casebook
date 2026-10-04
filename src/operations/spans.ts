import type { ContextSegment } from "../types/bundle";

export interface QuoteSpan {
    start: number;
    end: number;
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, " ").trim();
}

/**
 * Recovers the character span (within a chunk) that a claim's stored quote
 * actually covers, by finding the minimal contiguous run of context segments
 * whose space-joined text reconstructs the quote exactly.
 *
 * The bundle does not expose Evidence.start_char/end_char directly (those
 * are native Neo4j fields not re-exported here); this reconstructs them from
 * the curated context segments, which do carry per-segment offsets. Segments
 * are display context and often wider than the actual quoted evidence — this
 * finds the tightest matching sub-range, not the full segment list.
 */
export function findQuoteSpan(
    quote: string | undefined,
    segments: ContextSegment[] | undefined
): QuoteSpan | null {
    if (!quote || !segments || segments.length === 0) {
        return null;
    }

    const target = normalizeWhitespace(quote);
    const ordered = [...segments].sort((a, b) => a.segment_order - b.segment_order);

    for (let i = 0; i < ordered.length; i += 1) {
        let joined = "";
        for (let j = i; j < ordered.length; j += 1) {
            const piece = normalizeWhitespace(ordered[j].text);
            joined = joined ? `${joined} ${piece}` : piece;
            if (joined === target) {
                return { start: ordered[i].start_char, end: ordered[j].end_char };
            }
            if (joined.length > target.length + 5) {
                break;
            }
        }
    }

    return null;
}
