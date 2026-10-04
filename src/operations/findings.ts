// Pure executor for a native operation's `finding_vars` recipes (see
// `FindingVarSpec` in src/types/bundle.ts). This is a byte-for-byte port of
// the bundle-build side's own reference implementation —
// `findings_lib.py` in the platform's closed bundle-build tooling
// (`compute_var`/`_matches_where`/`rows_of`/`render_finding`) — so a value
// this viewer shows and the value the bundle-build tooling verified against
// are the same computation, not two independent guesses at the same
// contract. Kept free of React/DOM so it can be unit tested directly.
import type { FindingVarSpec, FindingVarsSpec, WhereClause } from "../types/bundle";

/** Normalizes an operation's `expected` (or this viewer's own freshly
 * recomputed rows) to a row array — mirrors `rows_of` in findings_lib.py.
 * One operation (C4's `independent_bases / distinct_textual_bases`) records
 * a single totals object instead of a row array; treated as a one-row list,
 * the same convention `nativeOperations.ts`'s own `runNativeOperations`
 * already applies before rows reach any UI code. */
export function rowsOf(expected: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(expected)) return expected as Array<Record<string, unknown>>;
    if (expected && typeof expected === "object") return [expected as Record<string, unknown>];
    return [];
}

/** Mirrors `_matches_where`: `where` may be a single {column, equals} clause
 * or a list of clauses (AND). No `where` matches every row. */
function matchesWhere(row: Record<string, unknown>, where: WhereClause | WhereClause[] | undefined): boolean {
    if (!where) return true;
    const clauses = Array.isArray(where) ? where : [where];
    return clauses.every((clause) => row[clause.column] === clause.equals);
}

function collectClaimIds(row: Record<string, unknown>, columns: string[]): string[] {
    const ids: string[] = [];
    for (const column of columns) {
        const value = row[column];
        if (typeof value === "string") {
            ids.push(value);
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === "string") ids.push(item);
            }
        }
    }
    return ids;
}

/** One resolved placeholder value: `text` is what `{name}` in the template
 * substitutes to (mirrors `render_finding`'s `values[name]`, stringified);
 * `anchorGroups`, present only for `anchors_of`, is the per-row grouping of
 * resolved anchors the card renders as chips (one chip-group per
 * contributing row, e.g. a `shared_basis` pair), so the UI can show
 * "K4 · K5, S1 · S2" instead of one flat pile of chips. */
export interface FindingVarResult {
    text: string;
    anchorGroups?: string[][];
}

/**
 * Runs one `finding_vars` recipe against a set of rows — the TS twin of
 * `compute_var`. An op this executor doesn't recognize logs and falls back
 * to an empty string rather than throwing (the Python reference raises,
 * since it only ever runs at bundle-build time against known specs; this
 * viewer runs the same recipes at page-render time against whatever a
 * bundle actually ships, so a future/unrecognized op must degrade
 * gracefully instead of blanking the whole card).
 */
export function computeFindingVar(
    spec: FindingVarSpec,
    expected: unknown,
    claimAnchor: (id: string) => string
): FindingVarResult {
    const rows = rowsOf(expected);

    switch (spec.op) {
        case "count_rows": {
            const count = rows.filter((row) => matchesWhere(row, spec.where)).length;
            return { text: String(count) };
        }

        case "sum": {
            const column = spec.column;
            const total = rows
                .filter((row) => matchesWhere(row, spec.where))
                .reduce((sum, row) => {
                    const value = column ? row[column] : undefined;
                    return sum + (typeof value === "number" ? value : 0);
                }, 0);
            return { text: String(total) };
        }

        case "distinct": {
            const column = spec.column;
            const values = new Set(
                rows
                    .filter((row) => matchesWhere(row, spec.where))
                    .map((row) => (column ? row[column] : undefined))
                    .filter((value): value is string | number => value !== undefined && value !== null)
            );
            return { text: String(values.size) };
        }

        case "list_len": {
            const matches = rows.filter((row) => matchesWhere(row, spec.where));
            if (matches.length === 0) return { text: "0" };
            const value = spec.column ? matches[0][spec.column] : undefined;
            return { text: String(Array.isArray(value) ? value.length : 0) };
        }

        case "anchors_of": {
            const columns = spec.columns ?? [];
            const anchorGroups: string[][] = [];
            const flatAnchors: string[] = [];
            for (const row of rows) {
                if (!matchesWhere(row, spec.where)) continue;
                const ids = collectClaimIds(row, columns);
                const seenInRow = new Set<string>();
                const groupAnchors: string[] = [];
                for (const id of ids) {
                    const anchor = claimAnchor(id);
                    if (seenInRow.has(anchor)) continue;
                    seenInRow.add(anchor);
                    groupAnchors.push(anchor);
                    flatAnchors.push(anchor);
                }
                if (groupAnchors.length > 0) anchorGroups.push(groupAnchors);
            }
            const uniqueSorted = [...new Set(flatAnchors)].sort();
            return {
                text: uniqueSorted.length > 0 ? uniqueSorted.join("/") : "—",
                anchorGroups,
            };
        }

        default:
            console.error(`findings: unrecognized finding_vars op "${(spec as { op: string }).op}"`);
            return { text: "" };
    }
}

/**
 * Resolves every placeholder a finding sentence may reference: the
 * always-available `n_rows` (mirrors `render_finding`'s own
 * `len(rows_of(expected))`) plus whatever named recipes the bundle's own
 * `finding_vars` declares — unlike the earlier draft contract, there is no
 * built-in `{anchors}` here; a bundle that wants an anchors placeholder
 * declares it explicitly (every current bundle does, under the name
 * `anchors`). A recipe that throws is caught and logged rather than
 * breaking the whole card; its value falls back to the literal placeholder
 * text so a broken var is visible, not silently blank.
 */
export function computeFindingVars(
    specs: FindingVarsSpec | undefined,
    expected: unknown,
    claimAnchor: (id: string) => string
): Record<string, FindingVarResult> {
    const out: Record<string, FindingVarResult> = {
        n_rows: { text: String(rowsOf(expected).length) },
    };

    if (specs) {
        for (const [name, spec] of Object.entries(specs)) {
            try {
                out[name] = computeFindingVar(spec, expected, claimAnchor);
            } catch (error) {
                console.error(`findings: failed to compute finding_vars["${name}"]`, error);
                out[name] = { text: `{${name}}` };
            }
        }
    }

    return out;
}

export type FindingToken =
    | { type: "text"; text: string }
    | { type: "var"; text: string; anchorGroups?: string[][] };

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

/**
 * Splits a `finding_en`/`finding_empty_en` template into plain-text and
 * resolved-placeholder tokens the card renders in order — chip groups for
 * an `anchors_of`-shaped var, plain text otherwise. An unresolved
 * placeholder never disappears silently: it renders as its own literal
 * `{name}` text and logs a console error, so a data/template mismatch is
 * visible on the page rather than producing a sentence with a word missing.
 */
export function tokenizeFinding(
    template: string,
    resolved: Record<string, FindingVarResult>
): FindingToken[] {
    const tokens: FindingToken[] = [];
    let lastIndex = 0;
    PLACEHOLDER_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = PLACEHOLDER_PATTERN.exec(template))) {
        if (match.index > lastIndex) {
            tokens.push({ type: "text", text: template.slice(lastIndex, match.index) });
        }
        const name = match[1];
        const value = resolved[name];
        if (value) {
            tokens.push({ type: "var", text: value.text, anchorGroups: value.anchorGroups });
        } else {
            console.error(`findings: unresolved placeholder "{${name}}" in finding template`);
            tokens.push({ type: "text", text: `{${name}}` });
        }
        lastIndex = PLACEHOLDER_PATTERN.lastIndex;
    }

    if (lastIndex < template.length) {
        tokens.push({ type: "text", text: template.slice(lastIndex) });
    }

    return tokens;
}
