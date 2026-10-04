import { describe, expect, it } from "vitest";
import type { CoreRecord } from "../types/bundle";
import { buildCombinedClaims } from "./combinedClaims";

function minimalRecord(overrides: Partial<CoreRecord["native"]>, annotation: Partial<CoreRecord["annotation"]> = {}): CoreRecord {
    return {
        native: {
            claim_id: "claim_x",
            status: "auto_approved",
            locality: null,
            feature: "F",
            target: "T",
            target_relationship: "ABOUT_GROUP",
            value: "v",
            conditions: null,
            polarity: "attested",
            evidence_id: "ev_x",
            chunk_id: "chunk_x",
            document_id: "doc_x",
            quote: "the table fragment",
            ...overrides,
        },
        annotation: { origin_kind: "curated_annotation", anchor: "A1", ...annotation },
    };
}

describe("buildCombinedClaims — quote_trimmed span handling", () => {
    it("uses native start_char/end_char directly for a trimmed record, not a text reconstruction", () => {
        const record = minimalRecord(
            { start_char: 4, end_char: 23 },
            { quote_trimmed: true, quote_trim_note_en: "abridged quotation — see the source, p. 1" }
        );
        const [combined] = buildCombinedClaims([record], []);
        expect(combined.span).toEqual({ start: 4, end: 23 });
    });

    it("gives a trimmed record with no native start_char/end_char a null span, rather than guessing from the abridged context", () => {
        const record = minimalRecord({}, { quote_trimmed: true });
        const [combined] = buildCombinedClaims([record], []);
        expect(combined.span).toBeNull();
    });

    it("still reconstructs a span from context segments for an ordinary (non-trimmed) record with no native start_char/end_char", () => {
        const record = minimalRecord(
            { quote: "quoted text" },
            {
                context_segments: [
                    {
                        id: "seg1",
                        chunk_id: "chunk_x",
                        segment_order: 0,
                        segment_type: "sentence_fallback",
                        source_block_order: 0,
                        page: 1,
                        start_char: 0,
                        end_char: 11,
                        text: "quoted text",
                    },
                ],
            }
        );
        const [combined] = buildCombinedClaims([record], []);
        expect(combined.span).toEqual({ start: 0, end: 11 });
    });
});
