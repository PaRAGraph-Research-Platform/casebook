import { makeAutoObservable } from "mobx";
import type { CaseDefinition } from "../cases/registry";
import type { CasebookBundle, GraphBundle, GraphEdgeRecord, GraphNodeRecord, SourceRecord } from "../types/bundle";
import { buildCombinedClaims, type CombinedClaim } from "../operations/combinedClaims";
import { countPairsByValue, countRecordsByValue, type ValueCount } from "../operations/majorityCounts";
import { runNativeOperations, type OperationRunResult } from "../operations/nativeOperations";

export type CasebookTab =
    | "case"
    | "explore"
    | "operations"
    | "positions"
    | "levels"
    | "passport"
    | "about"
    | "article";

export type BasisReviewClass = "A" | "B" | "C";

const ALL_BASIS_REVIEW_CLASSES: BasisReviewClass[] = ["A", "B", "C"];

export interface CasebookFilters {
    sourceId: string | null;
    feature: string | null;
    /** Working address/target filter — only meaningful for cases with more
     * than one target in scope (see CaseDefinition.hasTargetFilter). */
    target: string | null;
    /** Working locality (idiom_tag) filter — only meaningful for cases whose
     * main comparison axis is locality rather than target (C4; see
     * CaseDefinition.hasLocalityFilter). */
    locality: string | null;
    /** Controls whether one curated, null-native-locality record is included
     * (C2's S4). Everything else in the comparison scope carries a native
     * locality tag and is unaffected by this switch. Only rendered in the UI
     * for cases that declare hasCuratedContextToggle; harmless no-op
     * otherwise since it defaults to true (nothing excluded). */
    includeCuratedContext: boolean;
}

export interface MajorityCounts {
    byRecords: ValueCount[];
    byPairs: ValueCount[];
}

export interface VisibleGraph {
    nodes: GraphNodeRecord[];
    edges: GraphEdgeRecord[];
}

export interface VisibleCounts {
    claims: number;
    evidence: number;
    sources: number;
    nodes: number;
    edges: number;
}

const DEFAULT_FILTERS: CasebookFilters = {
    sourceId: null,
    feature: null,
    target: null,
    locality: null,
    includeCuratedContext: true,
};

export class CasebookStore {
    readonly bundle: CasebookBundle;
    readonly caseDef: CaseDefinition;
    readonly combinedClaims: CombinedClaim[];

    filters: CasebookFilters = { ...DEFAULT_FILTERS };
    selectedNodeId: string | null = null;
    activeTab: CasebookTab = "case";
    /** Claim ids highlighted by a Positions-table row click, shown as an
     * extra ring in the Explore graph alongside (not instead of) the
     * regular single-node selection. */
    highlightedNodeIds: Set<string> = new Set();

    /** C4-only Passport tab: which idiom's passport is on screen. Kept
     * separate from `majorityIdiom` below since the Passport and Operations
     * tabs are independent views a reader can be on at the same time as far
     * as the store's own state is concerned. */
    passportIdiom: string | null = null;
    /** C4-only Operations-tab "What does the majority say?" block: which
     * locality's counts are shown, and which basis_review_class chips
     * (A/B/C) are currently included. */
    majorityIdiom: string | null = null;
    majorityBasisClasses: Set<BasisReviewClass> = new Set(ALL_BASIS_REVIEW_CLASSES);

    constructor(caseDef: CaseDefinition, bundle: CasebookBundle) {
        this.caseDef = caseDef;
        this.bundle = bundle;
        this.combinedClaims = buildCombinedClaims(bundle.core, bundle.supplement);
        const firstIdiom = this.localities[0] ?? null;
        this.passportIdiom = firstIdiom;
        // Xinyi is the case's reference example (6 by records vs. 8 by pairs), so the majority view starts there.
        this.majorityIdiom = this.localities.includes("XINYI") ? "XINYI" : firstIdiom;
        makeAutoObservable(this, { bundle: false, caseDef: false, combinedClaims: false });
    }

    /** Distinct native localities (idiom tags) in this case's comparison
     * scope, sorted — the option list for the locality filter, the Passport
     * tab's idiom switcher, and the majority block's locality selector. */
    get localities(): string[] {
        const set = new Set<string>();
        for (const claim of this.combinedClaims) {
            if (claim.native.locality) set.add(claim.native.locality);
        }
        return [...set].sort();
    }

    get claimById(): Map<string, CombinedClaim> {
        const map = new Map<string, CombinedClaim>();
        for (const claim of this.combinedClaims) {
            map.set(claim.native.claim_id, claim);
        }
        return map;
    }

    get anchorToClaimId(): Map<string, string> {
        const map = new Map<string, string>();
        for (const claim of this.combinedClaims) {
            map.set(claim.annotation.anchor, claim.native.claim_id);
        }
        return map;
    }

    get sourceById(): Map<string, SourceRecord> {
        const map = new Map<string, SourceRecord>();
        for (const source of this.bundle.sources) {
            map.set(source.document_id, source);
        }
        return map;
    }

    /** Claim ids currently passing the active filters, sorted for stable
     * rendering and test comparisons. */
    get visibleClaimIds(): string[] {
        const ids = this.combinedClaims
            .filter((claim) => {
                if (!this.filters.includeCuratedContext && claim.native.locality === null) {
                    return false;
                }
                if (this.filters.sourceId && claim.native.document_id !== this.filters.sourceId) {
                    return false;
                }
                if (this.filters.feature && claim.native.feature !== this.filters.feature) {
                    return false;
                }
                if (this.filters.target && claim.native.target !== this.filters.target) {
                    return false;
                }
                if (this.filters.locality && claim.native.locality !== this.filters.locality) {
                    return false;
                }
                return true;
            })
            .map((claim) => claim.native.claim_id);
        return ids.sort();
    }

    get visibleGraph(): VisibleGraph {
        return buildVisibleGraph(this.bundle.comparisonGraph, this.visibleClaimIds);
    }

    get counts(): VisibleCounts {
        const graph = this.visibleGraph;
        return {
            claims: this.visibleClaimIds.length,
            evidence: graph.nodes.filter((node) => node.type === "Evidence").length,
            sources: graph.nodes.filter((node) => node.type === "Source").length,
            nodes: graph.nodes.length,
            edges: graph.edges.length,
        };
    }

    get connectedNodeIds(): Set<string> {
        if (!this.selectedNodeId) {
            return new Set();
        }
        const graph = this.visibleGraph;
        const connected = new Set<string>([this.selectedNodeId]);
        for (const edge of graph.edges) {
            if (edge.source === this.selectedNodeId) connected.add(edge.target);
            if (edge.target === this.selectedNodeId) connected.add(edge.source);
        }
        return connected;
    }

    /** Resolves the selected node to a claim, following a SUPPORTS edge back
     * from an Evidence node when the selection is evidence rather than a
     * claim directly. */
    get selectedClaim(): CombinedClaim | null {
        if (!this.selectedNodeId) return null;
        const direct = this.claimById.get(this.selectedNodeId);
        if (direct) return direct;

        for (const edge of this.bundle.comparisonGraph.edges) {
            if (edge.type === "SUPPORTS" && edge.source === this.selectedNodeId) {
                const claim = this.claimById.get(edge.target);
                if (claim) return claim;
            }
        }
        return null;
    }

    get selectedSource(): SourceRecord | null {
        const claim = this.selectedClaim;
        if (!claim) return null;
        return this.sourceById.get(claim.native.document_id) ?? null;
    }

    /** C4's "What does the majority say?" block, for the currently selected
     * `majorityIdiom` and `majorityBasisClasses` filter — counting records
     * (`records_by_value`) and technical pairs (`source_value_pairs`
     * groups) independently, matching `runNativeOperations`' own compute
     * functions rather than duplicating a second way to read the same
     * fields (see operations/majorityCounts.ts, which both this getter and
     * its own unit tests call directly). */
    get majorityCounts(): MajorityCounts {
        if (!this.majorityIdiom) return { byRecords: [], byPairs: [] };
        return {
            byRecords: countRecordsByValue(this.combinedClaims, this.majorityIdiom, this.majorityBasisClasses),
            byPairs: countPairsByValue(this.combinedClaims, this.majorityIdiom, this.majorityBasisClasses),
        };
    }

    /**
     * Every native operation this case's bundle declares, recomputed from
     * this store's own `combinedClaims` and checked against the bundle's
     * production-verified `expected` rows — the Findings tab's data source.
     * Computed once per store instance (the reader never clicks a "run"
     * button): `bundle`/`combinedClaims` are fixed for the store's whole
     * lifetime, and a fresh store is built on every case switch (see
     * `App.tsx`), so this getter's result is effectively "recomputed on
     * open/case change" without needing its own reaction.
     */
    get nativeOperationResults(): Record<string, OperationRunResult> {
        // Every native operation is declared against a fixed claim_ids scope
        // (`nativeOperations.scope.claim_ids`) — for C1–C3 this is every
        // claim `combinedClaims` carries, but C4's scope is a fixed 65-claim
        // curator handoff that deliberately excludes its own supplement.json
        // (32 GS/TS passport-linkage records added for the Passport tab,
        // outside that handoff — see docs/architecture.md, "Case bundles"). Feeding
        // those extra records into `runNativeOperations` would silently
        // inflate operations like `shared_basis` with pairs the production
        // graph's own recorded query never scoped to, so the scope is
        // applied here rather than trusting `combinedClaims` to already be
        // exactly the operation scope.
        const scopeIds = new Set(this.bundle.nativeOperations.scope.claim_ids);
        const scopedClaims = this.combinedClaims.filter((claim) => scopeIds.has(claim.native.claim_id));
        const results = runNativeOperations(this.bundle, scopedClaims);
        const byName: Record<string, OperationRunResult> = {};
        for (const result of results) {
            byName[result.name] = result;
        }
        return byName;
    }

    setFilters(partial: Partial<CasebookFilters>): void {
        this.filters = { ...this.filters, ...partial };
    }

    setActiveTab(tab: CasebookTab): void {
        this.activeTab = tab;
    }

    setPassportIdiom(idiom: string): void {
        this.passportIdiom = idiom;
    }

    setMajorityIdiom(idiom: string): void {
        this.majorityIdiom = idiom;
    }

    toggleMajorityBasisClass(cls: BasisReviewClass): void {
        const next = new Set(this.majorityBasisClasses);
        if (next.has(cls)) {
            next.delete(cls);
        } else {
            next.add(cls);
        }
        this.majorityBasisClasses = next;
    }

    selectNode(nodeId: string | null): void {
        this.selectedNodeId = nodeId;
    }

    selectAnchor(anchor: string): void {
        const claimId = this.anchorToClaimId.get(anchor);
        if (claimId) {
            this.makeClaimsVisible([claimId]);
            this.selectedNodeId = claimId;
        }
    }

    /** Resolves a Positions-table row's comma-separated anchor list (e.g.
     * "A1, A2, S1") to claim ids, highlights all of them, selects the first
     * one (so the Evidence panel shows something), and switches to Explore
     * so the reader sees the highlight. */
    selectAnchors(anchors: string[]): void {
        const claimIds = anchors
            .map((anchor) => this.anchorToClaimId.get(anchor.trim()))
            .filter((id): id is string => Boolean(id));
        this.makeClaimsVisible(claimIds);
        this.highlightedNodeIds = new Set(claimIds);
        if (claimIds.length > 0) {
            this.selectedNodeId = claimIds[0];
        }
        this.activeTab = "explore";
    }

    /**
     * An anchor-driven navigation promises that each selected record can be
     * seen in Explore. Keep every active filter that admits all selected
     * claims, but clear a filter if it would hide even one of them. This is
     * deliberately based on the same fields `visibleClaimIds` filters on, so
     * Passport subgroup-address records (whose native locality is null) do
     * not vanish after the navigation while unrelated compatible filters
     * remain in place.
     */
    private makeClaimsVisible(claimIds: string[]): void {
        const claims = claimIds
            .map((claimId) => this.claimById.get(claimId))
            .filter((claim): claim is CombinedClaim => Boolean(claim));
        if (claims.length === 0) return;

        const next = { ...this.filters };
        if (!next.includeCuratedContext && claims.some((claim) => claim.native.locality === null)) {
            next.includeCuratedContext = true;
        }
        if (next.sourceId && claims.some((claim) => claim.native.document_id !== next.sourceId)) {
            next.sourceId = null;
        }
        if (next.feature && claims.some((claim) => claim.native.feature !== next.feature)) {
            next.feature = null;
        }
        if (next.target && claims.some((claim) => claim.native.target !== next.target)) {
            next.target = null;
        }
        if (next.locality && claims.some((claim) => claim.native.locality !== next.locality)) {
            next.locality = null;
        }
        this.filters = next;
    }

    clearHighlight(): void {
        this.highlightedNodeIds = new Set();
    }

    reset(): void {
        this.filters = { ...DEFAULT_FILTERS };
        this.selectedNodeId = null;
        this.highlightedNodeIds = new Set();
    }
}

export function buildVisibleGraph(graph: GraphBundle, visibleClaimIds: string[]): VisibleGraph {
    const claimIdSet = new Set(visibleClaimIds);
    const nodeIds = new Set<string>(claimIdSet);

    for (const edge of graph.edges) {
        if (edge.type === "SUPPORTS" && claimIdSet.has(edge.target)) {
            nodeIds.add(edge.source);
        }
        if (edge.type === "ABOUT_FEATURE" && claimIdSet.has(edge.source)) {
            nodeIds.add(edge.target);
        }
        if (edge.type === "ABOUT_SUBGROUP" && claimIdSet.has(edge.source)) {
            nodeIds.add(edge.target);
        }
        if (edge.type === "ABOUT_GROUP" && claimIdSet.has(edge.source)) {
            nodeIds.add(edge.target);
        }
    }

    for (const edge of graph.edges) {
        if (edge.type === "HAS_EVIDENCE" && nodeIds.has(edge.target)) {
            nodeIds.add(edge.source);
        }
    }

    const nodes = graph.nodes.filter((node) => nodeIds.has(node.id));
    const edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

    return { nodes, edges };
}
