// Static, offline import of the vendored bundles. Vite inlines JSON imports
// and `?raw` text imports at build time, so the produced `dist/` needs no
// runtime fetch and works from `file://` or any static host.
//
// Each case bundle gets its own literal set of imports (Vite needs static,
// analyzable import paths) but is normalized into the same CasebookBundle
// shape by normalizeBundle() below, so the rest of the app never needs to
// know which case's JSON shape it is looking at.
import type {
    CasebookBundle,
    CoreRecord,
    CountsBundle,
    ExpectedComparisonOperationsBundle,
    ExpectedNativeOperationsBundle,
    ExpectedOperationsBundle,
    GraphBundle,
    GraphEdgeRecord,
    GraphNodeRecord,
    LevelsTableBundle,
    ManifestBundle,
    PairsTableBundle,
    PassportsBundle,
    PositionsTableBundle,
    SnapshotCheckBundle,
    SourceRecord,
    SupplementRecord,
} from "../types/bundle";

import c2CaseMarkdown from "../../data/c2/CASE_EN.md?raw";
import c2Manifest from "../../data/c2/MANIFEST.json";
import c2Graph from "../../data/c2/graph.json";
import c2ComparisonGraph from "../../data/c2/comparison_graph.json";
import c2Core from "../../data/c2/core.json";
import c2Supplement from "../../data/c2/supplement.json";
import c2NativeOperations from "../../data/c2/expected_native_operations.json";
import c2ExpectedOperations from "../../data/c2/expected_operations.json";
import c2ExpectedComparisonOperations from "../../data/c2/expected_comparison_operations.json";
import c2Sources from "../../data/c2/sources.json";
import c2Counts from "../../data/c2/counts.json";

import c1CaseMarkdown from "../../data/c1/CASE_EN.md?raw";
import c1Manifest from "../../data/c1/MANIFEST.json";
import c1Graph from "../../data/c1/graph.json";
import c1ComparisonGraph from "../../data/c1/comparison_graph.json";
import c1Core from "../../data/c1/core.json";
import c1Supplement from "../../data/c1/supplement.json";
import c1NativeOperations from "../../data/c1/expected_native_operations.json";
import c1ExpectedOperations from "../../data/c1/expected_operations.json";
import c1Sources from "../../data/c1/sources.json";
import c1Counts from "../../data/c1/counts.json";
import c1PositionsTable from "../../data/c1/positions_table.json";

import c3CaseMarkdown from "../../data/c3/CASE_EN.md?raw";
import c3Manifest from "../../data/c3/MANIFEST.json";
import c3Graph from "../../data/c3/graph.json";
import c3ComparisonGraph from "../../data/c3/comparison_graph.json";
import c3Core from "../../data/c3/core.json";
import c3Supplement from "../../data/c3/supplement.json";
import c3NativeOperations from "../../data/c3/expected_native_operations.json";
import c3ExpectedOperations from "../../data/c3/expected_operations.json";
import c3Sources from "../../data/c3/sources.json";
import c3Counts from "../../data/c3/counts.json";
import c3LevelsTable from "../../data/c3/levels_table.json";

import c4CaseMarkdown from "../../data/c4/CASE_EN.md?raw";
import c4Manifest from "../../data/c4/MANIFEST.json";
import c4Graph from "../../data/c4/graph.json";
import c4ComparisonGraph from "../../data/c4/comparison_graph.json";
import c4Core from "../../data/c4/core.json";
import c4Supplement from "../../data/c4/supplement.json";
import c4NativeOperationsRaw from "../../data/c4/expected_native_operations.json";
import c4ExpectedOperations from "../../data/c4/expected_operations.json";
import c4Sources from "../../data/c4/sources.json";
import c4Counts from "../../data/c4/counts.json";
import c4PairsTable from "../../data/c4/pairs_table.json";
import c4Passports from "../../data/c4/passports.json";
import c4SnapshotCheck from "../../data/c4/snapshot_2026-09-16/snapshot_check.json";

/** Raw graph JSON node shape varies by export version: C2 names the node
 * kind `type`, C1 names it `label`. Normalize to `type` so the rest of the
 * app (GraphNodeRecord) only ever sees one field name. */
function normalizeGraphNodes(nodes: Array<Record<string, unknown>>): GraphNodeRecord[] {
    return nodes.map((node) => ({
        id: String(node.id),
        type: (node.type ?? node.label) as GraphNodeRecord["type"],
        origin_kind: node.origin_kind as GraphNodeRecord["origin_kind"],
        title: typeof node.title === "string" ? node.title : undefined,
    }));
}

function normalizeGraphEdges(edges: Array<Record<string, unknown>>): GraphEdgeRecord[] {
    return edges.map((edge) => ({
        source: String(edge.source),
        type: edge.type as GraphEdgeRecord["type"],
        target: String(edge.target),
        origin_kind: edge.origin_kind as GraphEdgeRecord["origin_kind"],
    }));
}

function normalizeGraph(raw: unknown): GraphBundle {
    const g = raw as { nodes: Array<Record<string, unknown>>; edges: Array<Record<string, unknown>>; note?: string };
    return {
        nodes: normalizeGraphNodes(g.nodes),
        edges: normalizeGraphEdges(g.edges),
        note: g.note,
    };
}

/** C2's sources.json is a bare array; C1's wraps it as `{ sources, ... }`.
 * Both shapes are normalized to the bare SourceRecord[] the store expects. */
function normalizeSources(raw: unknown): SourceRecord[] {
    if (Array.isArray(raw)) return raw as SourceRecord[];
    const wrapped = raw as { sources: SourceRecord[] };
    return wrapped.sources;
}

export function loadC2Bundle(): CasebookBundle {
    return {
        version: (c2Manifest as ManifestBundle).version,
        manifest: c2Manifest as ManifestBundle,
        caseMarkdown: c2CaseMarkdown,
        graph: normalizeGraph(c2Graph),
        comparisonGraph: normalizeGraph(c2ComparisonGraph),
        core: c2Core as CoreRecord[],
        supplement: c2Supplement as SupplementRecord[],
        nativeOperations: c2NativeOperations as unknown as ExpectedNativeOperationsBundle,
        expectedOperations: c2ExpectedOperations as ExpectedOperationsBundle,
        expectedComparisonOperations:
            c2ExpectedComparisonOperations as ExpectedComparisonOperationsBundle,
        sources: normalizeSources(c2Sources),
        counts: c2Counts as CountsBundle,
        positionsTable: null,
        levelsTable: null,
        pairsTable: null,
        passports: null,
        snapshotCheck: null,
    };
}

export function loadC1Bundle(): CasebookBundle {
    return {
        version: (c1Manifest as ManifestBundle).version,
        manifest: c1Manifest as ManifestBundle,
        caseMarkdown: c1CaseMarkdown,
        graph: normalizeGraph(c1Graph),
        comparisonGraph: normalizeGraph(c1ComparisonGraph),
        core: c1Core as CoreRecord[],
        supplement: c1Supplement as SupplementRecord[],
        nativeOperations: c1NativeOperations as unknown as ExpectedNativeOperationsBundle,
        expectedOperations: c1ExpectedOperations as ExpectedOperationsBundle,
        expectedComparisonOperations: null,
        sources: normalizeSources(c1Sources),
        counts: c1Counts as CountsBundle,
        positionsTable: c1PositionsTable as PositionsTableBundle,
        levelsTable: null,
        pairsTable: null,
        passports: null,
        snapshotCheck: null,
    };
}

export function loadC3Bundle(): CasebookBundle {
    return {
        version: (c3Manifest as ManifestBundle).version,
        manifest: c3Manifest as ManifestBundle,
        caseMarkdown: c3CaseMarkdown,
        graph: normalizeGraph(c3Graph),
        comparisonGraph: normalizeGraph(c3ComparisonGraph),
        core: c3Core as CoreRecord[],
        supplement: c3Supplement as SupplementRecord[],
        nativeOperations: c3NativeOperations as unknown as ExpectedNativeOperationsBundle,
        expectedOperations: c3ExpectedOperations as ExpectedOperationsBundle,
        expectedComparisonOperations: null,
        sources: normalizeSources(c3Sources),
        counts: c3Counts as CountsBundle,
        positionsTable: null,
        levelsTable: c3LevelsTable as LevelsTableBundle,
        pairsTable: null,
        passports: null,
        snapshotCheck: null,
    };
}

/**
 * C4's `expected_native_operations.json` carries no `scope`/`remains_curated`
 * keys at all (unlike every other case bundle) — its input is a fixed list of
 * 65 UUIDs from a curator handoff, not a query-defined scope, and it records
 * no "what the graph does not compute" note of its own (its one open gap,
 * `count_independent_analyses`, is already recorded under `not_applicable`
 * instead). Synthesizing a minimal, honestly-empty `scope`/`remains_curated`
 * here — rather than loosening `ExpectedNativeOperationsBundle`'s type for
 * every case — keeps the generic ExploreView/AboutView code (which reads
 * `scope.features` and `remains_curated.items_en`) working without a
 * C4-specific branch in either component.
 */
function synthesizeC4NativeOperations(
    raw: unknown,
    baselineClaimIds: string[]
): ExpectedNativeOperationsBundle {
    const parsed = raw as Omit<ExpectedNativeOperationsBundle, "scope" | "remains_curated">;
    return {
        ...parsed,
        scope: {
            claim_ids: baselineClaimIds,
            sources: {},
            features: ["TONE_INVENTORY_COUNT"],
        },
        remains_curated: { items_en: [] },
    };
}

export function loadC4Bundle(): CasebookBundle {
    const expectedOperations = c4ExpectedOperations as unknown as ExpectedOperationsBundle;
    return {
        version: (c4Manifest as unknown as ManifestBundle).version,
        manifest: c4Manifest as unknown as ManifestBundle,
        caseMarkdown: c4CaseMarkdown,
        graph: normalizeGraph(c4Graph),
        comparisonGraph: normalizeGraph(c4ComparisonGraph),
        core: c4Core as CoreRecord[],
        supplement: c4Supplement as SupplementRecord[],
        nativeOperations: synthesizeC4NativeOperations(
            c4NativeOperationsRaw,
            expectedOperations.baseline_claim_ids
        ),
        expectedOperations,
        expectedComparisonOperations: null,
        sources: normalizeSources(c4Sources),
        counts: c4Counts as CountsBundle,
        positionsTable: null,
        levelsTable: null,
        pairsTable: c4PairsTable as unknown as PairsTableBundle,
        passports: c4Passports as unknown as PassportsBundle,
        snapshotCheck: c4SnapshotCheck as unknown as SnapshotCheckBundle,
    };
}
