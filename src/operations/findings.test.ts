import { describe, expect, it, vi } from "vitest";
import { computeFindingVar, computeFindingVars, rowsOf, tokenizeFinding } from "./findings";

/** Fixture rows shaped like a real operation's `expected` array — enough
 * columns to exercise every finding_vars op this executor supports (mirrors
 * findings_lib.py's own contract, see that module's docstring). */
const ROWS: Array<Record<string, unknown>> = [
    { claim_id: "claim_a1", feature: "F1", claims: 3, row_class: "shared" },
    { claim_id: "claim_a2", feature: "F1", claims: 5, row_class: "unique_a" },
    { claim_id: "claim_a3", feature: "F2", claims: 2, row_class: "shared" },
];

const claimAnchor = (id: string): string =>
    ({ claim_a1: "A1", claim_a2: "A2", claim_a3: "A3" })[id] ?? id;

describe("rowsOf", () => {
    it("returns an array expected value unchanged", () => {
        expect(rowsOf(ROWS)).toBe(ROWS);
    });

    it("wraps a single totals object (C4's independent_bases / distinct_textual_bases shape) in a one-element array", () => {
        const totals = { components_merged_by_shared_basis: 4, distinct_textual_bases: 12 };
        expect(rowsOf(totals)).toEqual([totals]);
    });

    it("returns an empty array for null/undefined", () => {
        expect(rowsOf(null)).toEqual([]);
        expect(rowsOf(undefined)).toEqual([]);
    });
});

describe("computeFindingVar", () => {
    it("count_rows returns the total row count with no where clause", () => {
        expect(computeFindingVar({ op: "count_rows" }, ROWS, claimAnchor)).toEqual({ text: "3" });
        expect(computeFindingVar({ op: "count_rows" }, [], claimAnchor)).toEqual({ text: "0" });
    });

    it("count_rows filters by a single where clause", () => {
        expect(
            computeFindingVar({ op: "count_rows", where: { column: "row_class", equals: "shared" } }, ROWS, claimAnchor)
        ).toEqual({ text: "2" });
    });

    it("count_rows filters by a list of where clauses (AND)", () => {
        const rows = [
            { idiom_tag: "XINYI", value: "6" },
            { idiom_tag: "XINYI", value: "7" },
            { idiom_tag: "TAISHAN", value: "6" },
        ];
        const result = computeFindingVar(
            {
                op: "count_rows",
                where: [
                    { column: "idiom_tag", equals: "XINYI" },
                    { column: "value", equals: "6" },
                ],
            },
            rows,
            claimAnchor
        );
        expect(result).toEqual({ text: "1" });
    });

    it("sum adds a numeric column across rows matching an optional where", () => {
        expect(computeFindingVar({ op: "sum", column: "claims" }, ROWS, claimAnchor)).toEqual({ text: "10" });
        expect(
            computeFindingVar(
                { op: "sum", column: "claims", where: { column: "row_class", equals: "shared" } },
                ROWS,
                claimAnchor
            )
        ).toEqual({ text: "5" });
    });

    it("sum ignores non-numeric/missing values rather than producing NaN", () => {
        const rows = [{ claims: 2 }, { claims: "not a number" }, {}];
        expect(computeFindingVar({ op: "sum", column: "claims" }, rows, claimAnchor)).toEqual({ text: "2" });
    });

    it("distinct counts unique values of a column", () => {
        expect(computeFindingVar({ op: "distinct", column: "feature" }, ROWS, claimAnchor)).toEqual({ text: "2" });
    });

    it("distinct treats null/undefined as absent, not as a value of its own", () => {
        const rows = [{ feature: "F1" }, { feature: null }, { feature: undefined }, { feature: "F1" }];
        expect(computeFindingVar({ op: "distinct", column: "feature" }, rows, claimAnchor)).toEqual({ text: "1" });
    });

    it("list_len returns the length of a list column in the first matching row", () => {
        const rows = [{ idiom_tag: "XINYI", values: ["6", "7", "8"] }, { idiom_tag: "TAISHAN", values: ["6"] }];
        const result = computeFindingVar(
            { op: "list_len", column: "values", where: { column: "idiom_tag", equals: "XINYI" } },
            rows,
            claimAnchor
        );
        expect(result).toEqual({ text: "3" });
    });

    it("list_len returns 0 when no row matches, or the column isn't a list", () => {
        expect(
            computeFindingVar(
                { op: "list_len", column: "values", where: { column: "idiom_tag", equals: "NOWHERE" } },
                [{ idiom_tag: "XINYI", values: ["6"] }],
                claimAnchor
            )
        ).toEqual({ text: "0" });
        expect(computeFindingVar({ op: "list_len", column: "values" }, [{ values: "not a list" }], claimAnchor)).toEqual({
            text: "0",
        });
    });

    it("anchors_of resolves claim ids from a single column, one group per row", () => {
        const result = computeFindingVar({ op: "anchors_of", columns: ["claim_id"] }, ROWS, claimAnchor);
        expect(result.text).toBe("A1/A2/A3");
        expect(result.anchorGroups).toEqual([["A1"], ["A2"], ["A3"]]);
    });

    it("anchors_of groups a pair's two columns into one chip-group per row (shared_basis shape)", () => {
        const rows = [
            { claim_a: "claim_a1", claim_b: "claim_a2" },
            { claim_a: "claim_a2", claim_b: "claim_a3" },
        ];
        const result = computeFindingVar({ op: "anchors_of", columns: ["claim_a", "claim_b"] }, rows, claimAnchor);
        expect(result.anchorGroups).toEqual([
            ["A1", "A2"],
            ["A2", "A3"],
        ]);
        // The flat text is still the sorted/deduplicated "/"-joined list, matching findings_lib.py's own format.
        expect(result.text).toBe("A1/A2/A3");
    });

    it("anchors_of reads a claim-id array column as one group per row", () => {
        const rows = [{ claim_ids: ["claim_a1", "claim_a3"] }];
        const result = computeFindingVar({ op: "anchors_of", columns: ["claim_ids"] }, rows, claimAnchor);
        expect(result.anchorGroups).toEqual([["A1", "A3"]]);
    });

    it("anchors_of returns the em-dash fallback text when no row resolves to an anchor", () => {
        const result = computeFindingVar({ op: "anchors_of", columns: ["claim_id"] }, [], claimAnchor);
        expect(result.text).toBe("—");
        expect(result.anchorGroups).toEqual([]);
    });

    it("logs and falls back to an empty string for an op this executor doesn't recognize", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // @ts-expect-error exercising the runtime fallback for a future/unknown op
        expect(computeFindingVar({ op: "unknown_op" }, ROWS, claimAnchor)).toEqual({ text: "" });
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe("computeFindingVars", () => {
    it("always provides n_rows, computed from expected via rowsOf", () => {
        expect(computeFindingVars(undefined, ROWS, claimAnchor).n_rows.text).toBe("3");
        const totals = { distinct_textual_bases: 12 };
        expect(computeFindingVars({ x: { op: "sum", column: "distinct_textual_bases" } }, totals, claimAnchor)).toEqual({
            n_rows: { text: "1" },
            x: { text: "12" },
        });
    });

    it("computes every named var declared in finding_vars", () => {
        const result = computeFindingVars(
            {
                shared_count: { op: "count_rows", where: { column: "row_class", equals: "shared" } },
                total_claims: { op: "sum", column: "claims" },
            },
            ROWS,
            claimAnchor
        );
        expect(result.shared_count.text).toBe("2");
        expect(result.total_claims.text).toBe("10");
    });

    it("does not throw and logs a fallback when a var recipe errors out", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const throwingSpecs = {
            broken: {
                op: "distinct" as const,
                get column(): string {
                    throw new Error("boom");
                },
            },
        };
        const result = computeFindingVars(throwingSpecs, ROWS, claimAnchor);
        expect(result.broken.text).toBe("{broken}");
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
    });
});

describe("tokenizeFinding", () => {
    it("splits plain text and resolved placeholders in order", () => {
        const resolved = computeFindingVars({ shared: { op: "count_rows" } }, ROWS, claimAnchor);
        const tokens = tokenizeFinding("Found {n_rows} rows, {shared} of them shared.", resolved);
        expect(tokens).toEqual([
            { type: "text", text: "Found " },
            { type: "var", text: "3" },
            { type: "text", text: " rows, " },
            { type: "var", text: "3" },
            { type: "text", text: " of them shared." },
        ]);
    });

    it("carries anchorGroups through so the caller can render grouped chips", () => {
        const resolved = computeFindingVars(
            { anchors: { op: "anchors_of", columns: ["claim_a", "claim_b"] } },
            [{ claim_a: "claim_a1", claim_b: "claim_a2" }],
            claimAnchor
        );
        const tokens = tokenizeFinding("See {anchors}.", resolved);
        const varToken = tokens.find((t) => t.type === "var");
        expect(varToken?.anchorGroups).toEqual([["A1", "A2"]]);
    });

    it("shows the fallback literal and logs an error for an unresolved placeholder, instead of failing silently", () => {
        const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        const resolved = computeFindingVars(undefined, ROWS, claimAnchor);
        const tokens = tokenizeFinding("Missing {nonexistent_var} here.", resolved);
        expect(tokens).toContainEqual({ type: "text", text: "{nonexistent_var}" });
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("nonexistent_var"));
        errorSpy.mockRestore();
    });

    it("returns the template unchanged (as one text token) when it has no placeholders", () => {
        const resolved = computeFindingVars(undefined, ROWS, claimAnchor);
        expect(tokenizeFinding("No placeholders here.", resolved)).toEqual([
            { type: "text", text: "No placeholders here." },
        ]);
    });
});
