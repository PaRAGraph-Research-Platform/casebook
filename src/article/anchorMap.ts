/**
 * Contextual resolution of case/record identifiers inside the article's
 * markdown text into live links to this viewer's cases and Evidence-panel
 * anchors.
 *
 * Case tokens ("C1"…"C4") always mean a case id, everywhere in the article —
 * unlike inside a case's own CASE_EN.md (see src/cases/registry.ts), the
 * article never uses "C1"/"C2"/"C3" as one of its own record anchors, so no
 * per-section rule is needed for them.
 *
 * Record tokens (K/S/A/Y/H + a number, e.g. "K1", "S4", "Y2") are NOT
 * unique across cases — C2 and C3 both have a "K1" and a "K2" — so they are
 * resolved by section:
 *   - Inside "4.1 Membership and rank", "4.2 Criteria and contextual
 *     applicability" and "4.4 What the operations establish", K/S default
 *     to C2 and A/Y/H default to C3 (the only sections whose narrative
 *     currently uses bare record tokens outside "Evidence routes").
 *   - Inside "Evidence routes", a sentence's own "C<n> uses…" phrase sets
 *     which case every record token that follows belongs to, until the next
 *     such phrase — this is what lets one "K1" resolve to C2 and a later
 *     "K1" resolve to C3 in the same section.
 *   - Everywhere else, record tokens are left as plain text: this article
 *     does not use them outside those sections, and guessing would risk a
 *     false link.
 *
 * A token only ever becomes a link when its target demonstrably exists
 * (`AnchorResolutionDeps`) — a case id not yet in the registry (C4 today) or
 * a record anchor absent from the resolved case's bundle stays plain text,
 * never a dead link. This also means "C4" starts resolving on its own, with
 * no change to this file, the moment a `c4` case is added to the registry.
 *
 * Ranges/lists written in the article ("K1-K5", "C1–C3", "C1 and C3") are
 * NOT expanded to their implied members: only the ids literally present in
 * the text (e.g. "K1" and "K5", not the unmentioned "K2"/"K3"/"K4") become
 * their own chip. Inventing a link to a number the article never wrote
 * would misrepresent the source text, so ranges are deliberately left
 * unexpanded.
 */

export interface AnchorResolutionDeps {
    /** True if a case with this id is currently registered in the viewer. */
    caseExists: (caseId: string) => boolean;
    /** True if the given case's bundle carries an annotation with this
     * anchor token (CasebookStore.anchorToClaimId's own key set). */
    anchorExists: (caseId: string, anchor: string) => boolean;
}

export type UnresolvedReason = "case_not_registered" | "anchor_not_found_in_context";

export interface UnresolvedToken {
    /** The literal token text as it appears in the article. */
    raw: string;
    reason: UnresolvedReason;
    /** Section heading (or "document") the token was found under, for the
     * author-facing report. */
    context: string;
}

export interface AnnotateResult {
    /** Markdown with resolved tokens replaced by opaque placeholders (see
     * `resolvePlaceholders`) that survive `marked.parse` unchanged. */
    markdown: string;
    unresolved: UnresolvedToken[];
}

const PLACEHOLDER_OPEN = "";
const PLACEHOLDER_CLOSE = "";
const FIELD_SEP = "␟";

function makePlaceholder(kind: "case" | "record", caseId: string, anchor: string | null, raw: string): string {
    return `${PLACEHOLDER_OPEN}${kind}${FIELD_SEP}${caseId}${FIELD_SEP}${anchor ?? ""}${FIELD_SEP}${raw}${PLACEHOLDER_CLOSE}`;
}

/** Turns the placeholders `annotateArticleMarkdown` inserted (now baked into
 * marked's HTML output as literal text) into the actual clickable chips. */
export function resolvePlaceholders(html: string): string {
    return html.replace(/([^]*)/g, (_all, payload: string) => {
        const [kind, caseId, anchor, raw] = payload.split(FIELD_SEP);
        if (kind === "case") {
            return `<button type="button" class="anchor-link anchor-link-case" data-case="${caseId}">${raw}</button>`;
        }
        return `<button type="button" class="anchor-link" data-case="${caseId}" data-anchor="${anchor}">${raw}</button>`;
    });
}

const CASE_TOKEN_RE = /\bC([1-4])\b(?!\.)/g;
const RECORD_TOKEN_RE = /\b([KSAYH])(\d{1,2})\b(?!\.)/g;

/** Sections (matched by exact heading text, `#`/`##` stripped) whose body
 * uses bare record tokens with a fixed per-letter default case. */
const RECORD_SECTION_HEADINGS = new Set<string>([
    "4.1 Membership and rank",
    "4.2 Criteria and contextual applicability",
    "4.4 What the operations establish",
]);

const EVIDENCE_ROUTES_HEADING = "Evidence routes";

/** K/S belong to C2's anchor scheme, A/Y/H to C3's — the only two cases
 * whose CASE_EN.md anchor letters this article's prose actually reuses bare. */
const LETTER_DEFAULT_CASE: Record<string, string> = {
    K: "c2",
    S: "c2",
    A: "c3",
    Y: "c3",
    H: "c3",
};

function linkifyCaseTokens(
    text: string,
    deps: AnchorResolutionDeps,
    unresolved: UnresolvedToken[],
    context: string
): string {
    return text.replace(CASE_TOKEN_RE, (raw, digit: string) => {
        const caseId = `c${digit}`;
        if (!deps.caseExists(caseId)) {
            unresolved.push({ raw, reason: "case_not_registered", context });
            return raw;
        }
        return makePlaceholder("case", caseId, null, raw);
    });
}

function linkifyRecordTokensByLetter(
    text: string,
    deps: AnchorResolutionDeps,
    unresolved: UnresolvedToken[],
    context: string
): string {
    return text.replace(RECORD_TOKEN_RE, (raw, letter: string, num: string) => {
        const caseId = LETTER_DEFAULT_CASE[letter];
        // A letter this article never uses as a record prefix in this
        // section (e.g. a stray word matching \b[KSAYH]\d\b by accident) —
        // leave untouched, not worth reporting as "unresolved": it was
        // never meant to be a record token here.
        if (!caseId) return raw;
        const anchor = `${letter}${num}`;
        if (!deps.anchorExists(caseId, anchor)) {
            unresolved.push({ raw: anchor, reason: "anchor_not_found_in_context", context });
            return raw;
        }
        return makePlaceholder("record", caseId, anchor, raw);
    });
}

/** "Evidence routes"' own resolution rule: a case token immediately followed
 * by "uses" both becomes a case link AND sets the active case for every
 * record token that follows, until the next such phrase. Case tokens not
 * followed by "uses" still resolve as plain case links without changing the
 * active case. */
function linkifyEvidenceRoutes(text: string, deps: AnchorResolutionDeps, unresolved: UnresolvedToken[]): string {
    const context = EVIDENCE_ROUTES_HEADING;
    let activeCase: string | null = null;
    const combined = /C([1-4])(?=\s+uses\b)|C([1-4])\b(?!\.)|\b([KSAYH])(\d{1,2})\b(?!\.)/g;

    return text.replace(
        combined,
        (raw: string, triggerDigit: string | undefined, plainDigit: string | undefined, letter?: string, num?: string) => {
            if (triggerDigit !== undefined) {
                activeCase = `c${triggerDigit}`;
                if (!deps.caseExists(activeCase)) {
                    unresolved.push({ raw, reason: "case_not_registered", context });
                    return raw;
                }
                return makePlaceholder("case", activeCase, null, raw);
            }
            if (plainDigit !== undefined) {
                const caseId = `c${plainDigit}`;
                if (!deps.caseExists(caseId)) {
                    unresolved.push({ raw, reason: "case_not_registered", context });
                    return raw;
                }
                return makePlaceholder("case", caseId, null, raw);
            }
            // Record token (letter/num captured).
            const anchor = `${letter}${num}`;
            if (!activeCase) {
                unresolved.push({ raw: anchor, reason: "anchor_not_found_in_context", context });
                return raw;
            }
            if (!deps.anchorExists(activeCase, anchor)) {
                unresolved.push({ raw: anchor, reason: "anchor_not_found_in_context", context });
                return raw;
            }
            return makePlaceholder("record", activeCase, anchor, raw);
        }
    );
}

function processSection(text: string, heading: string, deps: AnchorResolutionDeps, unresolved: UnresolvedToken[]): string {
    if (heading === EVIDENCE_ROUTES_HEADING) {
        return linkifyEvidenceRoutes(text, deps, unresolved);
    }
    const withCaseLinks = linkifyCaseTokens(text, deps, unresolved, heading);
    if (RECORD_SECTION_HEADINGS.has(heading)) {
        return linkifyRecordTokensByLetter(withCaseLinks, deps, unresolved, heading);
    }
    return withCaseLinks;
}

const HEADING_RE = /^(#{1,2})\s+(.*)$/;

/**
 * Walks the article body (frontmatter already stripped) section by section
 * (an `#`/`##` heading starts a new section), resolving case/record tokens
 * per the rules above, and returns markdown with resolved tokens replaced by
 * opaque placeholders plus the list of tokens that did not resolve to a live
 * link (for the author-facing report — see resolvePlaceholders for
 * turning the placeholders into actual chip HTML after markdown rendering).
 */
export function annotateArticleMarkdown(markdown: string, deps: AnchorResolutionDeps): AnnotateResult {
    const lines = markdown.split("\n");
    const outputParts: string[] = [];
    const unresolved: UnresolvedToken[] = [];

    let currentHeading = "document";
    let bodyBuffer: string[] = [];

    const flush = () => {
        if (bodyBuffer.length === 0) return;
        outputParts.push(processSection(bodyBuffer.join("\n"), currentHeading, deps, unresolved));
        bodyBuffer = [];
    };

    for (const line of lines) {
        const headingMatch = HEADING_RE.exec(line);
        if (headingMatch) {
            flush();
            currentHeading = headingMatch[2].trim();
            outputParts.push(line);
        } else {
            bodyBuffer.push(line);
        }
    }
    flush();

    return { markdown: outputParts.join("\n"), unresolved };
}
