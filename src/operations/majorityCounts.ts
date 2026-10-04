import type { CombinedClaim } from "./combinedClaims";

/** One bar in the "What does the majority say?" block: a reported value and
 * how many records/pairs carry it, for a chosen locality and basis_review_class
 * filter. */
export interface ValueCount {
    value: string;
    count: number;
}

/** Sorts by count descending, then by value ascending for a stable order
 * among ties (e.g. Taishan's three-way tie at one pair each for values
 * "5"/"6"/"10" — this decides the on-screen order, not which one "wins"). */
function sortDesc(counts: Map<string, number>): ValueCount[] {
    return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

function inScope(
    claim: CombinedClaim,
    idiomTag: string,
    allowedClasses: ReadonlySet<string>
): boolean {
    if (claim.native.locality !== idiomTag) return false;
    const basisClass = claim.annotation.basis_review_class;
    return typeof basisClass === "string" && allowedClasses.has(basisClass);
}

/**
 * "Counting records" column: how many of the locality's records (after the
 * basis_review_class filter) report each value — mirrors
 * `computeRecordsByValue` in nativeOperations.ts, restricted to one
 * locality and, additionally, the chosen A/B/C review classes (a UI-only
 * filter the native `records_by_value` operation itself does not apply).
 */
export function countRecordsByValue(
    claims: CombinedClaim[],
    idiomTag: string,
    allowedClasses: ReadonlySet<string>
): ValueCount[] {
    const counts = new Map<string, number>();
    for (const claim of claims) {
        if (!inScope(claim, idiomTag, allowedClasses)) continue;
        counts.set(claim.native.value, (counts.get(claim.native.value) ?? 0) + 1);
    }
    return sortDesc(counts);
}

/**
 * "Counting source–value pairs" column: how many distinct technical pairs
 * (idiom_tag + document + value groups, `annotation.pair_id`) report each
 * value — a pair counts once regardless of how many records it groups, so
 * this is not the same ranking as `countRecordsByValue` (e.g. Xinyi: value 6
 * leads by record count with 15 records, but value 8 leads by pair count
 * with 3 pairs against 6's single pair — a dictionary's repeated headers
 * inflate the record count without adding pairs).
 */
export function countPairsByValue(
    claims: CombinedClaim[],
    idiomTag: string,
    allowedClasses: ReadonlySet<string>
): ValueCount[] {
    const byValue = new Map<string, Set<string>>();
    for (const claim of claims) {
        if (!inScope(claim, idiomTag, allowedClasses)) continue;
        const pairId = claim.annotation.pair_id;
        if (typeof pairId !== "string") continue;
        const set = byValue.get(claim.native.value) ?? new Set<string>();
        set.add(pairId);
        byValue.set(claim.native.value, set);
    }
    const counts = new Map<string, number>();
    for (const [value, pairIds] of byValue) {
        counts.set(value, pairIds.size);
    }
    return sortDesc(counts);
}
