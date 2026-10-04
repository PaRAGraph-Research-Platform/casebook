import type { CasebookBundle, NativeOperationDefinition, SourceRecord } from "../types/bundle";
import { operationCaveatAddition, operationQuestionLabel, operationTitleLabel } from "../utils/labels";
import type { CombinedClaim } from "./combinedClaims";

/** Source.title lives on the Source node, not on every Claim record — a few
 * claims (e.g. S4) don't carry native.source_title at all. Resolve titles
 * from the bundle's source list, the same way the native graph would join
 * through HAS_EVIDENCE to Source. */
function buildSourceTitleMap(sources: SourceRecord[]): Map<string, string> {
    return new Map(sources.map((source) => [source.document_id, source.title]));
}

/** Falls back to a Title Case rendering of the operation's snake_case name
 * when the bundle doesn't carry a title_en (C1's operations only have
 * question_en). */
function humanizeOperationName(name: string): string {
    return name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

export interface OperationRunResult {
    name: string;
    titleEn: string;
    questionEn: string;
    status: NativeOperationDefinition["status"];
    caveatEn: string | null;
    /** true when this run independently recomputed rows from bundle data;
     * false for partially_native operations shown as a recorded control. */
    recomputed: boolean;
    computedRows: Array<Record<string, unknown>>;
    expectedRows: Array<Record<string, unknown>>;
    matchesExpected: boolean;
    mismatchDetail: string | null;
    /** independent_bases-only: per-slice totals, compared against
     * expected_native_operations.json → operations[].slice_totals. */
    sliceTotals: Record<string, unknown> | null;
}

function hasPresentFlag(value: string, flag: boolean): boolean {
    const needle = flag ? '"present": true' : '"present": false';
    const needleCompact = flag ? '"present":true' : '"present":false';
    return value.includes(needle) || value.includes(needleCompact);
}

function presentFlagOf(value: string): "present_true" | "present_false" | "no_present_flag" {
    if (hasPresentFlag(value, true)) return "present_true";
    if (hasPresentFlag(value, false)) return "present_false";
    return "no_present_flag";
}

interface SharedBasisPair {
    claim_a: string;
    claim_b: string;
    ev_a: string;
    ev_b: string;
    chunk_id: string;
    a_start: number;
    a_end: number;
    b_start: number;
    b_end: number;
    relation: "same_evidence" | "overlapping_span";
}

export function computeSharedBasis(claims: CombinedClaim[]): SharedBasisPair[] {
    const sorted = [...claims].sort((left, right) =>
        left.native.claim_id.localeCompare(right.native.claim_id)
    );
    const pairs: SharedBasisPair[] = [];

    for (let i = 0; i < sorted.length; i += 1) {
        for (let j = i + 1; j < sorted.length; j += 1) {
            const a = sorted[i];
            const b = sorted[j];
            if (a.native.claim_id >= b.native.claim_id) continue;
            if (a.native.chunk_id !== b.native.chunk_id) continue;
            if (a.span === null || b.span === null) continue;
            const overlaps = a.span.start < b.span.end && b.span.start < a.span.end;
            if (!overlaps) continue;

            pairs.push({
                claim_a: a.native.claim_id,
                claim_b: b.native.claim_id,
                ev_a: a.native.evidence_id,
                ev_b: b.native.evidence_id,
                chunk_id: a.native.chunk_id,
                a_start: a.span.start,
                a_end: a.span.end,
                b_start: b.span.start,
                b_end: b.span.end,
                relation: a.native.evidence_id === b.native.evidence_id
                    ? "same_evidence"
                    : "overlapping_span",
            });
        }
    }

    return pairs.sort(
        (left, right) =>
            left.claim_a.localeCompare(right.claim_a) || left.claim_b.localeCompare(right.claim_b)
    );
}

interface IndependentBasesRow {
    feature: string;
    claims: number;
    distinct_evidence: number;
    distinct_chunks: number;
    distinct_sources: number;
    source_ids: string[];
}

export function computeIndependentBases(claims: CombinedClaim[]): IndependentBasesRow[] {
    const byFeature = new Map<string, CombinedClaim[]>();
    for (const claim of claims) {
        const bucket = byFeature.get(claim.native.feature) ?? [];
        bucket.push(claim);
        byFeature.set(claim.native.feature, bucket);
    }

    const rows: IndependentBasesRow[] = [];
    for (const [feature, group] of byFeature) {
        const evidenceIds = new Set(group.map((c) => c.native.evidence_id));
        const chunkIds = new Set(group.map((c) => c.native.chunk_id));
        const sourceIds = new Set(group.map((c) => c.native.document_id));
        rows.push({
            feature,
            claims: group.length,
            distinct_evidence: evidenceIds.size,
            distinct_chunks: chunkIds.size,
            distinct_sources: sourceIds.size,
            // Preserve first-encounter order (as `collect(DISTINCT ...)` would
            // return it walking the group), not alphabetical — the recorded
            // expected rows are order-sensitive here.
            source_ids: [...sourceIds],
        });
    }

    return rows.sort((left, right) => left.feature.localeCompare(right.feature));
}

/** Union-find `find` with path compression, used to count connected
 * components among a slice's evidence nodes (see
 * `countIndependentTextualBases`). */
function findRoot(parent: Map<string, string>, node: string): string {
    let root = node;
    while (parent.get(root) !== root) {
        root = parent.get(root) as string;
    }
    let cursor = node;
    while (cursor !== root) {
        const next = parent.get(cursor) as string;
        parent.set(cursor, root);
        cursor = next;
    }
    return root;
}

/**
 * Number of independent textual bases after merging shared_basis pairs —
 * the number of connected components in the graph whose vertices are the
 * slice's distinct evidence_ids and whose edges are `overlapping_span`
 * shared-basis pairs (`same_evidence` pairs join no new vertex — both sides
 * are already the same evidence_id — so they never add an edge here).
 *
 * This must be a connected-components count, not `evidence_count - pair_count`:
 * that naive subtraction is only correct when the overlapping-span pairs form
 * a forest (no two pairs sharing an evidence_id in a way that closes a
 * cycle). Three pairwise-overlapping evidence fragments (a triangle: A–B,
 * B–C, A–C) give 3 vertices and 3 edges — the naive formula returns
 * 3 − 3 = 0, but the fragments are one connected textual basis, not zero.
 */
function countIndependentTextualBases(
    evidenceIds: Set<string>,
    overlappingPairs: SharedBasisPair[]
): number {
    const parent = new Map<string, string>();
    for (const evidenceId of evidenceIds) {
        parent.set(evidenceId, evidenceId);
    }

    for (const pair of overlappingPairs) {
        if (!parent.has(pair.ev_a) || !parent.has(pair.ev_b)) continue;
        const rootA = findRoot(parent, pair.ev_a);
        const rootB = findRoot(parent, pair.ev_b);
        if (rootA !== rootB) parent.set(rootA, rootB);
    }

    const roots = new Set<string>();
    for (const evidenceId of evidenceIds) {
        roots.add(findRoot(parent, evidenceId));
    }
    return roots.size;
}

export function computeIndependentBasesSliceTotals(
    claims: CombinedClaim[],
    sharedBasisPairs: SharedBasisPair[]
): {
    claims: number;
    evidence_nodes: number;
    chunks: number;
    sources: number;
    independent_textual_bases_after_shared_basis_merge: number;
} {
    const evidenceIds = new Set(claims.map((c) => c.native.evidence_id));
    const chunkIds = new Set(claims.map((c) => c.native.chunk_id));
    const sourceIds = new Set(claims.map((c) => c.native.document_id));
    const overlappingPairs = sharedBasisPairs.filter((pair) => pair.relation === "overlapping_span");

    return {
        claims: claims.length,
        evidence_nodes: evidenceIds.size,
        chunks: chunkIds.size,
        sources: sourceIds.size,
        independent_textual_bases_after_shared_basis_merge: countIndependentTextualBases(
            evidenceIds,
            overlappingPairs
        ),
    };
}

interface SourceSplitRow {
    document_id: string;
    source_title: string;
    feature: string;
    claims: number;
    claim_ids: string[];
}

export function computeSourceSplit(
    claims: CombinedClaim[],
    sourceTitles: Map<string, string>
): SourceSplitRow[] {
    const key = (documentId: string, sourceTitle: string, feature: string) =>
        `${documentId} ${sourceTitle} ${feature}`;
    const groups = new Map<string, SourceSplitRow>();

    for (const claim of claims) {
        const documentId = claim.native.document_id;
        const sourceTitle = sourceTitles.get(documentId) ?? claim.native.source_title ?? "";
        const feature = claim.native.feature;
        const groupKey = key(documentId, sourceTitle, feature);
        const existing = groups.get(groupKey);
        if (existing) {
            existing.claims += 1;
            existing.claim_ids.push(claim.native.claim_id);
        } else {
            groups.set(groupKey, {
                document_id: documentId,
                source_title: sourceTitle,
                feature,
                claims: 1,
                claim_ids: [claim.native.claim_id],
            });
        }
    }

    for (const row of groups.values()) {
        row.claim_ids.sort();
    }

    return [...groups.values()].sort(
        (left, right) =>
            left.source_title.localeCompare(right.source_title) ||
            left.feature.localeCompare(right.feature)
    );
}

interface SourceComparisonRow {
    feature: string;
    a_att: number;
    a_nat: number;
    b_att: number;
    b_nat: number;
    row_class: "unique_a" | "unique_b" | "contrast" | "shared" | "neither";
}

export function computeSourceComparisonByFeature(
    claims: CombinedClaim[],
    sourceA: string,
    sourceB: string
): SourceComparisonRow[] {
    const features = new Set(claims.map((c) => c.native.feature));
    const rows: SourceComparisonRow[] = [];

    for (const feature of features) {
        const inFeature = claims.filter((c) => c.native.feature === feature);
        const countOf = (documentId: string, polarity: "attested" | "not_attested") =>
            inFeature.filter(
                (c) => c.native.document_id === documentId && c.native.polarity === polarity
            ).length;

        const aAtt = countOf(sourceA, "attested");
        const aNat = countOf(sourceA, "not_attested");
        const bAtt = countOf(sourceB, "attested");
        const bNat = countOf(sourceB, "not_attested");
        const aTotal = aAtt + aNat;
        const bTotal = bAtt + bNat;

        // "neither" covers a feature category this slice declares in scope
        // (e.g. via its claim_ids/target set) but where neither selected
        // source records anything at all — distinct from unique_a/unique_b,
        // which need at least one side to carry a record.
        let rowClass: SourceComparisonRow["row_class"];
        if (aTotal === 0 && bTotal === 0) {
            rowClass = "neither";
        } else if (aTotal === 0) {
            rowClass = "unique_b";
        } else if (bTotal === 0) {
            rowClass = "unique_a";
        } else if ((aAtt > 0 && bNat > 0) || (aNat > 0 && bAtt > 0)) {
            rowClass = "contrast";
        } else {
            rowClass = "shared";
        }

        rows.push({ feature, a_att: aAtt, a_nat: aNat, b_att: bAtt, b_nat: bNat, row_class: rowClass });
    }

    return rows.sort(
        (left, right) =>
            left.row_class.localeCompare(right.row_class) || left.feature.localeCompare(right.feature)
    );
}

interface SourceFilterRow {
    document_id: string;
    source_title: string;
    claim_id: string;
    feature: string;
    target: string;
    target_relationship: string;
    polarity: string;
    value: string;
    evidence_id: string;
}

/**
 * The C1 case's primary operation: change the selected source and see which
 * statements about composition and rank remain. The Cypher itself is not
 * parametrized by a chosen source — it returns one row per claim in scope,
 * carrying its own source; the actual "change the source" interaction lives
 * in the Explore tab's source filter, which slices this same claim set.
 */
export function computeSourceFilter(
    claims: CombinedClaim[],
    sourceTitles: Map<string, string>
): SourceFilterRow[] {
    const rows: SourceFilterRow[] = claims.map((claim) => ({
        document_id: claim.native.document_id,
        source_title: sourceTitles.get(claim.native.document_id) ?? claim.native.source_title ?? "",
        claim_id: claim.native.claim_id,
        feature: claim.native.feature,
        target: claim.native.target,
        target_relationship: claim.native.target_relationship,
        polarity: claim.native.polarity,
        value: claim.native.value,
        evidence_id: claim.native.evidence_id,
    }));

    return rows.sort(
        (left, right) =>
            left.source_title.localeCompare(right.source_title) ||
            left.feature.localeCompare(right.feature) ||
            left.claim_id.localeCompare(right.claim_id)
    );
}

interface AddressLevelBySourceRow {
    document_id: string;
    source_title: string;
    target_relationship: string;
    claims: number;
    targets: string[];
    claim_ids: string[];
}

/**
 * C3's own operation: for each source, how many of its statements attach
 * to the group address (YUE as a whole, via ABOUT_GROUP) versus a
 * subgroup address (via ABOUT_SUBGROUP) — a source that describes how the
 * language is divided attaches mostly to the group, one that describes a
 * property of a named unit attaches to the subgroup. `targets` is the
 * distinct target list, and `claim_ids` the full claim list, both in
 * claim_id order (matching `collect(DISTINCT ...)` walking the group in
 * claim-id order, the same convention `computeIndependentBases`'
 * `source_ids` documents for an unordered Neo4j collect — here the order
 * is a real, reproduced query guarantee, not unordered).
 */
export function computeAddressLevelBySource(
    claims: CombinedClaim[],
    sourceTitles: Map<string, string>
): AddressLevelBySourceRow[] {
    const groups = new Map<string, CombinedClaim[]>();
    for (const claim of claims) {
        const groupKey = `${claim.native.document_id} ${claim.native.target_relationship}`;
        const bucket = groups.get(groupKey) ?? [];
        bucket.push(claim);
        groups.set(groupKey, bucket);
    }

    const rows: AddressLevelBySourceRow[] = [];
    for (const group of groups.values()) {
        const sorted = [...group].sort((left, right) =>
            left.native.claim_id.localeCompare(right.native.claim_id)
        );
        const targets: string[] = [];
        const seenTargets = new Set<string>();
        for (const claim of sorted) {
            if (!seenTargets.has(claim.native.target)) {
                seenTargets.add(claim.native.target);
                targets.push(claim.native.target);
            }
        }
        const documentId = sorted[0].native.document_id;
        rows.push({
            document_id: documentId,
            source_title: sourceTitles.get(documentId) ?? sorted[0].native.source_title ?? "",
            target_relationship: sorted[0].native.target_relationship,
            claims: sorted.length,
            targets,
            claim_ids: sorted.map((c) => c.native.claim_id),
        });
    }

    return rows.sort(
        (left, right) =>
            left.source_title.localeCompare(right.source_title) ||
            left.target_relationship.localeCompare(right.target_relationship)
    );
}

interface TargetComparisonRow {
    feature: string;
    a_claims: number;
    b_claims: number;
    target_a_claims: string[];
    target_b_claims: string[];
    row_class: "unique_a" | "unique_b" | "shared" | "neither";
}

/**
 * Side-by-side comparison of two working addresses (targets) under each
 * feature category — the canonical two-target operation C2's single-target
 * slice could not run. Claim-id arrays preserve first-encounter order in
 * `claims` (core.json then supplement.json), matching collect(DISTINCT ...)
 * order from the recorded production Cypher, not an alphabetical sort.
 */
export function computeTargetComparisonByFeature(
    claims: CombinedClaim[],
    targetA: string,
    targetB: string
): TargetComparisonRow[] {
    const features = new Set(claims.map((c) => c.native.feature));
    const rows: TargetComparisonRow[] = [];

    for (const feature of features) {
        const inFeature = claims.filter((c) => c.native.feature === feature);
        const aIds = inFeature.filter((c) => c.native.target === targetA).map((c) => c.native.claim_id);
        const bIds = inFeature.filter((c) => c.native.target === targetB).map((c) => c.native.claim_id);

        // Same "neither" distinction as computeSourceComparisonByFeature:
        // a feature category can be in scope (present among some other
        // target's claims) while both selected working addresses carry no
        // record for it at all.
        let rowClass: TargetComparisonRow["row_class"];
        if (aIds.length === 0 && bIds.length === 0) {
            rowClass = "neither";
        } else if (aIds.length === 0) {
            rowClass = "unique_b";
        } else if (bIds.length === 0) {
            rowClass = "unique_a";
        } else {
            rowClass = "shared";
        }

        rows.push({
            feature,
            a_claims: aIds.length,
            b_claims: bIds.length,
            target_a_claims: aIds,
            target_b_claims: bIds,
            row_class: rowClass,
        });
    }

    return rows.sort(
        (left, right) =>
            left.row_class.localeCompare(right.row_class) || left.feature.localeCompare(right.feature)
    );
}

interface ContestedCellRow {
    target: string;
    feature: string;
    att: number;
    nat: number;
    sources: number;
    claim_ids: string[];
}

export function computeContestedCell(claims: CombinedClaim[]): ContestedCellRow[] {
    const groups = new Map<string, CombinedClaim[]>();
    for (const claim of claims) {
        const groupKey = `${claim.native.target} ${claim.native.feature}`;
        const bucket = groups.get(groupKey) ?? [];
        bucket.push(claim);
        groups.set(groupKey, bucket);
    }

    const rows: ContestedCellRow[] = [];
    for (const [groupKey, group] of groups) {
        const [target, feature] = groupKey.split(" ");
        const att = group.filter((c) => c.native.polarity === "attested").length;
        const nat = group.filter((c) => c.native.polarity === "not_attested").length;
        if (att === 0 || nat === 0) continue;

        rows.push({
            target,
            feature,
            att,
            nat,
            sources: new Set(group.map((c) => c.native.document_id)).size,
            claim_ids: group.map((c) => c.native.claim_id).sort(),
        });
    }

    return rows.sort((left, right) => left.feature.localeCompare(right.feature));
}

interface RecordsByValueRow {
    idiom_tag: string;
    value: string;
    claims: number;
}

/**
 * C4's own operation: for every (idiom_tag, value) pair in scope, how many
 * records report it — `c.idiom_tag` in the recorded Cypher is this bundle's
 * `native.locality` field (every C4 record carries a non-null locality;
 * unlike C1–C3, where `locality` is a curation flag that is null by
 * default, C4's export uses it as the idiom_tag column directly).
 */
export function computeRecordsByValue(claims: CombinedClaim[]): RecordsByValueRow[] {
    const counts = new Map<string, number>();
    for (const claim of claims) {
        const idiomTag = claim.native.locality ?? "";
        const key = `${idiomTag} ${claim.native.value}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const rows: RecordsByValueRow[] = [...counts.entries()].map(([key, claimsCount]) => {
        const [idiomTag, value] = key.split(" ");
        return { idiom_tag: idiomTag, value, claims: claimsCount };
    });
    return rows.sort(
        (left, right) => left.idiom_tag.localeCompare(right.idiom_tag) || left.value.localeCompare(right.value)
    );
}

interface SourceValuePairsRow {
    idiom_tag: string;
    document_id: string;
    source_title: string;
    value: string;
    record_count: number;
}

/**
 * C4's own operation: grouping by (idiom_tag, document, value) — the same
 * grouping `pair_id` is computed from — how many records fall in each of
 * the 17 technical pairs.
 */
export function computeSourceValuePairs(
    claims: CombinedClaim[],
    sourceTitles: Map<string, string>
): SourceValuePairsRow[] {
    const groups = new Map<string, SourceValuePairsRow>();
    for (const claim of claims) {
        const idiomTag = claim.native.locality ?? "";
        const documentId = claim.native.document_id;
        const value = claim.native.value;
        const key = `${idiomTag} ${documentId} ${value}`;
        const existing = groups.get(key);
        if (existing) {
            existing.record_count += 1;
        } else {
            groups.set(key, {
                idiom_tag: idiomTag,
                document_id: documentId,
                source_title: sourceTitles.get(documentId) ?? claim.native.source_title ?? "",
                value,
                record_count: 1,
            });
        }
    }
    return [...groups.values()].sort(
        (left, right) =>
            left.idiom_tag.localeCompare(right.idiom_tag) ||
            left.document_id.localeCompare(right.document_id) ||
            left.value.localeCompare(right.value)
    );
}

interface WithinSourceDivergenceRow {
    idiom_tag: string;
    document_id: string;
    values: string[];
}

/**
 * C4's own operation: which (idiom_tag, document) pairs report more than
 * one distinct value — divergence at the document level, which (per the
 * bundle's own caveat) does not by itself say how many independent analyses
 * a document contains (see `count_independent_analyses`, not_applicable).
 */
export function computeWithinSourceDivergence(claims: CombinedClaim[]): WithinSourceDivergenceRow[] {
    const groups = new Map<string, { idiom_tag: string; document_id: string; values: Set<string> }>();
    for (const claim of claims) {
        const idiomTag = claim.native.locality ?? "";
        const documentId = claim.native.document_id;
        const key = `${idiomTag} ${documentId}`;
        const existing = groups.get(key);
        if (existing) {
            existing.values.add(claim.native.value);
        } else {
            groups.set(key, { idiom_tag: idiomTag, document_id: documentId, values: new Set([claim.native.value]) });
        }
    }
    const rows: WithinSourceDivergenceRow[] = [];
    for (const group of groups.values()) {
        if (group.values.size <= 1) continue;
        rows.push({ idiom_tag: group.idiom_tag, document_id: group.document_id, values: [...group.values] });
    }
    return rows.sort(
        (left, right) => left.idiom_tag.localeCompare(right.idiom_tag) || left.document_id.localeCompare(right.document_id)
    );
}

interface DistinctTextualBasesTotals {
    components_merged_by_shared_basis: number;
    distinct_textual_bases: number;
}

/**
 * C4's shape of "independent_bases / distinct_textual_bases": unlike C1/C3's
 * per-feature rows + separate `slice_totals`, C4's bundle records a single
 * totals object directly as `expected` (see NativeOperationDefinition.expected's
 * doc comment). `distinct_textual_bases` is the same evidence-id
 * connected-components count `computeIndependentBasesSliceTotals` already
 * computes; `components_merged_by_shared_basis` is the count of distinct
 * claims appearing in any shared_basis pair (same_evidence or
 * overlapping_span) — how many records the merge actually touches, not how
 * many components result.
 */
export function computeDistinctTextualBasesTotals(
    claims: CombinedClaim[],
    sharedBasisPairs: SharedBasisPair[]
): DistinctTextualBasesTotals {
    const totals = computeIndependentBasesSliceTotals(claims, sharedBasisPairs);
    const mergedClaims = new Set<string>();
    for (const pair of sharedBasisPairs) {
        mergedClaims.add(pair.claim_a);
        mergedClaims.add(pair.claim_b);
    }
    return {
        components_merged_by_shared_basis: mergedClaims.size,
        distinct_textual_bases: totals.independent_textual_bases_after_shared_basis_merge,
    };
}

interface PolarityValueConsistencyRow {
    claim_id: string;
    feature: string;
    polarity: string;
    present_flag: ReturnType<typeof presentFlagOf>;
}

export function computePolarityValueConsistency(
    claims: CombinedClaim[]
): PolarityValueConsistencyRow[] {
    const rows = claims.map((claim) => ({
        claim_id: claim.native.claim_id,
        feature: claim.native.feature,
        polarity: claim.native.polarity,
        present_flag: presentFlagOf(claim.native.value),
    }));

    return rows.sort(
        (left, right) =>
            left.feature.localeCompare(right.feature) || left.claim_id.localeCompare(right.claim_id)
    );
}

/**
 * Columns built from `collect(DISTINCT ...)` over a traversal Neo4j gives
 * no ORDER BY guarantee for: `independent_bases`' `source_ids` (Source
 * nodes reached through a second hop from Evidence) and
 * `target_comparison_by_feature`'s `target_a_claims`/`target_b_claims`
 * (each side collected from its own branch of the query, e.g. a group vs.
 * a subgroup address match, with no shared ordering across branches).
 * Comparing these order-insensitively is the correct semantics, not a
 * relaxation of a real invariant: only set membership is a query guarantee
 * here. C1 and C2's `target_comparison_by_feature` rows happen to
 * reproduce this viewer's own claims-array encounter order, but C3's do
 * not — confirming the order was never a guaranteed property of the query.
 * Columns whose order does come from a single, claim-id-sorted traversal
 * (e.g. `source_split`'s `claim_ids`) stay order-sensitive. C4's
 * `within_source_divergence` adds one more: `values`, from its own
 * `collect(DISTINCT c.value)` over an unordered match, the same guarantee
 * (or lack of one) as `independent_bases`' `source_ids`.
 */
const ORDER_INSENSITIVE_ARRAY_KEYS = new Set([
    "source_ids",
    "target_a_claims",
    "target_b_claims",
    "values",
]);

function normalizeRowForComparison(row: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
        normalized[key] =
            ORDER_INSENSITIVE_ARRAY_KEYS.has(key) && Array.isArray(value) ? [...value].sort() : value;
    }
    return normalized;
}

function deepEqualUnordered(
    computed: Array<Record<string, unknown>>,
    expected: Array<Record<string, unknown>>
): { matches: boolean; detail: string | null } {
    if (computed.length !== expected.length) {
        return {
            matches: false,
            detail: `row count differs: computed=${computed.length} expected=${expected.length}`,
        };
    }

    const computedSorted = computed
        .map((row) => JSON.stringify(sortKeys(normalizeRowForComparison(row))))
        .sort();
    const expectedSorted = expected
        .map((row) => JSON.stringify(sortKeys(normalizeRowForComparison(row))))
        .sort();

    for (let i = 0; i < computedSorted.length; i += 1) {
        if (computedSorted[i] !== expectedSorted[i]) {
            return {
                matches: false,
                detail: `row ${i} differs:\n  computed=${computedSorted[i]}\n  expected=${expectedSorted[i]}`,
            };
        }
    }

    return { matches: true, detail: null };
}

function sortKeys(row: Record<string, unknown>): Record<string, unknown> {
    const sorted: Record<string, unknown> = {};
    for (const k of Object.keys(row).sort()) {
        sorted[k] = row[k];
    }
    return sorted;
}

/**
 * Recomputes each native operation this case's bundle declares a compute
 * function for, from the bundle's own core/supplement/comparison_graph
 * data, and checks the result against the production-verified rows recorded
 * in expected_native_operations.json.
 *
 * Recomputability is decided per operation *name*, not per bundle-declared
 * `status`: `status` ("native"/"partially_native") is a provenance label the
 * bundle carries for its own reasons (e.g. C1's source_comparison_by_feature
 * is partially_native because its template covers only two of five sources,
 * yet is still fully recomputable for the selected pair). An operation is
 * shown as a recorded control, not an independent recomputation, only when
 * this viewer has no JS path for its name at all — currently just C2's
 * `feature_level_split`, whose expected rows reference claims outside this
 * bundle's comparison scope.
 */
export function runNativeOperations(
    bundle: CasebookBundle,
    claims: CombinedClaim[]
): OperationRunResult[] {
    const sharedBasisPairs = computeSharedBasis(claims);
    const sourceTitles = buildSourceTitleMap(bundle.sources);

    return bundle.nativeOperations.operations.map((definition): OperationRunResult => {
        // Almost every bundle's `expected` is already row-array-shaped; C4's
        // "independent_bases / distinct_textual_bases" instead records one
        // totals object (see NativeOperationDefinition.expected's doc
        // comment) — normalized to a one-element array here so every
        // downstream comparison/UI path only ever sees an array.
        const expectedRows = Array.isArray(definition.expected)
            ? definition.expected
            : [definition.expected];
        const titleEn = operationTitleLabel(
            definition.name,
            definition.title_en ?? humanizeOperationName(definition.name)
        );
        const bundleCaveatEn = definition.caveat_en ?? definition.caveat ?? null;
        const caveatAddition = operationCaveatAddition(definition.name);
        const caveatEn = [bundleCaveatEn, caveatAddition].filter((part): part is string => Boolean(part)).join(" ") || null;

        let computedRows: Array<Record<string, unknown>> | null;
        let sliceTotals: Record<string, unknown> | null = null;

        // C3 ships one `target_comparison_by_feature` template per pair of
        // working addresses in scope, named by a `__<pair>` suffix (e.g.
        // `target_comparison_by_feature__siyi_gaoyang`) rather than one
        // shared operation name — matched here by prefix so the same
        // compute function serves every pair, C1's un-suffixed single-pair
        // name included.
        if (definition.name.startsWith("target_comparison_by_feature")) {
            const targetA = definition.params.target_a as string | undefined;
            const targetB = definition.params.target_b as string | undefined;
            computedRows =
                targetA && targetB
                    ? (computeTargetComparisonByFeature(claims, targetA, targetB) as unknown as Array<
                          Record<string, unknown>
                      >)
                    : null;
            return finalizeOperationResult(definition, titleEn, caveatEn, computedRows, expectedRows, sliceTotals);
        }

        switch (definition.name) {
            case "shared_basis":
                computedRows = sharedBasisPairs as unknown as Array<Record<string, unknown>>;
                break;
            case "independent_bases":
                computedRows = computeIndependentBases(claims) as unknown as Array<
                    Record<string, unknown>
                >;
                sliceTotals = computeIndependentBasesSliceTotals(claims, sharedBasisPairs);
                break;
            // C4's own operation name for this same idea, recorded as a
            // single totals object rather than per-feature rows — see
            // computeDistinctTextualBasesTotals's doc comment.
            case "independent_bases / distinct_textual_bases":
                computedRows = [
                    computeDistinctTextualBasesTotals(claims, sharedBasisPairs) as unknown as Record<
                        string,
                        unknown
                    >,
                ];
                break;
            case "records_by_value":
                computedRows = computeRecordsByValue(claims) as unknown as Array<Record<string, unknown>>;
                break;
            case "source_value_pairs":
                computedRows = computeSourceValuePairs(claims, sourceTitles) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "within_source_divergence":
                computedRows = computeWithinSourceDivergence(claims) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "source_split":
                computedRows = computeSourceSplit(claims, sourceTitles) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "source_comparison_by_feature": {
                const sourceA = definition.params.source_a as string | undefined;
                const sourceB = definition.params.source_b as string | undefined;
                computedRows =
                    sourceA && sourceB
                        ? (computeSourceComparisonByFeature(claims, sourceA, sourceB) as unknown as Array<
                              Record<string, unknown>
                          >)
                        : null;
                break;
            }
            case "contested_cell":
                computedRows = computeContestedCell(claims) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "polarity_value_consistency":
                computedRows = computePolarityValueConsistency(claims) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "source_filter":
                computedRows = computeSourceFilter(claims, sourceTitles) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            case "address_level_by_source":
                computedRows = computeAddressLevelBySource(claims, sourceTitles) as unknown as Array<
                    Record<string, unknown>
                >;
                break;
            default:
                computedRows = null;
        }

        return finalizeOperationResult(definition, titleEn, caveatEn, computedRows, expectedRows, sliceTotals);
    });
}

/**
 * Shared tail of the per-operation switch above: turns a compute
 * function's result (or `null`, when this viewer has no JS path for the
 * operation's name) into the row-for-row verdict against the bundle's
 * production-verified `expected` rows, including the `independent_bases`-
 * only `slice_totals` check.
 */
function finalizeOperationResult(
    definition: NativeOperationDefinition,
    titleEn: string,
    caveatEn: string | null,
    computedRows: Array<Record<string, unknown>> | null,
    expectedRows: Array<Record<string, unknown>>,
    sliceTotals: Record<string, unknown> | null
): OperationRunResult {
    const questionEn = operationQuestionLabel(definition.name, definition.question_en);

    if (computedRows === null) {
        return {
            name: definition.name,
            titleEn,
            questionEn,
            status: definition.status,
            caveatEn,
            recomputed: false,
            computedRows: [],
            expectedRows,
            matchesExpected: true,
            mismatchDetail: null,
            sliceTotals: null,
        };
    }

    const { matches: rowsMatch, detail: rowsDetail } = deepEqualUnordered(computedRows, expectedRows);

    let matches = rowsMatch;
    let detail = rowsDetail;
    if (sliceTotals && definition.slice_totals) {
        const totalsMatch =
            JSON.stringify(sortKeys(sliceTotals)) === JSON.stringify(sortKeys(definition.slice_totals));
        if (!totalsMatch) {
            matches = false;
            detail = `slice_totals differ:\n  computed=${JSON.stringify(sliceTotals)}\n  expected=${JSON.stringify(definition.slice_totals)}`;
        }
    }

    return {
        name: definition.name,
        titleEn,
        questionEn,
        status: definition.status,
        caveatEn,
        recomputed: true,
        computedRows,
        expectedRows,
        matchesExpected: matches,
        mismatchDetail: detail,
        sliceTotals,
    };
}
