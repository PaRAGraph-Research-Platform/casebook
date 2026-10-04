// Parity test between this viewer's TS finding_vars executor
// (src/operations/findings.ts) and the reference implementation the
// bundle-build tooling verifies against itself
// (`findings_lib.py` in the platform's closed bundle-build tooling,
// see findings.ts's own module doc comment). Runs against every operation
// of every one of the four active bundles' own `expected` (production-
// verified) rows — not synthetic fixtures — so a drift between the two
// implementations, or a template/finding_vars mismatch introduced by a
// future bundle rebuild, shows up here before it reaches the page.
import { describe, expect, it } from "vitest";
import { loadC1Bundle, loadC2Bundle, loadC3Bundle, loadC4Bundle } from "../data/loadBundle";
import type { CasebookBundle, CoreRecord, SupplementRecord } from "../types/bundle";
import { computeFindingVars, rowsOf, tokenizeFinding } from "./findings";

/** Mirrors `build_anchor_lookup` in findings_lib.py: claim_id -> anchor,
 * built from a bundle's own core + supplement records. */
function buildAnchorLookup(bundle: CasebookBundle): Map<string, string> {
    const lookup = new Map<string, string>();
    for (const record of [...bundle.core, ...bundle.supplement] as Array<CoreRecord | SupplementRecord>) {
        lookup.set(record.native.claim_id, record.annotation.anchor);
    }
    return lookup;
}

const UNRESOLVED_PLACEHOLDER = /\{[a-zA-Z_]\w*\}/;

const BUNDLES: Array<[string, () => CasebookBundle]> = [
    ["c1", loadC1Bundle],
    ["c2", loadC2Bundle],
    ["c3", loadC3Bundle],
    ["c4", loadC4Bundle],
];

describe("finding_vars parity: every operation's finding_en/finding_empty_en renders with no unresolved placeholder", () => {
    for (const [label, load] of BUNDLES) {
        const bundle = load();
        const anchorLookup = buildAnchorLookup(bundle);
        const claimAnchor = (id: string) => anchorLookup.get(id) ?? id;

        for (const definition of bundle.nativeOperations.operations) {
            it(`${label} :: ${definition.name}`, () => {
                const rows = rowsOf(definition.expected);
                const template = rows.length === 0 ? definition.finding_empty_en : definition.finding_en;
                expect(
                    template,
                    `${label}/${definition.name} has no ${rows.length === 0 ? "finding_empty_en" : "finding_en"}`
                ).toBeTruthy();

                const resolved = computeFindingVars(definition.finding_vars, definition.expected, claimAnchor);
                const tokens = tokenizeFinding(template as string, resolved);
                const rendered = tokens.map((token) => token.text).join("");

                expect(rendered, `${label}/${definition.name} rendered: ${rendered}`).not.toMatch(
                    UNRESOLVED_PLACEHOLDER
                );
            });
        }
    }
});

describe("finding_vars parity: control values against the production-verified expected rows", () => {
    it("C4 records_by_value: xinyi_six = 15", () => {
        const bundle = loadC4Bundle();
        const definition = bundle.nativeOperations.operations.find((op) => op.name === "records_by_value")!;
        const claimAnchor = (id: string) => buildAnchorLookup(bundle).get(id) ?? id;
        const resolved = computeFindingVars(definition.finding_vars, definition.expected, claimAnchor);
        expect(resolved.xinyi_six.text).toBe("15");
    });

    it("C4 source_value_pairs: n_rows = 17, taishan_dict_records = 26", () => {
        const bundle = loadC4Bundle();
        const definition = bundle.nativeOperations.operations.find((op) => op.name === "source_value_pairs")!;
        const claimAnchor = (id: string) => buildAnchorLookup(bundle).get(id) ?? id;
        const resolved = computeFindingVars(definition.finding_vars, definition.expected, claimAnchor);
        expect(resolved.n_rows.text).toBe("17");
        expect(resolved.taishan_dict_records.text).toBe("26");
    });

    it("C2 shared_basis: n_rows = 2", () => {
        const bundle = loadC2Bundle();
        const definition = bundle.nativeOperations.operations.find((op) => op.name === "shared_basis")!;
        const claimAnchor = (id: string) => buildAnchorLookup(bundle).get(id) ?? id;
        const resolved = computeFindingVars(definition.finding_vars, definition.expected, claimAnchor);
        expect(resolved.n_rows.text).toBe("2");
    });

    it("C1 contested_cell: zero expected rows, so the empty-case wording is what a reader sees", () => {
        const bundle = loadC1Bundle();
        const definition = bundle.nativeOperations.operations.find((op) => op.name === "contested_cell")!;
        const rows = rowsOf(definition.expected);
        expect(rows).toHaveLength(0);
        expect(definition.finding_empty_en).toBeTruthy();
    });
});
