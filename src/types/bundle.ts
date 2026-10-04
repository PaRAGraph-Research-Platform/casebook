// Shape of a casebook bundle as produced by the PaRAGraph platform's
// case-export pipeline, after the public projection the platform applies
// before the data reaches this repository. These types describe only the fields the viewer
// reads; the underlying JSON may carry additional fields we intentionally
// ignore, and different case bundles fill in different optional subsets
// (see src/cases/registry.ts for what varies between C1 and C2).

export type OriginKind = "native_export" | "curated_annotation";

/** How an annotation's content was actually produced — a finer-grained,
 * optional replacement for `origin_kind`'s coarse native/curated split.
 * Not every bundle carries it yet; when absent, the viewer falls back to
 * `origin_kind`-based labelling (see `originKindLabel`/`originMethodLabel`
 * in utils/labels.ts). */
export type OriginMethod = "native_export" | "computed_view" | "model_extracted" | "editor_written";

/** Whether a human expert has reviewed an annotation carrying `origin_method`
 * — distinct from `origin_method` itself: a `model_extracted` label can be
 * `unreviewed` or `expert_reviewed`. Optional; absent in bundles that don't
 * yet track it. */
export type ReviewStatus = "unreviewed" | "expert_reviewed";

/**
 * How a source itself names and ranks a linguistic unit, kept apart from
 * this bundle's own working-address vocabulary: `unit_as_written` and
 * `rank_as_written` are the source's own wording; `attributed_to`, when not
 * null, names a third party this source says first proposed the unit
 * (rather than the source's own claim); `scheme_record` is the raw
 * scheme/registry key (technical, accordion-only); `basis` is a short note
 * on what kind of evidence backs the naming (e.g. a boundary description
 * vs. an explicit list).
 */
export interface AuthorUnitRecord {
    unit_as_written: string;
    rank_as_written?: string | null;
    attributed_to?: string | null;
    scheme_record?: string | null;
    basis?: string | null;
}

export type GraphNodeType = "Claim" | "Evidence" | "Feature" | "Source" | "Subgroup" | "Group";

export type GraphEdgeType =
    | "ABOUT_FEATURE"
    | "ABOUT_SUBGROUP"
    | "ABOUT_GROUP"
    | "SUPPORTS"
    | "HAS_EVIDENCE";

export interface GraphNodeRecord {
    id: string;
    type: GraphNodeType;
    origin_kind: OriginKind;
    title?: string;
}

export interface GraphEdgeRecord {
    source: string;
    type: GraphEdgeType;
    target: string;
    origin_kind: OriginKind;
}

export interface GraphBundle {
    nodes: GraphNodeRecord[];
    edges: GraphEdgeRecord[];
    note?: string;
}

/** C4-only: a chunk's own printed-vs-scan page labelling, exported straight
 * from the ingestion pipeline's page-label recovery (not a curated field —
 * see docs/ingestion_metadata.md in the closed platform). Absent on bundles
 * that don't carry it (C1–C3, whose `annotation.printed_page*` is already a
 * curated field computed at bundle-build time instead). */
export interface RuntimePageLabels {
    page_label_display?: string | null;
    page_label_confidence?: string | null;
    page_label_method?: string | null;
    page_label_start?: string | null;
    page_label_end?: string | null;
}

export interface NativeClaimFields {
    claim_id: string;
    status: string;
    locality: string | null;
    feature: string;
    target: string;
    target_relationship: string;
    value: string;
    conditions: string | null;
    polarity: "attested" | "not_attested" | "uncertain";
    evidence_id: string;
    chunk_id: string;
    quote?: string;
    document_id: string;
    source_title?: string;
    evidence_page?: number | null;
    start_char?: number;
    end_char?: number;
    /** Public-projection quotation trimming ("trimmed_quotation" rule applied
     * upstream): a small set of table-derived quotes (long
     * Atlas/dialect-survey table fragments) are shipped alongside a shorter
     * `public_quote`/`public_context_segments` pair that carries only the
     * span bearing the claim's actual statement. Upstream swaps `quote`/
     * `context_segments` for these and deletes the `public_*` fields, so a
     * bundle that has already gone through public projection never carries
     * both — these three are only ever seen before projection (e.g. in a
     * test fixture), never by the running app. */
    public_quote?: string;
    public_context_segments?: ContextSegment[];
    public_trimmed?: boolean;
    public_trim_note_en?: string;
    /** C4-only native fields — the chunk's own section title, its PDF-index
     * ("scan") page range, the recovered printed-page range, and the
     * curated context segments that back the quote (C1–C3 keep the segments
     * under `annotation.context_segments` instead; C4 exports them as a
     * native chunk field). */
    evidence_type?: string;
    chunk_section_title?: string | null;
    chunk_page_start?: number | null;
    chunk_page_end?: number | null;
    runtime_page_labels?: RuntimePageLabels | null;
    context_segments?: ContextSegment[];
}

export interface ContextSegment {
    id: string;
    chunk_id: string;
    segment_order: number;
    segment_type: string;
    source_block_order: number | null;
    page: number | null;
    start_char: number;
    end_char: number;
    text: string;
}

/**
 * Curated annotation attached to a native claim. C2's core/supplement records
 * use slightly different field sets (single physical_page vs a
 * physical_page_start/end range; role vs position/role_en), and C1 uses a
 * third, uniform shape (position/role_en/note_ru/page_method/...) for both
 * core and supplement. Rather than keep per-case interfaces in sync by hand,
 * this is one flexible shape covering every field any case bundle uses; a
 * given record only populates the subset its own bundle emits.
 */
export interface AnnotationRecord {
    origin_kind: OriginKind;
    anchor: string;
    role?: string;
    role_en?: string;
    position?: string;
    position_en?: string;
    semantic_review?: string;
    /** C3-only: which level scheme this claim belongs to (`SCH_ATLAS` /
     * `SCH_YH` / `SCH_CROSS`), keyed the same way as
     * `LevelsTableBundle.schemes_en`. */
    scheme?: string;
    scheme_en?: string;
    physical_page?: number;
    physical_page_start?: number;
    physical_page_end?: number;
    printed_page?: string;
    printed_page_start?: string;
    printed_page_end?: string;
    locator_method?: string;
    page_method?: string;
    page_confidence?: string;
    page_note?: string;
    applies_to_locality?: string | null;
    applicability_kind?: string;
    context_chunk_id?: string;
    context_segments?: ContextSegment[];
    table_context?: unknown;
    public_preview_status?: string;
    scope_note?: string;
    /** Optional, finer-grained provenance pair (see `OriginMethod`/
     * `ReviewStatus`) that some newer bundles carry alongside `origin_kind`.
     * Absent in bundles that don't track it yet. */
    origin_method?: OriginMethod;
    review_status?: ReviewStatus;
    /** Free-text note from a human verifier about this specific claim,
     * shown alongside the claim's statement in the Evidence panel and the
     * Anchor index. */
    verifier_note_en?: string | null;
    /** Single source-as-written unit naming (most annotations); some
     * carry several (`author_units`) when a source names the same claim's
     * scope more than one way. */
    author_unit?: AuthorUnitRecord | null;
    author_units?: AuthorUnitRecord[] | null;
    /** C4-only: which of the 17 technical (idiom_tag + document + value)
     * groups this record was computed into — see `PairsTableBundle` — and
     * the curator's A/B/C review of whether its number and its evidential
     * basis are both sound. `basis_review_class_meaning` (the bundle's own
     * Russian gloss of A/B/C) has no English twin and is stripped by the
     * public-projection sanitizer; `basisReviewClassLabel()` in utils/labels.ts
     * carries the English wording instead, hardcoded in this viewer's own
     * copy rather than bundle data. */
    pair_id?: string;
    basis_review_class?: "A" | "B" | "C";
    /** Set by the upstream "trimmed_quotation" projection rule when this
     * record's `native.quote`/`context_segments` were replaced by its
     * shorter `public_quote`/`public_context_segments` before publication
     * — a small set of long table-derived quotes (Atlas / dialect-
     * survey table fragments) shipped in full internally, abridged to the
     * span bearing the actual statement for public projection. */
    quote_trimmed?: boolean;
    quote_trim_note_en?: string;
    [key: string]: unknown;
}

/** One row of C4's computed pairs_table.json: a reproducible grouping of
 * records by (idiom_tag, document, value) — a technical convenience, not a
 * claim about independent scholarly analyses (see `count_independent_analyses`
 * in ExpectedNativeOperationsBundle.not_applicable). */
export interface PairsTableRow {
    pair_id: string;
    idiom_tag: string;
    source: string;
    document_id: string;
    value: string;
    n_records: number;
    record_ids: string[];
    anchors: string[];
    historical_classes: Record<string, number>;
    basis_note?: string;
    basis_note_en?: string;
}

export type PairsTableBundle = PairsTableRow[];

/** C4-only: a curated tone-passport entry (passports.json), transcribed by
 * hand from a supplied source passport — not a native graph export, and not
 * every field survives the public-projection sanitizer (most of this
 * bundle's descriptive columns are Russian-only prose with no English twin;
 * the bundle's PUBLIC_EXPORT.json lists exactly which fields were stripped). A row is
 * "linked" when `annotation.claim_ids` is non-empty. */
/** How a passport row's `claim_ids`/`anchors` were resolved against the
 * graph slice: by the record group's own native locality tag (idiom_tag),
 * by falling back to the narrower subgroup working-address a record group
 * carries when it has no locality tag at all, or not resolved at all — see
 * `PassportView`'s per-method reader-facing label. */
export type PassportLinkMethod = "by_locality_tag" | "by_subgroup_address" | "none";

export interface PassportEntryAnnotation {
    origin_kind: OriginKind;
    attributed_to: string;
    review_date: string;
    interpretation_layer: string;
    claim_ids: string[];
    anchors: string[];
    linked_claim_note?: string;
    /** Absent in bundles from before this field was added; a row with no
     * `link_method` is treated the same as `"none"` (see `PassportView`). */
    link_method?: PassportLinkMethod;
}

export interface PassportEntry {
    entry_id: string;
    source_attribution?: string;
    counting_unit?: string;
    count_expression?: string;
    checked_tone_treatment?: string;
    contested_category?: string;
    evidence_type?: string;
    locator?: string;
    source_attribution_en?: string;
    counting_unit_en?: string;
    count_expression_en?: string;
    checked_tone_treatment_en?: string;
    contested_category_en?: string;
    evidence_type_en?: string;
    locator_en?: string;
    annotation: PassportEntryAnnotation;
}

export interface PassportIdiomBundle {
    idiom_tag: string;
    source?: string;
    entries: PassportEntry[];
    /** Free-form curatorial notes for this idiom's passport, in the
     * editors' own working language — stripped by the public-projection
     * sanitizer whenever (as in C4's current iteration) there is no English
     * twin, per the same convention as `LevelsTableBundle.note`/`note_en`. */
    context_and_notes_markdown?: string;
    context_and_notes_markdown_en?: string;
}

/** Keyed by idiom_tag (e.g. "CANTONESE_STD", "TAISHAN", "XINYI"). */
export type PassportsBundle = Record<string, PassportIdiomBundle>;

/** C4-only: the frozen-snapshot re-check this case's About-tab sentence is
 * built from (see the About tab wording) — a dated aggregate re-count,
 * not the live production graph. */
export interface SnapshotCheckBundle {
    checked_at: string;
    rows_checked: number;
    row_level_mismatch_count: number;
    aggregate_check: {
        snapshot_summary_2026_09_16: { rows: number; documents: number; tags: number };
        live_recount_2026_09_20_same_method: { rows: number; documents: number; tags: number };
        match: boolean;
    };
}

export interface CoreRecord {
    native: NativeClaimFields;
    annotation: AnnotationRecord;
}

export interface SupplementRecord {
    native: NativeClaimFields;
    annotation: AnnotationRecord;
}

/** One equality condition a `finding_vars` recipe filters rows by. */
export interface WhereClause {
    column: string;
    equals: unknown;
}

/** One entry of a native operation's `finding_vars`: a small recipe for
 * turning the operation's own result rows into a single reader-facing
 * number/anchor list, substituted into `finding_en`'s `{name}` placeholders
 * (see `src/operations/findings.ts`, the TS port of the bundle-build side's
 * own reference implementation, `findings_lib.py`). `column` names a single
 * field (`sum`/`distinct`/`list_len`); `columns` names one or more fields at
 * once (`anchors_of` only — it reads claim ids out of every one of them,
 * one row at a time). `where` restricts which rows a recipe counts/sums/
 * lists over — a single {column, equals} clause, or a list of clauses
 * (AND). */
export interface FindingVarSpec {
    op: "count_rows" | "sum" | "distinct" | "list_len" | "anchors_of";
    column?: string;
    columns?: string[];
    where?: WhereClause | WhereClause[];
}

export type FindingVarsSpec = Record<string, FindingVarSpec>;

export interface NativeOperationDefinition {
    name: string;
    /** Present in C2's bundle; C1's operations only carry question_en, so
     * the display title falls back to a humanized `name`. */
    title_en?: string;
    question?: string;
    question_en: string;
    /** Human-language finding sentence with `{n_rows}`/`{anchors}`/named
     * placeholders (see `finding_vars`) — the main text a reader sees on
     * the Findings tab. Absent in bundles from before this field was added;
     * `OperationsView` falls back to `question_en` in that case. */
    finding_en?: string;
    /** Recipes for this operation's own named placeholders (see
     * `FindingVarSpec`) — `{n_rows}` and `{anchors}` are always available
     * without being declared here. */
    finding_vars?: FindingVarsSpec;
    /** Sentence shown instead of `finding_en` when the recomputed/expected
     * row count is zero — a bundle can word "no rows" as itself a finding
     * ("no contested cell in this slice") rather than an empty state. */
    finding_empty_en?: string;
    /** One-line, italicized "why it matters" gloss shown under the finding
     * sentence. */
    why_it_matters_en?: string;
    /** Reader-facing column headers for this operation's raw-row table in
     * the technical footnote, keyed by the row's own field name; a column
     * with no entry here falls back to its raw field name. */
    columns_en?: Record<string, string>;
    /** Whether this operation's finding appears in the Findings tab's main,
     * reader-facing flow. Every operation is still recomputed and listed in
     * the "Technical details" footnote regardless of this flag — it only
     * controls the main flow's signal-to-noise (e.g. C1's
     * `polarity_value_consistency`, a bookkeeping check, stays in the
     * footnote only). Absent (older/synthetic bundles) defaults to visible,
     * matching this viewer's pre-existing behavior of showing every
     * operation. */
    reader_visible?: boolean;
    template_ref?: string | null;
    native_fields?: string[];
    cypher: string;
    params: Record<string, unknown>;
    /** Almost always an array of rows; C4's `independent_bases /
     * distinct_textual_bases` operation instead records a single totals
     * object (`{components_merged_by_shared_basis, distinct_textual_bases}`)
     * — `runNativeOperations` normalizes either shape to a one-element array
     * before it reaches comparison/UI code (see nativeOperations.ts). */
    expected: Array<Record<string, unknown>> | Record<string, unknown>;
    expected_row_count: number;
    verified_at_utc?: string;
    status: "native" | "partially_native";
    /** C1 uses `caveat` (no _en suffix, still English); C2 uses
     * `caveat_en` alongside a Russian `caveat`. */
    caveat?: string | null;
    caveat_en?: string | null;
    reproduces_case_en?: string[] | null;
    slice_totals?: Record<string, unknown> | null;
    expected_totals?: Record<string, unknown> | null;
    expected_groups?: Record<string, unknown> | null;
    expected_note?: string | null;
    corpus_scale_2026_09_08?: Record<string, unknown> | null;
    unchanged_since_proposal?: boolean;
}

export interface NotApplicableOperation {
    origin: string;
    status: "not_applicable";
    /** Working-language reason; stripped by the public-projection sanitizer
     * when a bundle has no `reason_en` translation. */
    reason?: string;
    reason_en?: string;
    /** Same optional finding-style fields `NativeOperationDefinition`
     * carries — a not_applicable entry can ship its own reader-facing
     * title/finding text once the bundle-build side adds them; absent in
     * every bundle today, so `OperationsView` falls back to a humanized
     * name + `reason_en`. */
    title_en?: string;
    finding_en?: string;
    why_it_matters_en?: string;
    /** Same meaning as `NativeOperationDefinition.reader_visible`; a
     * not_applicable entry without `reader_visible: true` appears only in
     * the "Technical details" footnote, never as its own main-flow card. */
    reader_visible?: boolean;
}

/**
 * A finding this viewer shows as-is, without recomputing anything: the
 * bundle-build side already counted its numbers (`finding_vars`) against the
 * production graph and baked them into `finding_en`'s prose directly, rather
 * than leaving placeholders for `computeFindingVars` to fill in — unlike
 * `NativeOperationDefinition`, there is no `cypher`/`expected` pair backing
 * a per-row recomputation check here (C4's `addressing_gap`: a slice-wide
 * observation about how records are addressed, not a single operation's row
 * set). Rendered in the Findings tab's main flow when `reader_visible`.
 */
export interface ContextFindingEntry {
    status: "curated";
    title_en: string;
    finding_en: string;
    why_it_matters_en?: string;
    finding_vars?: Record<string, number>;
    reader_visible?: boolean;
}

export interface ExpectedNativeOperationsBundle {
    version: string;
    /** The editors' own working-language statement of this case's guiding
     * principle; not shown by this viewer, and stripped by the
     * public-projection sanitizer when a bundle has no `principle_en`. */
    principle?: string;
    principle_en?: string;
    scope: {
        claim_ids: string[];
        sources: Record<string, string>;
        /** C2 has one working target; C1 has several (`targets`). */
        target?: string;
        targets?: string[];
        features: string[];
        statuses?: string[];
    };
    operations: NativeOperationDefinition[];
    /** Operations carried over from another case's template that do not
     * apply to this one (C1: `feature_level_split`), keyed by operation name. */
    not_applicable?: Record<string, NotApplicableOperation>;
    /** Slice-wide observations the bundle-build side records with their
     * numbers already baked in (see `ContextFindingEntry`), keyed by name
     * (C4: `addressing_gap`). Absent in every other case bundle. */
    context_findings?: Record<string, ContextFindingEntry>;
    /** What the graph does not compute for this case, in the editors' own
     * working language. `note`/`items` are stripped by the public-projection
     * sanitizer whenever a bundle has no English translation for them (see
     * the upstream public projection; PUBLIC_EXPORT.json lists what was withheld) — in that case this
     * viewer has nothing to show and the About tab's "Open questions"
     * section simply omits this case's "what the graph does not compute"
     * block, rather than falling back to an untranslated note. */
    remains_curated: {
        note?: string;
        note_en?: string;
        items?: string[];
        items_en?: string[];
    };
}

// The claim-id groupings a case bundle records as ground truth for its own
// filter/selection operations. Which of these keys a given bundle populates
// depends on what that case's UI actually filters by (C2: source + feature +
// native-locality vs curated-context; C1: source + feature + target +
// position, with core/comparison scope split out explicitly).
export interface ExpectedOperationsBundle {
    baseline_claim_ids: string[];
    by_feature?: Record<string, string[]>;
    source_filter?: Record<string, string[]>;
    locality_filter?: Record<string, string[]>;
    core_by_source?: Record<string, string[]>;
    core_by_feature?: Record<string, string[]>;
    core_by_target?: Record<string, string[]>;
    comparison_by_source?: Record<string, string[]>;
    comparison_by_feature?: Record<string, string[]>;
    comparison_by_target?: Record<string, string[]>;
    by_position?: Record<string, string[]>;
    /** C3-only: comparison claim ids grouped by level scheme (`SCH_ATLAS` /
     * `SCH_YH` / `SCH_CROSS`) — the curated layer's own record of the
     * assignment shown in the Levels view, not something a native
     * operation computes. */
    by_scheme?: Record<string, string[]>;
    empty_result_meaning: string;
    /** Absent in C4's bundle: it has no `by_position`/`by_scheme`-style
     * derived groupings that need a documented "how to reset" note. */
    reset?: string[];
}

export interface ExpectedComparisonOperationsBundle {
    all_with_curated_context: string[];
    native_locality_only: string[];
    curated_context_only: string[];
    by_source: Record<string, string[]>;
    by_feature: Record<string, string[]>;
    excluded_claim_ids: string[];
    /** Working-language explanation of `excluded_claim_ids`; not shown by
     * this viewer, and stripped by the public-projection sanitizer when a
     * bundle has no English translation. */
    excluded_note?: string;
    excluded_note_en?: string;
}

export interface SourceCslAuthor {
    given?: string;
    family?: string;
}

/**
 * A source's bibliographic facts as curated in the closed platform's own
 * library layer — the preferred source for author/year/venue display over
 * `csl_data` (per the bundle convention: `library` is
 * curator-checked, `csl_data` is whatever CSL-JSON the ingestion pipeline
 * happened to derive). `authors` is already "Family, Given" formatted
 * strings, not a structured `{given, family}` list. Absent in bundles from
 * before this field was added; `sourceAuthorsDisplay`/`sourceShortLabel`/
 * `scripts/make_notice.py` fall back to `csl_data` in that case.
 */
export interface SourceLibraryRecord {
    authors?: string[];
    publication_year?: number | null;
    journal?: string | null;
    document_type?: string | null;
    language?: string | null;
    identifiers?: Record<string, string>;
}

export interface SourceRecord {
    document_id: string;
    title: string;
    source_key?: string;
    /** Curator-checked bibliographic facts; preferred over `csl_data` for
     * display wherever present (see `SourceLibraryRecord`). */
    library?: SourceLibraryRecord;
    csl_data: {
        DOI?: string | null;
        ISBN?: string | null;
        type?: string;
        title?: string;
        author?: SourceCslAuthor[];
        issued?: { "date-parts": number[][] } | null;
        authors?: string[];
        abstract?: string | null;
        publisher?: string | null;
        "container-title"?: string | null;
    };
    sha256?: string;
    document_type_native?: string;
    annotation: {
        origin_kind: OriginKind;
        evidence_role?: string;
        independence?: string;
        position?: string[];
        rights: string;
    };
}

export interface CountsBundle {
    ledger_rows?: number;
    candidate_claims?: number;
    core_claims?: number;
    core_evidence?: number;
    core_sources?: number;
    core_chunks?: number;
    graph_nodes?: number;
    graph_edges?: number;
    comparison_claims?: number;
    comparison_sources?: number;
    comparison_nodes: number;
    comparison_edges: number;
    [key: string]: unknown;
}

/** Structured successor to `ManifestBundle.rights_release_status`'s free-text
 * string (see the project's rights decision, 2026-09-20): which layer of the
 * bundle is under which license, and whether third-party quotations/full
 * texts are covered. A bundle not yet updated to this shape still carries
 * the plain string instead — see `rightsReleaseStatusLabel()` in
 * `utils/labels.ts` for the fallback that handles both. */
export interface RightsReleaseStatus {
    status: string;
    code_license: string;
    content_license: string;
    third_party_quotations: string;
    full_texts_redistributed: boolean;
}

export interface ManifestBundle {
    version: string;
    /** Absent in C4's bundle (its own manifest has no previous-iteration
     * pointer field at all yet). */
    previous_version?: string | null;
    status: string;
    iteration_status?: string;
    /** Either the older free-text summary string every current bundle still
     * carries, or the newer structured `RightsReleaseStatus` a future
     * re-import may switch to. */
    rights_release_status?: string | RightsReleaseStatus;
    /** Open questions the editors have not yet resolved for this case,
     * translated to English — shown on the About tab's "Open questions"
     * section. Not every bundle carries this yet. */
    open_questions_en?: string[];
    counts: CountsBundle;
    files_sha256: Record<string, string>;
    [key: string]: unknown;
}

/** How a curated table row's content was arrived at — optional, shown as a
 * short label in PositionsView/LevelsView when present: whether the row
 * comes straight from the level-scheme layer the graph itself carries, from
 * an editor's own reading of a boundary description with no explicit level
 * statement, or is an editor's own note with no source wording behind it at
 * all. */
export type DerivationKind =
    | "derived_from_schemes_layer"
    | "editor_inferred_from_boundary_description"
    | "editor_written";

/** One row of the C1 "positions" curated table (positions_table.json):
 * source — unit — membership — rank — comparability, with the anchors
 * (claim roles) it draws on. Not present in every case bundle. */
export interface PositionsTableRow {
    position: string;
    source_key: string;
    source_en: string;
    unit: string;
    membership: string;
    rank_as_stated: string;
    comparability: string;
    unknowns: string;
    anchors: string;
    derivation?: DerivationKind;
}

export interface PositionsTableBundle {
    origin_kind: OriginKind;
    /** `note`/`curator_questions` are the editors' own working-language
     * notes; the public-projection sanitizer strips them when a bundle has
     * no English translation for them (PUBLIC_EXPORT.json lists what was
     * withheld) — this bundle's `note_en` is the reader-facing text. */
    note?: string;
    note_en?: string;
    page_rule_1991a?: string;
    rows: PositionsTableRow[];
    curator_questions?: string[];
}

/** One row of C3's curated "levels" table (levels_table.json): how a given
 * scheme (Atlas / Yue-Hashimoto / the cross-scheme third source) names and
 * nests its units, kept apart from the native graph fields. `scheme` here
 * is a free-text description of which scheme/edition the row belongs to,
 * not a `SCH_*` key — that key lives on `CoreRecord`/`SupplementRecord`'s
 * `annotation.scheme` instead, one level per claim. */
export interface LevelsTableRow {
    row_id: string;
    scheme: string;
    source: string;
    unit: string;
    level_term: string;
    contains: string;
    comparability: string;
    unknowns: string;
    /** Comma-separated anchor tokens, same convention as
     * PositionsTableRow.anchors — resolved via CasebookStore.selectAnchors. */
    anchors: string;
    derivation?: DerivationKind;
}

/** The one place in C3 where the two level schemes are related to each
 * other: a sentence present in the source text but with no Claim node of
 * its own (the adjacent claim K1 stops at the previous sentence). Carried
 * as a curated annotation with its exact segment locator, not a graph edge. */
export interface CrossSchemePassage {
    origin_kind: OriginKind;
    source_key: string;
    document_id: string;
    chunk_id: string;
    segment_order: number;
    start_char: number;
    end_char: number;
    physical_page: number | null;
    printed_page: string | null;
    quote_en: string;
    why_curated_en: string;
    why_curated_ru?: string;
    page_method?: string;
    page_confidence?: string;
    page_note?: string;
}

export interface LevelsTableBundle {
    origin_kind: OriginKind;
    note?: string;
    note_en: string;
    page_rule_1991a?: string;
    /** Short English description of each scheme this case's rows belong
     * to, keyed by the same `SCH_*` values `annotation.scheme` carries. */
    schemes_en: Record<string, string>;
    rows: LevelsTableRow[];
    /** What the table (and the case) explicitly does NOT claim — shown as
     * its own "What this case does not claim" block, not folded into the
     * rows. */
    explicit_non_claims_en: string[];
    cross_scheme_passage: CrossSchemePassage;
    /** The editors' own working-language questions; stripped by the
     * public-projection sanitizer when a bundle has no `curator_questions_en`
     * translation (see the upstream public projection; PUBLIC_EXPORT.json lists what was withheld). */
    curator_questions?: string[];
    curator_questions_en?: string[];
}

// The set of files actually loaded by the viewer at runtime. Deliberately a
// subset of the exported bundle: raw exports / ledgers stay out of
// the git-tracked data/ tree and are never fetched by the app.
export interface CasebookBundle {
    version: string;
    manifest: ManifestBundle;
    caseMarkdown: string;
    graph: GraphBundle;
    comparisonGraph: GraphBundle;
    core: CoreRecord[];
    supplement: SupplementRecord[];
    nativeOperations: ExpectedNativeOperationsBundle;
    expectedOperations: ExpectedOperationsBundle;
    /** Not every case bundle ships a comparison-operations control file
     * (C1 folds the equivalent groupings into expectedOperations instead). */
    expectedComparisonOperations: ExpectedComparisonOperationsBundle | null;
    sources: SourceRecord[];
    counts: CountsBundle;
    /** C1-only curated positions table; null for cases that don't ship one. */
    positionsTable: PositionsTableBundle | null;
    /** C3-only curated levels table; null for cases that don't ship one. */
    levelsTable: LevelsTableBundle | null;
    /** C4-only computed technical-pair register; null for cases that don't
     * ship one. */
    pairsTable: PairsTableBundle | null;
    /** C4-only curated tone passports, keyed by idiom_tag; null for cases
     * that don't ship one. */
    passports: PassportsBundle | null;
    /** C4-only frozen-snapshot re-check (see About tab); null for cases that
     * don't ship one. */
    snapshotCheck: SnapshotCheckBundle | null;
}
