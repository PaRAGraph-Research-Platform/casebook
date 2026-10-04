import { describe, expect, it } from "vitest";
import { CASES, getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "./CasebookStore";

function newStore(caseId: "c1" | "c2" | "c3" | "c4"): CasebookStore {
    const caseDef = getCaseDefinition(caseId);
    return new CasebookStore(caseDef, caseDef.loadBundle());
}

describe("CasebookStore (C2)", () => {
    it("starts with all nine comparison claims visible and the full 25-node/35-edge graph", () => {
        const store = newStore("c2");
        const comparisonOps = store.bundle.expectedComparisonOperations;
        expect(comparisonOps).not.toBeNull();
        expect(store.visibleClaimIds).toEqual([...comparisonOps!.all_with_curated_context].sort());
        expect(store.counts.claims).toBe(9);
        expect(store.counts.nodes).toBe(store.bundle.counts.comparison_nodes);
        expect(store.counts.edges).toBe(store.bundle.counts.comparison_edges);
        expect(store.bundle.counts.comparison_nodes).toBe(25);
        expect(store.bundle.counts.comparison_edges).toBe(35);
    });

    it("drops to eight claims when curated context (S4) is excluded, matching native_locality_only", () => {
        const store = newStore("c2");
        store.setFilters({ includeCuratedContext: false });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedComparisonOperations!.native_locality_only].sort()
        );
        expect(store.counts.claims).toBe(8);
    });

    it("filters to the five-claim Yue-Hashimoto baseline when the source filter is applied", () => {
        const store = newStore("c2");
        const yueHashimotoId = store.bundle.nativeOperations.scope.sources.yue_hashimoto_1991;
        store.setFilters({ sourceId: yueHashimotoId });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedOperations.baseline_claim_ids].sort()
        );
    });

    it("filters by feature to match the recorded comparison by_feature groups", () => {
        const store = newStore("c2");
        store.setFilters({ feature: "CONS_ASPIRATION_CONTRAST" });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedComparisonOperations!.by_feature.CONS_ASPIRATION_CONTRAST].sort()
        );
    });

    it("reports an empty visible graph for a feature with zero matching claims", () => {
        const store = newStore("c2");
        // No feature in the five-category scope has zero comparison claims;
        // pick an id outside the declared feature set to exercise the
        // documented "no records in this slice" state.
        store.setFilters({ feature: "NON_EXISTENT_FEATURE" });
        expect(store.visibleClaimIds).toEqual([]);
        expect(store.counts).toEqual({ claims: 0, evidence: 0, sources: 0, nodes: 0, edges: 0 });
    });

    it("is reversible: apply filters then reset returns to the initial visible set and counts", () => {
        const store = newStore("c2");
        const initialClaimIds = store.visibleClaimIds;
        const initialCounts = store.counts;

        store.setFilters({
            sourceId: store.bundle.nativeOperations.scope.sources.chen_chen_2005,
            feature: "CONS_VOICED_OBSTRUENTS_REPORTED",
            includeCuratedContext: false,
        });
        expect(store.visibleClaimIds).not.toEqual(initialClaimIds);

        store.reset();
        expect(store.visibleClaimIds).toEqual(initialClaimIds);
        expect(store.counts).toEqual(initialCounts);
        expect(store.selectedNodeId).toBeNull();
    });

    it("selects a claim by CASE_EN anchor and resolves it in selectedClaim / selectedSource", () => {
        const store = newStore("c2");
        store.selectAnchor("K1");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_aee8cfae9c56115ccabe9877");
        expect(store.selectedSource?.title).toBe("The Yue Dialect");
    });

    it("resolves an Evidence node selection back to its supported claim", () => {
        const store = newStore("c2");
        store.selectNode("ev_547657c95bd5ef5c1001");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_aee8cfae9c56115ccabe9877");
    });
});

describe("CasebookStore (C1)", () => {
    it("starts with all fourteen comparison claims visible and the full 37-node/55-edge graph", () => {
        const store = newStore("c1");
        expect(store.counts.claims).toBe(14);
        expect(store.counts.nodes).toBe(store.bundle.counts.comparison_nodes);
        expect(store.counts.edges).toBe(store.bundle.counts.comparison_edges);
        expect(store.bundle.counts.comparison_nodes).toBe(37);
        expect(store.bundle.counts.comparison_edges).toBe(55);
    });

    it("filters to the nine-claim core baseline when the source filter is applied per-source and unioned", () => {
        const store = newStore("c1");
        const bySource = store.bundle.expectedOperations.core_by_source!;
        const allCoreIds = Object.values(bySource).flat().sort();
        expect([...store.bundle.expectedOperations.baseline_claim_ids].sort()).toEqual(allCoreIds);

        for (const [documentId, claimIds] of Object.entries(bySource)) {
            store.setFilters({ sourceId: documentId });
            // The C1 comparison scope includes supplement claims from the
            // same sources too, so filtering by source is a superset of the
            // core-only expectation — every core claim for this source must
            // still be visible.
            for (const claimId of claimIds) {
                expect(store.visibleClaimIds).toContain(claimId);
            }
        }
    });

    it("filters by target to match the recorded comparison_by_target groups", () => {
        const store = newStore("c1");
        store.setFilters({ target: "YUE_WUHUA" });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedOperations.comparison_by_target!.YUE_WUHUA].sort()
        );
    });

    it("filters by feature to match the recorded comparison_by_feature groups", () => {
        const store = newStore("c1");
        store.setFilters({ feature: "GEOGRAPHY_DISTRIBUTION" });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedOperations.comparison_by_feature!.GEOGRAPHY_DISTRIBUTION].sort()
        );
    });

    it("reports an empty visible graph for a target with zero matching claims", () => {
        const store = newStore("c1");
        store.setFilters({ target: "NON_EXISTENT_TARGET" });
        expect(store.visibleClaimIds).toEqual([]);
        expect(store.counts).toEqual({ claims: 0, evidence: 0, sources: 0, nodes: 0, edges: 0 });
    });

    it("is reversible: apply source/feature/target filters then reset returns to the initial visible set", () => {
        const store = newStore("c1");
        const initialClaimIds = store.visibleClaimIds;
        const initialCounts = store.counts;

        store.setFilters({
            sourceId: store.bundle.nativeOperations.scope.sources.atlas_2012,
            feature: "GEOGRAPHY_DISTRIBUTION",
            target: "YUE_GAOYANG",
        });
        expect(store.visibleClaimIds).not.toEqual(initialClaimIds);

        store.reset();
        expect(store.visibleClaimIds).toEqual(initialClaimIds);
        expect(store.counts).toEqual(initialCounts);
        expect(store.selectedNodeId).toBeNull();
    });

    it("selects a claim by CASE_EN anchor (C1's A/B/C/D/S scheme)", () => {
        const store = newStore("c1");
        store.selectAnchor("D1");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_2802a2ca639ec1cc8be8fd4b");
    });

    it("highlights multiple claims from a Positions-table row's anchor list and switches to Explore", () => {
        const store = newStore("c1");
        store.setActiveTab("case");
        store.selectAnchors(["A1", "A2", "S1"]);
        expect(store.activeTab).toBe("explore");
        expect([...store.highlightedNodeIds].sort()).toEqual(
            [
                "claim_a0314ec98e293304abc62820",
                "claim_7d20d293e2afdcc5a3805279",
                "claim_cfd92b2d77712342e18c6b94",
            ].sort()
        );
        expect(store.selectedNodeId).toBe("claim_a0314ec98e293304abc62820");
    });
});

describe("CasebookStore (C3)", () => {
    it("starts with all twenty-one comparison claims visible and the full 55-node/84-edge graph", () => {
        const store = newStore("c3");
        expect(store.counts.claims).toBe(21);
        expect(store.counts.nodes).toBe(store.bundle.counts.comparison_nodes);
        expect(store.counts.edges).toBe(store.bundle.counts.comparison_edges);
        expect(store.bundle.counts.comparison_nodes).toBe(55);
        expect(store.bundle.counts.comparison_edges).toBe(84);
    });

    it("filters by target to match the recorded comparison_by_target groups", () => {
        const store = newStore("c3");
        store.setFilters({ target: "YUE_SIYI" });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedOperations.comparison_by_target!.YUE_SIYI].sort()
        );
    });

    it("filters by feature to match the recorded comparison_by_feature groups", () => {
        const store = newStore("c3");
        store.setFilters({ feature: "METALINGUISTIC_HIERARCHY_LEVEL" });
        expect(store.visibleClaimIds).toEqual(
            [...store.bundle.expectedOperations.comparison_by_feature!.METALINGUISTIC_HIERARCHY_LEVEL].sort()
        );
    });

    it("filters to the core baseline per source, a subset of the wider comparison scope", () => {
        const store = newStore("c3");
        const bySource = store.bundle.expectedOperations.core_by_source!;
        for (const [documentId, claimIds] of Object.entries(bySource)) {
            store.setFilters({ sourceId: documentId });
            for (const claimId of claimIds) {
                expect(store.visibleClaimIds).toContain(claimId);
            }
        }
    });

    it("reports an empty visible graph for a target with zero matching claims", () => {
        const store = newStore("c3");
        store.setFilters({ target: "NON_EXISTENT_TARGET" });
        expect(store.visibleClaimIds).toEqual([]);
        expect(store.counts).toEqual({ claims: 0, evidence: 0, sources: 0, nodes: 0, edges: 0 });
    });

    it("is reversible: apply filters then reset returns to the initial visible set and counts", () => {
        const store = newStore("c3");
        const initialClaimIds = store.visibleClaimIds;
        const initialCounts = store.counts;

        store.setFilters({ target: "YUE_GAOYANG", feature: "CLASSIFICATION_ATLAS2012" });
        expect(store.visibleClaimIds).not.toEqual(initialClaimIds);

        store.reset();
        expect(store.visibleClaimIds).toEqual(initialClaimIds);
        expect(store.counts).toEqual(initialCounts);
        expect(store.selectedNodeId).toBeNull();
    });

    it("selects a claim by CASE_EN anchor (C3's A/Y/H/K/S scheme)", () => {
        const store = newStore("c3");
        store.selectAnchor("A2");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_4cf43021976128a0939ce88a");
    });

    it("highlights the claims a Levels-table row draws on and switches to Explore (L-Y2: Y2, H1, S2)", () => {
        const store = newStore("c3");
        store.setActiveTab("case");
        store.selectAnchors(["Y2", "H1", "S2"]);
        expect(store.activeTab).toBe("explore");
        expect([...store.highlightedNodeIds].sort()).toEqual(
            [
                "claim_1bcde9febf2f8e5ecfadf6d2",
                "claim_5764dbb5750b494ed12fd4e1",
                "claim_a7dce69f9acdc82051a3063d",
            ].sort()
        );
        expect(store.selectedNodeId).toBe("claim_1bcde9febf2f8e5ecfadf6d2");
    });

    it("resolves every Levels-table row's anchors to a real claim in the comparison scope (no orphan anchors)", () => {
        const store = newStore("c3");
        const table = store.bundle.levelsTable!;

        for (const row of table.rows) {
            for (const anchor of row.anchors.split(",")) {
                const claimId = store.anchorToClaimId.get(anchor.trim());
                expect(claimId, `row ${row.row_id}'s anchor "${anchor.trim()}" did not resolve`).toBeDefined();
                expect(store.visibleClaimIds).toContain(claimId);
            }
        }
    });

    it("every claim's own scheme tag (annotation.scheme) matches the curated by_scheme grouping", () => {
        const store = newStore("c3");
        const bySchemeExpected = store.bundle.expectedOperations.by_scheme!;

        for (const [scheme, claimIds] of Object.entries(bySchemeExpected)) {
            for (const claimId of claimIds) {
                expect(store.claimById.get(claimId)?.annotation.scheme).toBe(scheme);
            }
        }
    });
});

describe("CasebookStore (C4)", () => {
    it("starts with all records visible across three localities (65 core + 32 GS/TS supplement, outside the native-operations scope)", () => {
        const store = newStore("c4");
        // combinedClaims/visibleClaimIds cover core+supplement (Explore/
        // EvidencePanel need the supplement's GS/TS passport-linkage records
        // too); only nativeOperationResults narrows to the curator-handoff
        // scope (see CasebookStore.nativeOperationResults's doc comment).
        expect(store.bundle.core).toHaveLength(65);
        expect(store.bundle.supplement).toHaveLength(32);
        expect(store.counts.claims).toBe(97);
        expect(store.bundle.nativeOperations.scope.claim_ids).toHaveLength(65);
        expect(store.localities).toEqual(["CANTONESE_STD", "TAISHAN", "XINYI"]);
    });

    it("filters by locality to match the recorded records_by_idiom_tag counts", () => {
        const store = newStore("c4");
        const byIdiom = (
            store.bundle.expectedOperations as unknown as { records_by_idiom_tag: Record<string, number> }
        ).records_by_idiom_tag;

        for (const [locality, count] of Object.entries(byIdiom)) {
            store.setFilters({ locality });
            expect(store.visibleClaimIds).toHaveLength(count);
            for (const claimId of store.visibleClaimIds) {
                expect(store.claimById.get(claimId)?.native.locality).toBe(locality);
            }
        }
    });

    it("reports an empty visible graph for a locality with zero matching claims", () => {
        const store = newStore("c4");
        store.setFilters({ locality: "NON_EXISTENT_LOCALITY" });
        expect(store.visibleClaimIds).toEqual([]);
        expect(store.counts).toEqual({ claims: 0, evidence: 0, sources: 0, nodes: 0, edges: 0 });
    });

    it("is reversible: apply the locality filter then reset returns to the initial visible set", () => {
        const store = newStore("c4");
        const initialClaimIds = store.visibleClaimIds;

        store.setFilters({ locality: "XINYI" });
        expect(store.visibleClaimIds).not.toEqual(initialClaimIds);

        store.reset();
        expect(store.visibleClaimIds).toEqual(initialClaimIds);
    });

    it("selects a claim by CASE_EN anchor (C4's G/T/X scheme)", () => {
        const store = newStore("c4");
        store.selectAnchor("G1");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_947e86a84240c486842fe728");
        store.selectAnchor("T1");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_02e056b60cf1dfd5e1c3ee7e");
        store.selectAnchor("X1");
        expect(store.selectedClaim?.native.claim_id).toBe("claim_3c296686a817f279934b8917");
    });

    it("resolves SourceRecord metadata for every C4 supplement claim from the two subgroup-only books", () => {
        const store = newStore("c4");
        const subgroupOnlyDocumentIds = new Set([
            "191a8707-be0d-4175-9cbb-c73c19fa9dea",
            "71cc631d-7ec2-4b20-99b0-37f72f75d37b",
        ]);
        const subgroupClaims = store.bundle.supplement.filter((record) =>
            subgroupOnlyDocumentIds.has(record.native.document_id)
        );

        // The Passport's subgroup-address routes add 18 Modern Cantonese
        // Phonology and 9 Routledge Encyclopedia claims to the comparison
        // view. Every one needs a real bibliographic SourceRecord; a UI
        // fallback would leave its Evidence panel without authors/year/rights.
        expect(subgroupClaims).toHaveLength(27);
        expect(
            subgroupClaims.filter((record) => !store.sourceById.has(record.native.document_id))
        ).toEqual([]);

        for (const documentId of subgroupOnlyDocumentIds) {
            const source = store.sourceById.get(documentId);
            expect(source?.library?.authors?.length ?? 0).toBeGreaterThan(0);
            expect(source?.library?.publication_year).toBeTypeOf("number");
            expect(source?.annotation.rights).toBe(
                "quoted_under_quotation_exception; full text not redistributed"
            );
        }
    });

    it("keeps GS15's quoted evidence while excluding its technical archive-wrapper tail", () => {
        const store = newStore("c4");
        const gs15 = store.bundle.supplement.find((record) => record.annotation.anchor === "GS15");
        expect(gs15).toBeDefined();

        const native = gs15!.native;
        const contextSegments = native.context_segments ?? [];
        const quote = native.quote ?? "";
        const contextText = contextSegments.map((segment) => segment.text).join("");
        const quoteStart = native.start_char ?? 0;
        const quoteEnd = native.end_char ?? 0;

        expect(quote).not.toBe("");
        expect(contextSegments).not.toHaveLength(0);
        expect(contextText.replace(/\s+/g, "")).toContain(quote.replace(/\s+/g, ""));
        expect(
            contextSegments.some(
                (segment) => segment.start_char < quoteEnd && quoteStart < segment.end_char
            )
        ).toBe(true);
        expect(contextText).not.toMatch(/zip_password|\/Users\/|docs\/(?:reports|vlm-ingest|handoffs)\/|backend\//i);
        expect(
            contextSegments.some(
                (segment) => /^\s*"[^"\\]*(?:\\.[^"\\]*)*"\s*:\s*.*[,]?\s*$/s.test(segment.text)
            )
        ).toBe(false);
    });

    it("clears only the locality filter that would hide subgroup-address Passport anchors before opening Explore", () => {
        const store = newStore("c4");
        // GS7/GS11/GS15 are a C4 Passport row found by subgroup address.
        // Their supplement records have native.locality === null, so keeping
        // a CANTONESE_STD locality filter would make the highlighted row
        // disappear immediately after the Passport-to-Explore navigation.
        const anchors = ["GS7", "GS11", "GS15"];
        const selectedSourceIds = anchors.map((anchor) =>
            store.claimById.get(store.anchorToClaimId.get(anchor)!)!.native.document_id
        );
        expect(new Set(selectedSourceIds).size).toBe(1);
        store.setFilters({ locality: "CANTONESE_STD", sourceId: selectedSourceIds[0] });

        store.selectAnchors(anchors);

        expect(store.activeTab).toBe("explore");
        expect(store.filters).toEqual({
            sourceId: selectedSourceIds[0],
            feature: null,
            target: null,
            locality: null,
            includeCuratedContext: true,
        });
        const highlightedIds = [...store.highlightedNodeIds];
        expect(highlightedIds).toHaveLength(3);
        expect(highlightedIds.every((claimId) => store.visibleClaimIds.includes(claimId))).toBe(true);
        expect(store.visibleClaimIds).toContain(store.selectedNodeId);
    });

    it("computes majority counts by records and by pairs, matching the production control numbers", () => {
        const store = newStore("c4");

        store.setMajorityIdiom("XINYI");
        expect(store.majorityCounts.byRecords[0]).toEqual({ value: "6", count: 15 });
        expect(store.majorityCounts.byPairs[0]).toEqual({ value: "8", count: 3 });

        store.setMajorityIdiom("TAISHAN");
        expect(store.majorityCounts.byRecords[0]).toEqual({ value: "6", count: 14 });
        const tiedValues = new Set(store.majorityCounts.byPairs.map((c) => c.value));
        expect(tiedValues).toEqual(new Set(["5", "6", "10"]));
        expect(store.majorityCounts.byPairs.every((c) => c.count === 1)).toBe(true);
    });

    it("restricts majority counts to class A only, leaving just values 9 and 8 for Xinyi", () => {
        const store = newStore("c4");
        store.setMajorityIdiom("XINYI");
        store.toggleMajorityBasisClass("B");
        store.toggleMajorityBasisClass("C");

        const values = new Set(store.majorityCounts.byRecords.map((c) => c.value));
        expect(values).toEqual(new Set(["9", "8"]));
    });
});

describe("case registry", () => {
    it("has exactly four cases with distinct ids", () => {
        expect(CASES).toHaveLength(4);
        expect(new Set(CASES.map((c) => c.id)).size).toBe(4);
    });

    it("constructs every registered case's store with empty filters and no selection (the invariant App.tsx relies on to reset state on case switch)", () => {
        for (const caseId of ["c1", "c2", "c3", "c4"] as const) {
            const store = newStore(caseId);
            expect(store.filters).toEqual({
                sourceId: null,
                feature: null,
                target: null,
                locality: null,
                includeCuratedContext: true,
            });
            expect(store.selectedNodeId).toBeNull();
            expect(store.highlightedNodeIds.size).toBe(0);
        }
    });
});
