// Human-readable label helpers shared by graph, case, and operation views.
// The main body of the viewer (Case/Explore/Operations tabs, graph node
// labels, operation result tables) shows anchors, short feature names,
// author-year source labels and printed pages — never raw claim/evidence/
// chunk/document ids. Those stay in the Evidence panel's "Technical
// identifiers" accordion and the Operations tab's "Show raw rows" accordion.
import type {
    AnnotationRecord,
    AuthorUnitRecord,
    DerivationKind,
    NativeClaimFields,
    OriginMethod,
    ReviewStatus,
    SourceRecord,
} from "../types/bundle";

const FEATURE_SHORT_LABELS: Record<string, string> = {
    CLASSIFICATION_ATLAS2012: "classification",
    CLASSIFICATION_CRITERIA_REPORTED: "criteria",
    METALINGUISTIC_HIERARCHY_LEVEL: "hierarchy level",
    CONS_ASPIRATION_CONTRAST: "aspiration",
    CONS_VOICED_OBSTRUENTS_REPORTED: "voiced obstruents",
    GEOGRAPHY_DISTRIBUTION: "geography",
    TONE_INVENTORY_COUNT: "tone inventory count",
};

export function featureShortLabel(featureId: string): string {
    return FEATURE_SHORT_LABELS[featureId] ?? featureId;
}

/** Family name out of a `library.authors` entry (curator-checked
 * "Family, Given" formatted string) — used for the same short "Family & …"
 * label `sourceShortLabel` builds from `csl_data.author`. Falls back to the
 * whole string when it carries no comma (a family-name-only entry). */
function familyNameFromLibraryAuthor(author: string): string {
    const commaIndex = author.indexOf(",");
    return commaIndex === -1 ? author : author.slice(0, commaIndex).trim();
}

/** Source's publication year, preferring the curator-checked
 * `library.publication_year` over `csl_data.issued` (see
 * `SourceLibraryRecord`; `library` is absent in bundles from before this
 * field was added, so this always has a `csl_data` fallback). */
export function sourceYear(source: SourceRecord): number | undefined {
    return source.library?.publication_year ?? source.csl_data.issued?.["date-parts"]?.[0]?.[0] ?? undefined;
}

/** Author-year label for a source, e.g. "Zhang & Zhuang 2008", preferring
 * the curator-checked `library.authors` over `csl_data.author`, and falling
 * back to a shortened title when neither carries a structured author list. */
export function sourceShortLabel(source: SourceRecord): string {
    const familyNames =
        source.library?.authors && source.library.authors.length > 0
            ? source.library.authors.map(familyNameFromLibraryAuthor)
            : (source.csl_data.author ?? []).map((a) => a.family).filter((name): name is string => Boolean(name));
    const year = sourceYear(source);

    let authorPart: string;
    if (familyNames.length === 0) {
        authorPart = source.title.length > 28 ? `${source.title.slice(0, 28)}…` : source.title;
    } else if (familyNames.length === 1) {
        authorPart = familyNames[0];
    } else if (familyNames.length === 2) {
        authorPart = `${familyNames[0]} & ${familyNames[1]}`;
    } else {
        authorPart = `${familyNames[0]} et al.`;
    }

    return year ? `${authorPart} ${year}` : authorPart;
}

/** Full author list for the Evidence panel's Source section, preferring the
 * curator-checked `library.authors` ("Family, Given" strings, joined as
 * "Family Given" to match the `csl_data.author` fallback's own word order;
 * more than three authors abbreviate to the first three plus "et al."),
 * then `csl_data.author` ({given, family}), then the flat `csl_data.authors`
 * string list some bundles also carry. */
export function sourceAuthorsDisplay(source: SourceRecord): string {
    if (source.library?.authors && source.library.authors.length > 0) {
        const names = source.library.authors.map((author) => {
            const commaIndex = author.indexOf(",");
            if (commaIndex === -1) return author.trim();
            const family = author.slice(0, commaIndex).trim();
            const given = author.slice(commaIndex + 1).trim();
            return given ? `${given} ${family}` : family;
        });
        return names.length > 3 ? `${names.slice(0, 3).join("; ")}; et al.` : names.join("; ");
    }
    const structured = source.csl_data.author
        ?.map((a) => [a.given, a.family].filter(Boolean).join(" "))
        .filter(Boolean);
    if (structured && structured.length > 0) {
        return structured.length > 3 ? `${structured.slice(0, 3).join("; ")}; et al.` : structured.join("; ");
    }
    if (source.csl_data.authors && source.csl_data.authors.length > 0) {
        const authors = source.csl_data.authors;
        return authors.length > 3 ? `${authors.slice(0, 3).join("; ")}; et al.` : authors.join("; ");
    }
    return "—";
}

/** Printed page (or range) for a claim/supplement annotation, unifying the
 * single printed_page field (C1, C2 core) and the printed_page_start/end
 * range (C2 supplement). */
export function printedPageLabel(annotation: AnnotationRecord): string {
    if (annotation.printed_page) return annotation.printed_page;
    if (annotation.printed_page_start) {
        return annotation.printed_page_start === annotation.printed_page_end
            ? annotation.printed_page_start
            : `${annotation.printed_page_start}–${annotation.printed_page_end}`;
    }
    return "—";
}

/** The curated role/position label for an annotation, unifying C2's `role`
 * and C1's `role_en`/`position_en`. */
export function roleLabel(annotation: AnnotationRecord): string {
    return annotation.role_en ?? annotation.role ?? annotation.position_en ?? "—";
}

/** `shared_basis` → `Shared basis`: fallback title for bundles without `title_en`. */
export function humanizeOperationName(name: string): string {
    const words = name.split("_").filter(Boolean);
    if (words.length === 0) return name;
    return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

/**
 * Fixed display overrides for specific operations, applied regardless of
 * whatever `title_en`/`question_en` the bundle's own recorded data carries.
 * `independent_bases`'s bundle-recorded wording ("Independent Bases" /
 * "independent textual bases") reads as a claim of scholarly independence
 * this count never establishes — it is a count of distinct textual passages
 * (after merging ones that overlap) and distinct source documents behind a
 * slice, nothing more. The operation's underlying computation (recorded
 * Cypher, `expected` rows, `slice_totals`) is unchanged; only how this
 * viewer names and asks about it changes.
 */
const OPERATION_TITLE_OVERRIDES: Record<string, string> = {
    independent_bases: "Distinct Textual Bases",
};

const OPERATION_QUESTION_OVERRIDES: Record<string, string> = {
    independent_bases:
        "How many distinct textual passages (after merging overlapping ones) and how many source documents stand behind the slice and behind each feature category?",
};

/** Appended to whatever caveat text (if any) the bundle itself carries for
 * the operation — never replaces a bundle's own caveat, since that caveat
 * may record other, operation-specific caveats this override doesn't know
 * about. */
const OPERATION_CAVEAT_ADDITIONS: Record<string, string> = {
    independent_bases: "Distinct passages and documents do not establish independence of the underlying research.",
};

/** Display title for a native operation, overriding the bundle-recorded
 * `title_en`/humanized-name fallback for operations whose recorded wording
 * this viewer intentionally rephrases (see `OPERATION_TITLE_OVERRIDES`). */
export function operationTitleLabel(name: string, fallbackTitle: string): string {
    return OPERATION_TITLE_OVERRIDES[name] ?? fallbackTitle;
}

/** Display question for a native operation, same override convention as
 * `operationTitleLabel`. */
export function operationQuestionLabel(name: string, fallbackQuestion: string): string {
    return OPERATION_QUESTION_OVERRIDES[name] ?? fallbackQuestion;
}

/** Extra caveat text this viewer always shows for an operation, in addition
 * to (not instead of) any caveat the bundle itself records. `null` when this
 * operation has no such addition. */
export function operationCaveatAddition(name: string): string | null {
    return OPERATION_CAVEAT_ADDITIONS[name] ?? null;
}

const ORIGIN_KIND_LABELS: Record<string, string> = {
    curated_annotation: "Editorial note",
    native_export: "From graph",
    computed_view: "Computed",
};

/** Raw `sources.json` `annotation.rights` values seen in current bundles,
 * predating the project's 2026-09-20 rights decision (code MIT, curated
 * content CC BY 4.0, quotations under the quotation exception — see
 * LICENSE, LICENSE-CC-BY, LICENSING.md, NOTICE.md) — every one of them, in substance,
 * meant "this source's full text is not redistributed", which is exactly
 * what the quotation-exception framing says. New bundles may instead carry
 * the literal `"quoted_under_quotation_exception; full text not
 * redistributed"` value directly; both map to the same reader-facing text. */
const KNOWN_NOT_REDISTRIBUTED_RIGHTS = new Set([
    "not_cleared_for_public_redistribution",
    "internal_only; no redistribution license assigned to source text",
    "quoted_under_quotation_exception; full text not redistributed",
]);

/** Human-readable label for a source's `annotation.rights` field — never
 * shows the raw machine-readable value to a reader. Falls back to the raw
 * value only for a rights string this viewer does not yet recognize (so an
 * unexpected future value is visible rather than silently mislabeled). */
export function sourceRightsLabel(rights: string): string {
    if (KNOWN_NOT_REDISTRIBUTED_RIGHTS.has(rights)) {
        return "Quoted under the quotation exception; full text not redistributed";
    }
    return rights;
}

/** Human-readable label for a bundle's `origin_kind` provenance tag —
 * the internal jargon (`curated_annotation`, `native_export`,
 * `computed_view`) never reaches the reader-facing UI directly. */
export function originKindLabel(originKind: string): string {
    return ORIGIN_KIND_LABELS[originKind] ?? originKind;
}

/** Human-readable label for a native operation's `status`. Only
 * `partially_native` gets a plain-English rewrite; `native` is already an
 * ordinary English word and stays as-is. */
export function operationStatusLabel(status: string): string {
    if (status === "partially_native") return "Partial: computed for the selected pair";
    return status;
}

const ORIGIN_METHOD_LABELS: Record<OriginMethod, string> = {
    native_export: "Platform record",
    computed_view: "Computed view",
    model_extracted: "Extracted by model",
    editor_written: "Editorial note",
};

/** Human-readable label for an annotation's `origin_method` — the
 * finer-grained provenance tag (see `OriginMethod`) that some newer
 * bundles carry instead of, or alongside, `origin_kind`. Never call this
 * with `origin_kind`: a `model_extracted` label must never be described as
 * "editorial"/manually curated when the content actually came from a
 * model. */
export function originMethodLabel(originMethod: OriginMethod): string {
    return ORIGIN_METHOD_LABELS[originMethod];
}

const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
    unreviewed: "Not yet expert-reviewed",
    expert_reviewed: "Expert-reviewed",
};

/** Human-readable label for an annotation's `review_status`, shown as its
 * own small badge next to the `origin_method` label — review state is
 * orthogonal to how the content was produced. */
export function reviewStatusLabel(reviewStatus: ReviewStatus): string {
    return REVIEW_STATUS_LABELS[reviewStatus];
}

/** Section hint shown above an annotation's editorial fields, worded to
 * match how the content was actually produced (`origin_method`) rather than
 * unconditionally calling it editors' own work. Falls back to the original,
 * `origin_kind`-based wording when a bundle doesn't carry `origin_method`
 * yet. */
export function annotationProvenanceHint(originMethod: OriginMethod | undefined): string {
    switch (originMethod) {
        case "native_export":
            return "Fields exported directly from the native graph; not an editorial addition.";
        case "computed_view":
            return "Fields computed from native graph data; native graph fields above are untouched.";
        case "model_extracted":
            return "Fields produced by an automated extraction model; native graph fields above are untouched.";
        case "editor_written":
        case undefined:
            return "Labels added by the editors; native graph fields above are untouched.";
        default:
            return "Labels added by the editors; native graph fields above are untouched.";
    }
}

const DERIVATION_LABELS: Record<DerivationKind, string> = {
    derived_from_schemes_layer: "Derived from source scheme records",
    editor_inferred_from_boundary_description: "Editor's reading of a boundary description",
    editor_written: "Editorial",
};

/** Human-readable label for a curated table row's `derivation` — how the
 * row's content was arrived at (see `DerivationKind`). */
export function derivationLabel(derivation: DerivationKind): string {
    return DERIVATION_LABELS[derivation];
}

const COMPARABILITY_LABELS: Record<string, string> = {
    comparable_at_pian_level: "Comparable at the pian level",
    comparable_at_pian_level_as_a_proposal: "Comparable at the pian level (proposed)",
    comparable_at_pian_level_with_different_extent: "Comparable at the pian level, with different extent",
    not_comparable_without_curator_decision: "Not comparable without a curator decision",
    reported_only: "Reported only",
};

/** Reader-facing label for the Positions table's editorial comparability
 * judgement. Unknown values stay visible instead of being silently hidden. */
export function comparabilityLabel(comparability: string): string {
    return COMPARABILITY_LABELS[comparability] ?? comparability;
}

/**
 * "Unit as named by the author: 兩陽片 (片)" — or, when the source
 * attributes the naming to a third party, "...as attributed to 熊正辉 1987
 * by this source." `scheme_record` (the raw registry key) and `basis`
 * intentionally stay out of this display string; they belong in the
 * technical-identifiers accordion only.
 */
/** Short form for a list of several units under one shared heading:
 * "兩陽片 (片)" or "高陽片 (片) — as attributed to 熊正辉 1987 by this source". */
export function authorUnitShortDisplay(unit: AuthorUnitRecord): string {
    const rankSuffix = unit.rank_as_written ? ` (${unit.rank_as_written})` : "";
    const base = `${unit.unit_as_written}${rankSuffix}`;
    return unit.attributed_to ? `${base} — as attributed to ${unit.attributed_to} by this source` : base;
}

export function authorUnitDisplay(unit: AuthorUnitRecord): string {
    const rankSuffix = unit.rank_as_written ? ` (${unit.rank_as_written})` : "";
    const base = `Unit as named by the author: ${unit.unit_as_written}${rankSuffix}`;
    return unit.attributed_to ? `${base}, as attributed to ${unit.attributed_to} by this source` : base;
}

/**
 * English wording for C4's curated `basis_review_class` (A/B/C), hardcoded
 * in this viewer rather than read from bundle data: the bundle's own gloss
 * (`annotation.basis_review_class_meaning`) exists only in the editors'
 * working language with no English twin, so the public-projection sanitizer strips it on import (see
 * the bundle's PUBLIC_EXPORT.json). This is a translation of the same fixed classification
 * vocabulary the bundle's own MANIFEST already documents (A = number
 * and evidential basis both correct; B = number matches the author's own
 * account but the attached basis is not; C = artifact of extraction or
 * chunking), not a guess at what a given row means.
 */
const BASIS_REVIEW_CLASS_LABELS: Record<"A" | "B" | "C", string> = {
    A: "A — number and evidential basis both correct",
    B: "B — number matches the author's own account, but the attached basis is not correct",
    C: "C — artifact of extraction or chunking",
};

export function basisReviewClassLabel(basisReviewClass: "A" | "B" | "C"): string {
    return BASIS_REVIEW_CLASS_LABELS[basisReviewClass];
}

/**
 * "scan 216–217 / printed 97–98" — C4's own page locator, built from native
 * chunk fields (`chunk_page_start`/`chunk_page_end`, the PDF's own physical
 * page index, and `runtime_page_labels`, the recovered printed pagination)
 * rather than a curated `annotation.printed_page*` field: C1–C3 compute
 * that curated field at bundle-build time, but C4's native export carries
 * both page systems directly. Returns "—" when the claim carries neither.
 */
export function nativePageLabel(native: NativeClaimFields): string {
    const scanRange =
        typeof native.chunk_page_start === "number"
            ? native.chunk_page_start === native.chunk_page_end
                ? `${native.chunk_page_start}`
                : `${native.chunk_page_start}–${native.chunk_page_end}`
            : null;
    const printedStart = native.runtime_page_labels?.page_label_start ?? null;
    const printedEnd = native.runtime_page_labels?.page_label_end ?? null;
    const printedRange = printedStart
        ? printedStart === printedEnd
            ? printedStart
            : `${printedStart}–${printedEnd}`
        : null;

    if (scanRange && printedRange) return `scan ${scanRange} / printed ${printedRange}`;
    if (scanRange) return `scan ${scanRange}`;
    if (printedRange) return `printed ${printedRange}`;
    return "—";
}

/** Human-readable locality label (idiom_tag) instead of the raw graph tag,
 * across all four bundles, not only C4. An unknown tag is shown as is
 * (Title Case would break Chinese characters, so the fallback is the raw tag). */
const LOCALITY_LABELS: Record<string, string> = {
    CANTONESE_STD: "Guangzhou 广州 (standard Cantonese)",
    TAISHAN: "Taishan 台山",
    XINYI: "Xinyi 信宜",
    LIANZHOU_BEIHAI: "Lianzhou–Beihai 廉州–北海",
    GAOLEI_PIAN: "Gaolei 高雷片",
    YUE_GAOHUA: "Gaohua 高化片",
};

export function localityLabel(tag: string): string {
    return LOCALITY_LABELS[tag] ?? tag;
}

/** Human-readable label for a working address (`native.target`): a 片 or
 * group name rather than the graph's technical identifier. Keys are collected
 * across all four bundles; an unknown target is shown as is. */
const TARGET_LABELS: Record<string, string> = {
    YUE: "Yue 粤语 (group)",
    YUE_GUANGFU: "Guangfu 广府片",
    YUE_SIYI: "Siyi 四邑片",
    YUE_GAOYANG: "Gaoyang 高阳片",
    YUE_WUHUA: "Wuhua 吴化片",
    YUE_GOULOU: "Goulou 勾漏片",
    YUE_YONGXUN: "Yongxun 邕浔片",
    YUE_QINLIAN: "Qinlian 钦廉片",
};

export function targetLabel(target: string): string {
    return TARGET_LABELS[target] ?? target;
}

/** Reader-facing word for a claim's `polarity`, instead of the raw graph
 * enum value ("stated" vs. "stated as absent" reads plainly for a claim
 * that records a feature's presence/absence; "uncertain" is already plain
 * English and is left untouched). */
const POLARITY_LABELS: Record<string, string> = {
    attested: "stated",
    not_attested: "stated as absent",
};

export function polarityLabel(polarity: string): string {
    return POLARITY_LABELS[polarity] ?? polarity;
}

/**
 * Reader-facing label for a C4 passport row's `annotation.link_method` — how
 * (if at all) the row was matched to a record group in this graph slice.
 * `undefined` (a bundle from before this field was added) is treated the
 * same as `"none"`.
 */
const PASSPORT_LINK_METHOD_LABELS: Record<"by_locality_tag" | "by_subgroup_address" | "none", string> = {
    by_locality_tag: "found by locality tag",
    by_subgroup_address: "found via subgroup address",
    none: "no matching record in the graph",
};

export function passportLinkMethodLabel(linkMethod: "by_locality_tag" | "by_subgroup_address" | "none" | undefined): string {
    return PASSPORT_LINK_METHOD_LABELS[linkMethod ?? "none"];
}
