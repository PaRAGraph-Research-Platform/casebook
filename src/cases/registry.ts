import { loadC1Bundle, loadC2Bundle, loadC3Bundle, loadC4Bundle } from "../data/loadBundle";
import type { CasebookBundle } from "../types/bundle";

/**
 * Everything that varies between case bundles and that the generic
 * store/UI layer needs to know to render a given case correctly, without
 * hardcoding case identity anywhere below this module. Adding a new case
 * means: import its bundle in loadBundle.ts, add one entry here.
 */
export interface CaseDefinition {
    id: string;
    /** Short id shown in the case switcher, e.g. "C1". */
    shortLabel: string;
    title: string;
    /** One-line pointer to the Sinitic material behind the case's general
     * KG/LLM problem framing (e.g. "Case material: Lianzhou 廉州 Yue (Hepu,
     * Beihai, Guangxi)"), shown modestly under `title` in the case switcher. */
    subtitle: string;
    dataVersion: string;
    /** Matches this case's anchor tokens inside rendered CASE_EN.md HTML
     * (e.g. C2: K1–K5/S1–S4; C1: A1–A2/B1–B2/C1–C3/D1–D2/S1–S5). A
     * negative lookahead excludes a token immediately followed by a period
     * (guards against matching a case's own title, e.g. "C1." at the start
     * of C1's CASE_EN.md, as an anchor link). */
    anchorPattern: RegExp;
    /** C2-specific: whether to show the "include curated context" toggle
     * that distinguishes native-locality claims from one curated,
     * null-native-locality record (S4). Meaningless for cases (like C1)
     * where a null locality is the norm rather than a curation flag. */
    hasCuratedContextToggle: boolean;
    /** Whether this case has more than one working target/address, and so
     * benefits from an Explore-tab target filter and a target_comparison_by_feature
     * operation (C1). */
    hasTargetFilter: boolean;
    /** Whether this case ships a curated positions_table.json (C1) worth
     * showing as its own Positions view. */
    hasPositionsView: boolean;
    /** Whether this case ships a curated levels_table.json (C3) worth
     * showing as its own Levels view (two level schemes side by side). */
    hasLevelsView: boolean;
    /** Whether this case has more than one working locality (idiom_tag) and
     * so benefits from an Explore-tab locality filter (C4). Distinct from
     * `hasTargetFilter`: C4's main comparison axis is which idiom/locality
     * describes a record, not which working address it attaches to (all 65
     * records share one feature and attach to one of three narrow
     * addresses that mirror the locality one-for-one). */
    hasLocalityFilter: boolean;
    /** Whether this case ships curated tone passports (passports.json) worth
     * showing as its own Passport view (C4). */
    hasPassportView: boolean;
    /** Whether this case ships a computed technical-pair register
     * (pairs_table.json) worth an Operations-tab "records vs. pairs" toggle
     * and majority-count block (C4). */
    hasPairsToggle: boolean;
    loadBundle: () => CasebookBundle;
}

const c2Case: CaseDefinition = {
    id: "c2",
    shortLabel: "C2",
    title: "C2 — Same variety, new evidence: when a classification changes",
    subtitle: "Case material: Lianzhou 廉州 Yue (Hepu, Beihai, Guangxi)",
    dataVersion: "c2-internal-0.3",
    anchorPattern: /\b(K[1-5]|S[1-4])\b(?!\.)/g,
    hasCuratedContextToggle: true,
    hasTargetFilter: false,
    hasPositionsView: false,
    hasLevelsView: false,
    hasLocalityFilter: false,
    hasPassportView: false,
    hasPairsToggle: false,
    loadBundle: loadC2Bundle,
};

const c1Case: CaseDefinition = {
    id: "c1",
    shortLabel: "C1",
    title: "C1 — One territory, four partitions: a shared index is not a shared unit",
    subtitle: "Case material: Yue dialects of south-western Guangdong",
    dataVersion: "c1-internal-0.2",
    anchorPattern: /\b(A[1-2]|B[1-2]|C[1-3]|D[1-2]|S[1-5])\b(?!\.)/g,
    hasCuratedContextToggle: false,
    hasTargetFilter: true,
    hasPositionsView: true,
    hasLevelsView: false,
    hasLocalityFilter: false,
    hasPassportView: false,
    hasPairsToggle: false,
    loadBundle: loadC1Bundle,
};

const c3Case: CaseDefinition = {
    id: "c3",
    shortLabel: "C3",
    title: "C3 — Same names, different depths: aligning hierarchies of unequal rank",
    subtitle: "Case material: Siyi–Liangyang and the Yue branches of the Language Atlas of China",
    dataVersion: "c3-internal-0.2",
    // C3's CASE_EN.md anchor tokens: A1–A3, Y1–Y4, H1–H2, K1–K2, S1–S10. A
    // plain character class can't express the two-digit S10 alongside
    // single-digit S1–S9, so S10 is matched as its own alternative (and
    // listed before S[1-9] so the alternation doesn't stop at "S1" inside
    // "S10").
    anchorPattern: /\b(A[1-3]|Y[1-4]|H[1-2]|K[1-2]|S10|S[1-9])\b(?!\.)/g,
    hasCuratedContextToggle: false,
    hasTargetFilter: true,
    hasPositionsView: false,
    hasLevelsView: true,
    hasLocalityFilter: false,
    hasPassportView: false,
    hasPairsToggle: false,
    loadBundle: loadC3Bundle,
};

const c4Case: CaseDefinition = {
    id: "c4",
    shortLabel: "C4",
    title: "C4 — Same field, different units: when numbers are not comparable",
    subtitle: "Case material: tone inventories of Guangzhou, Taishan and Xinyi",
    dataVersion: "c4-internal-0.1",
    // C4's CASE_EN.md anchor tokens are G1–G9 (Guangzhou/CANTONESE_STD),
    // T1–T27 (Taishan), X1–X29 (Xinyi) — one letter per working locality,
    // one to two digits.
    anchorPattern: /\b([GTX]\d{1,2})\b(?!\.)/g,
    hasCuratedContextToggle: false,
    hasTargetFilter: false,
    hasPositionsView: false,
    hasLevelsView: false,
    hasLocalityFilter: true,
    hasPassportView: true,
    hasPairsToggle: true,
    loadBundle: loadC4Bundle,
};

/** Case order keeps C1 as the starting case. C4, which has its own passport view,
 * comes last; the set of available tabs does not determine publication status. */
export const CASES: CaseDefinition[] = [c1Case, c2Case, c3Case, c4Case];

export function getCaseDefinition(id: string): CaseDefinition {
    const found = CASES.find((c) => c.id === id);
    if (!found) {
        throw new Error(`Unknown case id: ${id}`);
    }
    return found;
}
