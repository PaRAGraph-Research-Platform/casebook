import { describe, expect, it } from "vitest";
import { loadC1Bundle, loadC2Bundle, loadC3Bundle, loadC4Bundle } from "../data/loadBundle";
import type { CombinedClaim } from "./combinedClaims";
import { buildCombinedClaims } from "./combinedClaims";
import { computeIndependentBasesSliceTotals, computeSharedBasis, runNativeOperations } from "./nativeOperations";

/** Minimal synthetic CombinedClaim, carrying only the fields
 * computeSharedBasis/computeIndependentBasesSliceTotals actually read
 * (evidence_id, chunk_id, document_id, claim_id, span) — everything else is
 * an arbitrary placeholder, matching the same shape convention loadBundle's
 * real records use. */
function makeClaim(params: {
    claimId: string;
    evidenceId: string;
    chunkId: string;
    documentId?: string;
    span: { start: number; end: number } | null;
}): CombinedClaim {
    return {
        native: {
            claim_id: params.claimId,
            status: "accepted",
            locality: null,
            feature: "TEST_FEATURE",
            target: "TEST_TARGET",
            target_relationship: "ABOUT_GROUP",
            value: "test",
            conditions: null,
            polarity: "attested",
            evidence_id: params.evidenceId,
            chunk_id: params.chunkId,
            document_id: params.documentId ?? "doc_1",
        },
        annotation: { origin_kind: "native_export", anchor: params.claimId },
        span: params.span,
    };
}

describe("runNativeOperations (C2)", () => {
    const bundle = loadC2Bundle();
    const claims = buildCombinedClaims(bundle.core, bundle.supplement);
    const results = runNativeOperations(bundle, claims);

    it("recomputes all six native operations and matches the production-verified rows", () => {
        const nativeResults = results.filter((r) => r.status === "native");
        expect(nativeResults).toHaveLength(6);
        for (const result of nativeResults) {
            expect(result.recomputed).toBe(true);
            expect(result.matchesExpected, `${result.name}: ${result.mismatchDetail}`).toBe(true);
        }
    });

    it("reports exact row counts recorded in the bundle for each native operation", () => {
        const byName = Object.fromEntries(results.map((r) => [r.name, r]));
        expect(byName.shared_basis.computedRows).toHaveLength(2);
        expect(byName.independent_bases.computedRows).toHaveLength(5);
        expect(byName.source_split.computedRows).toHaveLength(6);
        expect(byName.source_comparison_by_feature.computedRows).toHaveLength(5);
        expect(byName.contested_cell.computedRows).toHaveLength(1);
        expect(byName.polarity_value_consistency.computedRows).toHaveLength(9);
    });

    it("recovers the exact evidence spans for the shared_basis pairs (K4/K5 overlap, S1/S2 identical evidence)", () => {
        const sharedBasis = results.find((r) => r.name === "shared_basis");
        expect(sharedBasis).toBeDefined();
        expect(sharedBasis?.computedRows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    claim_a: "claim_299220d48644a5a06aef162b",
                    claim_b: "claim_b891599fbeaa737b8620cf07",
                    relation: "overlapping_span",
                    a_start: 1186,
                    a_end: 1691,
                    b_start: 1381,
                    b_end: 1691,
                }),
                expect.objectContaining({
                    claim_a: "claim_515c2e546a092b12e4589fdc",
                    claim_b: "claim_7506816eea9d37ca0ee8841a",
                    relation: "same_evidence",
                }),
            ])
        );
    });

    it("marks independent_bases slice totals as matching the bundle (7 independent textual bases after merge)", () => {
        const independentBases = results.find((r) => r.name === "independent_bases");
        expect(independentBases?.sliceTotals).toEqual(
            expect.objectContaining({
                claims: 9,
                evidence_nodes: 8,
                chunks: 6,
                sources: 2,
                independent_textual_bases_after_shared_basis_merge: 7,
            })
        );
    });

    it("shows feature_level_split as a partially_native control result, not an independent recomputation", () => {
        const featureLevelSplit = results.find((r) => r.name === "feature_level_split");
        expect(featureLevelSplit?.status).toBe("partially_native");
        expect(featureLevelSplit?.recomputed).toBe(false);
        expect(featureLevelSplit?.expectedRows).toHaveLength(15);
    });

    it("does NOT falsely report a match when a claim's evidence_id is corrupted (detects broken data/logic)", () => {
        const corruptedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_515c2e546a092b12e4589fdc"
                ? { ...claim, native: { ...claim.native, evidence_id: "ev_corrupted_for_test" } }
                : claim
        );

        const corruptedResults = runNativeOperations(bundle, corruptedClaims);
        const sharedBasis = corruptedResults.find((r) => r.name === "shared_basis");

        // Corrupting S1's evidence_id breaks the same_evidence pairing with S2,
        // so the recomputed shared_basis result must diverge from the
        // production-verified expected rows.
        expect(sharedBasis?.matchesExpected).toBe(false);
    });
});

describe("runNativeOperations (C1)", () => {
    const bundle = loadC1Bundle();
    const claims = buildCombinedClaims(bundle.core, bundle.supplement);
    const results = runNativeOperations(bundle, claims);

    it("recomputes all eight operations (source_comparison_by_feature included, scoped to its selected pair) and matches production", () => {
        expect(results).toHaveLength(8);
        for (const result of results) {
            expect(result.recomputed, `${result.name} was not recomputed`).toBe(true);
            expect(result.matchesExpected, `${result.name}: ${result.mismatchDetail}`).toBe(true);
        }
    });

    it("reports exact row counts recorded in the bundle for each native operation", () => {
        const byName = Object.fromEntries(results.map((r) => [r.name, r]));
        expect(byName.shared_basis.computedRows).toHaveLength(1);
        expect(byName.independent_bases.computedRows).toHaveLength(2);
        expect(byName.source_split.computedRows).toHaveLength(8);
        expect(byName.source_comparison_by_feature.computedRows).toHaveLength(2);
        expect(byName.contested_cell.computedRows).toHaveLength(0);
        expect(byName.polarity_value_consistency.computedRows).toHaveLength(14);
        expect(byName.source_filter.computedRows).toHaveLength(14);
        expect(byName.target_comparison_by_feature.computedRows).toHaveLength(2);
    });

    it("recovers the shared_basis pair (S4/S5 sharing one Evidence node over the same passage)", () => {
        const sharedBasis = results.find((r) => r.name === "shared_basis");
        expect(sharedBasis?.computedRows).toEqual([
            expect.objectContaining({
                claim_a: "claim_022833074dd15cd7808893e7",
                claim_b: "claim_c1754227eae26797a003f693",
                relation: "same_evidence",
            }),
        ]);
    });

    it("has no not_applicable operation recomputed (feature_level_split is recorded as not_applicable, outside the operations array)", () => {
        expect(results.some((r) => r.name === "feature_level_split")).toBe(false);
        expect(bundle.nativeOperations.not_applicable?.feature_level_split.status).toBe("not_applicable");
    });

    it("computes independent_bases slice totals as the connected-components count (13 distinct evidence, its one shared_basis pair is same_evidence so it adds no edge — all 13 stay independent)", () => {
        const independentBases = results.find((r) => r.name === "independent_bases");
        expect(independentBases?.sliceTotals).toEqual(
            expect.objectContaining({
                claims: 14,
                evidence_nodes: 13,
                independent_textual_bases_after_shared_basis_merge: 13,
            })
        );
    });

    it("does NOT falsely report a match when a claim's target is corrupted (detects broken data/logic in target_comparison_by_feature)", () => {
        const corruptedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_6b54aa03df9869457d6b0be1"
                ? { ...claim, native: { ...claim.native, target: "YUE_WUHUA" } }
                : claim
        );

        const corruptedResults = runNativeOperations(bundle, corruptedClaims);
        const targetComparison = corruptedResults.find((r) => r.name === "target_comparison_by_feature");

        expect(targetComparison?.matchesExpected).toBe(false);
    });
});

describe("runNativeOperations (C3)", () => {
    const bundle = loadC3Bundle();
    const claims = buildCombinedClaims(bundle.core, bundle.supplement);
    const results = runNativeOperations(bundle, claims);

    it("recomputes all eleven operations (address_level_by_source and three target_comparison_by_feature pairs included) and matches production", () => {
        expect(results).toHaveLength(11);
        for (const result of results) {
            expect(result.recomputed, `${result.name} was not recomputed`).toBe(true);
            expect(result.matchesExpected, `${result.name}: ${result.mismatchDetail}`).toBe(true);
        }
    });

    it("reports exact row counts recorded in the bundle for each native operation", () => {
        const byName = Object.fromEntries(results.map((r) => [r.name, r]));
        expect(byName.shared_basis.computedRows).toHaveLength(3);
        expect(byName.independent_bases.computedRows).toHaveLength(4);
        expect(byName.source_split.computedRows).toHaveLength(10);
        expect(byName.source_filter.computedRows).toHaveLength(21);
        expect(byName.address_level_by_source.computedRows).toHaveLength(7);
        expect(byName.source_comparison_by_feature.computedRows).toHaveLength(4);
        expect(byName.target_comparison_by_feature__siyi_gaoyang.computedRows).toHaveLength(4);
        expect(byName.target_comparison_by_feature__siyi_guangfu.computedRows).toHaveLength(4);
        expect(byName.target_comparison_by_feature__gaoyang_guangfu.computedRows).toHaveLength(4);
        expect(byName.polarity_value_consistency.computedRows).toHaveLength(21);
    });

    it("computes independent_bases slice totals as the connected-components count (21 distinct evidence; a 3-node overlap chain plus a separate overlapping pair merge to 18, matching the naive evidence-minus-pairs count exactly because neither overlap group closes a cycle)", () => {
        const independentBases = results.find((r) => r.name === "independent_bases");
        expect(independentBases?.sliceTotals).toEqual(
            expect.objectContaining({
                claims: 21,
                evidence_nodes: 21,
                independent_textual_bases_after_shared_basis_merge: 18,
            })
        );
    });

    it("gives contested_cell exactly zero rows, matching production (no attested/not_attested split for any target+feature cell in this slice)", () => {
        const contestedCell = results.find((r) => r.name === "contested_cell");
        expect(contestedCell?.computedRows).toHaveLength(0);
        expect(contestedCell?.expectedRows).toHaveLength(0);
        expect(contestedCell?.recomputed).toBe(true);
        expect(contestedCell?.matchesExpected).toBe(true);
    });

    it("computes address_level_by_source grouping claims by document and target_relationship (group vs. subgroup address)", () => {
        const addressLevel = results.find((r) => r.name === "address_level_by_source");
        expect(addressLevel?.computedRows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    document_id: "69af2bca-a58d-4342-8ec7-f78715b77e25",
                }),
            ])
        );
    });

    it("has no not_applicable operation recomputed (feature_level_split is recorded as not_applicable, outside the operations array)", () => {
        expect(results.some((r) => r.name === "feature_level_split")).toBe(false);
        expect(bundle.nativeOperations.not_applicable?.feature_level_split.status).toBe("not_applicable");
    });

    it("does NOT falsely report a match when a claim's target is corrupted (detects broken data/logic in target_comparison_by_feature)", () => {
        const corruptedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_cfd92b2d77712342e18c6b94"
                ? { ...claim, native: { ...claim.native, target: "YUE_SIYI" } }
                : claim
        );

        const corruptedResults = runNativeOperations(bundle, corruptedClaims);
        const targetComparison = corruptedResults.find(
            (r) => r.name === "target_comparison_by_feature__siyi_gaoyang"
        );

        expect(targetComparison?.matchesExpected).toBe(false);
    });

    it("does NOT falsely report a match when address_level_by_source's source data is corrupted (detects broken data/logic)", () => {
        const corruptedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_39ec5fd17ce8736f5973a464"
                ? { ...claim, native: { ...claim.native, target_relationship: "corrupted_relationship" } }
                : claim
        );

        const corruptedResults = runNativeOperations(bundle, corruptedClaims);
        const addressLevel = corruptedResults.find((r) => r.name === "address_level_by_source");

        expect(addressLevel?.matchesExpected).toBe(false);
    });
});

describe("runNativeOperations (C4)", () => {
    const bundle = loadC4Bundle();
    // C4's native-operation scope (a fixed 65-claim curator handoff) is
    // narrower than every claim `buildCombinedClaims` returns: supplement.json
    // also carries 32 GS/TS passport-linkage records the Passport tab needs,
    // outside that handoff (see CasebookStore.nativeOperationResults' own
    // doc comment). Scoping here mirrors what the real store does, so this
    // test exercises the same claim set the app actually recomputes from.
    const scopeIds = new Set(bundle.nativeOperations.scope.claim_ids);
    const claims = buildCombinedClaims(bundle.core, bundle.supplement).filter((claim) =>
        scopeIds.has(claim.native.claim_id)
    );
    const results = runNativeOperations(bundle, claims);

    it("recomputes shared_basis, records_by_value, within_source_divergence and the distinct-textual-bases totals, matching production", () => {
        const recomputedNames = [
            "shared_basis",
            "records_by_value",
            "within_source_divergence",
            "independent_bases / distinct_textual_bases",
        ];
        for (const name of recomputedNames) {
            const result = results.find((r) => r.name === name);
            expect(result, `${name} not found`).toBeDefined();
            expect(result?.recomputed, `${name} was not recomputed`).toBe(true);
            expect(result?.matchesExpected, `${name}: ${result?.mismatchDetail}`).toBe(true);
        }
    });

    // Known upstream data defect (recorded as an open data issue, not
    // patched over here): sources.json/native.source_title record this one
    // document's title as "信宜方言志"; expected_native_operations.json's
    // own recorded `source_value_pairs.expected` rows for the same
    // document_id spell it "信宜方志" (missing 言) on all four of its rows.
    // Every other field (idiom_tag, document_id, value, record_count) and
    // all thirteen other rows match exactly — recomputing from this
    // viewer's own (correctly spelled) source_title is the honest result,
    // not a bug in the recomputation.
    it("recomputes source_value_pairs correctly except one document's title, which the bundle itself records inconsistently", () => {
        const result = results.find((r) => r.name === "source_value_pairs");
        expect(result?.recomputed).toBe(true);
        expect(result?.matchesExpected).toBe(false);
        expect(result?.mismatchDetail).toContain("信宜方言志");

        const MISSPELLED_DOCUMENT_ID = "9f2df161-d69f-4293-93e6-13989a727f83";
        const otherRows = result!.computedRows.filter(
            (row) => row.document_id !== MISSPELLED_DOCUMENT_ID
        );
        const otherExpected = result!.expectedRows.filter(
            (row) => row.document_id !== MISSPELLED_DOCUMENT_ID
        );
        expect(otherRows).toEqual(expect.arrayContaining(otherExpected));
        expect(otherRows).toHaveLength(otherExpected.length);

        const misspelledRows = result!.computedRows.filter(
            (row) => row.document_id === MISSPELLED_DOCUMENT_ID
        );
        expect(misspelledRows.every((row) => row.source_title === "信宜方言志")).toBe(true);
    });

    it("reports exact row counts recorded in the bundle for each recomputed operation", () => {
        const byName = Object.fromEntries(results.map((r) => [r.name, r]));
        expect(byName.shared_basis.computedRows).toHaveLength(2);
        expect(byName.records_by_value.computedRows).toHaveLength(11);
        expect(byName.source_value_pairs.computedRows).toHaveLength(17);
        expect(byName.within_source_divergence.computedRows).toHaveLength(4);
        expect(byName["independent_bases / distinct_textual_bases"].computedRows).toEqual([
            { components_merged_by_shared_basis: 4, distinct_textual_bases: 63 },
        ]);
    });

    it("has count_independent_analyses recorded as not_applicable, outside the operations array", () => {
        expect(results.some((r) => r.name === "count_independent_analyses")).toBe(false);
        expect(bundle.nativeOperations.not_applicable?.count_independent_analyses.status).toBe(
            "not_applicable"
        );
    });

    it("does NOT falsely report a match when a claim's value is corrupted (detects broken data/logic in records_by_value)", () => {
        const corruptedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_947e86a84240c486842fe728"
                ? { ...claim, native: { ...claim.native, value: "999" } }
                : claim
        );

        const corruptedResults = runNativeOperations(bundle, corruptedClaims);
        const recordsByValue = corruptedResults.find((r) => r.name === "records_by_value");

        expect(recordsByValue?.matchesExpected).toBe(false);
    });
});

describe("computeIndependentBasesSliceTotals (connected components over overlapping_span pairs)", () => {
    it("counts a chain (A–B, B–C, no A–C) as one independent basis, not zero or two", () => {
        const claims = [
            makeClaim({ claimId: "c_a", evidenceId: "ev_a", chunkId: "chunk_1", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_b", evidenceId: "ev_b", chunkId: "chunk_1", span: { start: 5, end: 15 } }),
            makeClaim({ claimId: "c_c", evidenceId: "ev_c", chunkId: "chunk_1", span: { start: 12, end: 20 } }),
        ];
        const pairs = computeSharedBasis(claims);
        // A–B and B–C overlap; A–C (0–10 vs 12–20) does not.
        expect(pairs.filter((p) => p.relation === "overlapping_span")).toHaveLength(2);

        const totals = computeIndependentBasesSliceTotals(claims, pairs);
        expect(totals.evidence_nodes).toBe(3);
        expect(totals.independent_textual_bases_after_shared_basis_merge).toBe(1);
    });

    it("counts a triangle of pairwise-overlapping fragments as one independent basis, not zero (the bug this fix corrects: evidence_count - pair_count = 3 - 3 = 0 is wrong)", () => {
        const claims = [
            makeClaim({ claimId: "c_a", evidenceId: "ev_a", chunkId: "chunk_1", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_b", evidenceId: "ev_b", chunkId: "chunk_1", span: { start: 2, end: 12 } }),
            makeClaim({ claimId: "c_c", evidenceId: "ev_c", chunkId: "chunk_1", span: { start: 4, end: 14 } }),
        ];
        const pairs = computeSharedBasis(claims);
        // All three spans mutually overlap: A–B, B–C, and A–C.
        expect(pairs.filter((p) => p.relation === "overlapping_span")).toHaveLength(3);

        const totals = computeIndependentBasesSliceTotals(claims, pairs);
        expect(totals.evidence_nodes).toBe(3);
        expect(totals.independent_textual_bases_after_shared_basis_merge).toBe(1);
    });

    it("counts two untouched evidence nodes plus one overlapping pair as three independent bases (two singletons, one merged pair)", () => {
        const claims = [
            makeClaim({ claimId: "c_x", evidenceId: "ev_x", chunkId: "chunk_x", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_y", evidenceId: "ev_y", chunkId: "chunk_y", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_a", evidenceId: "ev_a", chunkId: "chunk_1", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_b", evidenceId: "ev_b", chunkId: "chunk_1", span: { start: 5, end: 15 } }),
        ];
        const pairs = computeSharedBasis(claims);
        expect(pairs.filter((p) => p.relation === "overlapping_span")).toHaveLength(1);

        const totals = computeIndependentBasesSliceTotals(claims, pairs);
        expect(totals.evidence_nodes).toBe(4);
        expect(totals.independent_textual_bases_after_shared_basis_merge).toBe(3);
    });

    it("does not let a same_evidence pair push the count below the number of distinct-evidence components (same_evidence never adds an edge, since both sides already share one evidence_id)", () => {
        const claims = [
            // Two claims over the identical evidence — same_evidence, not a
            // second vertex — plus one untouched evidence elsewhere.
            makeClaim({ claimId: "c_s1", evidenceId: "ev_shared", chunkId: "chunk_1", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_s2", evidenceId: "ev_shared", chunkId: "chunk_1", span: { start: 0, end: 10 } }),
            makeClaim({ claimId: "c_other", evidenceId: "ev_other", chunkId: "chunk_2", span: { start: 0, end: 10 } }),
        ];
        const pairs = computeSharedBasis(claims);
        expect(pairs).toHaveLength(1);
        expect(pairs[0].relation).toBe("same_evidence");

        const totals = computeIndependentBasesSliceTotals(claims, pairs);
        expect(totals.evidence_nodes).toBe(2);
        expect(totals.independent_textual_bases_after_shared_basis_merge).toBe(2);
    });

    it("detects a corrupted feature value via a mismatch in the feature-grouped independent_bases rows, while shared_basis (which never reads feature) stays unaffected", () => {
        const bundle = loadC1Bundle();
        const claims = buildCombinedClaims(bundle.core, bundle.supplement);

        const perturbedClaims = claims.map((claim) =>
            claim.native.claim_id === "claim_022833074dd15cd7808893e7"
                ? { ...claim, native: { ...claim.native, feature: "PERTURBED_FEATURE" } }
                : claim
        );

        const baseline = runNativeOperations(bundle, claims);
        const perturbed = runNativeOperations(bundle, perturbedClaims);

        const baselineIndependentBases = baseline.find((r) => r.name === "independent_bases");
        const perturbedIndependentBases = perturbed.find((r) => r.name === "independent_bases");
        expect(baselineIndependentBases?.matchesExpected).toBe(true);
        expect(perturbedIndependentBases?.matchesExpected).toBe(false);

        // shared_basis groups by chunk/span/evidence, never by feature, so
        // perturbing only `feature` must leave it matching production.
        const baselineSharedBasis = baseline.find((r) => r.name === "shared_basis");
        const perturbedSharedBasis = perturbed.find((r) => r.name === "shared_basis");
        expect(baselineSharedBasis?.matchesExpected).toBe(true);
        expect(perturbedSharedBasis?.matchesExpected).toBe(true);
    });
});
