import { describe, expect, it } from "vitest";
import { annotateArticleMarkdown, resolvePlaceholders, type AnchorResolutionDeps } from "./anchorMap";

// A small fake mirroring this repo's real case set (c1/c2/c3 registered, c4
// not yet) and the two cases' actual overlapping anchor letters (K1/K2 exist
// in both c2 and c3 — the collision the article's "Evidence routes" section
// must disambiguate by sentence).
const ANCHORS: Record<string, Set<string>> = {
    c2: new Set(["K1", "K2", "K3", "K4", "K5", "S1", "S2", "S3", "S4"]),
    c3: new Set(["A1", "A2", "A3", "H1", "H2", "K1", "K2", "S1", "S2", "S3", "S4", "Y1", "Y2", "Y3", "Y4"]),
};

const deps: AnchorResolutionDeps = {
    caseExists: (caseId) => caseId === "c1" || caseId === "c2" || caseId === "c3",
    anchorExists: (caseId, anchor) => ANCHORS[caseId]?.has(anchor) ?? false,
};

function render(markdown: string): { html: string; unresolved: ReturnType<typeof annotateArticleMarkdown>["unresolved"] } {
    const { markdown: annotated, unresolved } = annotateArticleMarkdown(markdown, deps);
    return { html: resolvePlaceholders(annotated), unresolved };
}

describe("annotateArticleMarkdown — case tokens", () => {
    it("links a bare case id anywhere in the document", () => {
        const { html } = render("Cases C1–C3 concern membership.");
        expect(html).toContain('data-case="c1"');
        expect(html).toContain('data-case="c3"');
        // The middle of a written range is never fabricated: "C2" was not
        // literally written in "C1–C3", so it must not appear as a link.
        expect(html).not.toContain('data-case="c2"');
    });

    it("links each id in an 'and'-joined list", () => {
        const { html } = render("C1 and C3 apply this separation.");
        expect(html).toContain('data-case="c1"');
        expect(html).toContain('data-case="c3"');
    });

    it("leaves an unregistered case id (C4) as plain text, and records why", () => {
        const { html, unresolved } = render("C4 concerns the feature axis.");
        expect(html).not.toContain("data-case");
        expect(html).toContain("C4 concerns the feature axis.");
        expect(unresolved).toContainEqual(
            expect.objectContaining({ raw: "C4", reason: "case_not_registered" })
        );
    });

    it("does not swallow a case id immediately followed by a period (title-like use)", () => {
        const { html } = render("A heading reading C1. starts the section.");
        expect(html).not.toContain("data-case");
    });
});

describe("annotateArticleMarkdown — record tokens in a letter-default section", () => {
    const withHeading = (body: string) => `## 4.2 Criteria and contextual applicability\n\n${body}\n`;

    it("resolves K/S tokens to C2 by section default", () => {
        const { html } = render(withHeading("K4 and K5 draw on one footnote; S1 and S2 share a passage."));
        expect(html).toContain('data-case="c2" data-anchor="K4"');
        expect(html).toContain('data-case="c2" data-anchor="K5"');
        expect(html).toContain('data-case="c2" data-anchor="S1"');
    });

    it("does not link a record token outside a section with a rule", () => {
        const { html, unresolved } = render("## 1 Intro\n\nA stray S4 mention here means nothing special.\n");
        expect(html).not.toContain("data-anchor");
        expect(unresolved).toHaveLength(0);
    });

    it("reports an anchor the resolved case does not actually carry", () => {
        const { html, unresolved } = render(withHeading("Record S9 does not exist for C2."));
        expect(html).not.toContain("data-anchor");
        expect(unresolved).toContainEqual(
            expect.objectContaining({ raw: "S9", reason: "anchor_not_found_in_context" })
        );
    });
});

describe("annotateArticleMarkdown — Evidence routes sentence-based resolution", () => {
    const evidenceRoutes = [
        "# Evidence routes",
        "",
        "The PaRAGraph Casebook provides the evidence routes for C1-C3. C2 uses the source-reading records K1-K5, the record-reading items S1-S4 and the shared-basis diagnostics. C3 uses the two-scheme comparison, evidence items A1 and Y1-Y4, curator annotations K1-K2 and the Levels comparison.",
        "",
    ].join("\n");

    it("resolves K1 to C2 in one sentence and to C3 in a later sentence (the documented collision)", () => {
        const { markdown, unresolved } = annotateArticleMarkdown(evidenceRoutes, deps);
        const html = resolvePlaceholders(markdown);
        expect(html).toContain('data-case="c2" data-anchor="K1"');
        expect(html).toContain('data-case="c3" data-anchor="K1"');
        expect(html).toContain('data-case="c3" data-anchor="K2"');
        expect(html).toContain('data-case="c2" data-anchor="K5"');
        expect(html).toContain('data-case="c2" data-anchor="S1"');
        expect(html).toContain('data-case="c2" data-anchor="S4"');
        expect(html).toContain('data-case="c3" data-anchor="A1"');
        expect(html).toContain('data-case="c3" data-anchor="Y1"');
        expect(html).toContain('data-case="c3" data-anchor="Y4"');
        expect(unresolved).toHaveLength(0);
    });

    it("also links the case ids named by the 'C<n> uses' trigger phrase itself", () => {
        const { markdown } = annotateArticleMarkdown(evidenceRoutes, deps);
        const html = resolvePlaceholders(markdown);
        expect(html).toContain('data-case="c2"');
        expect(html).toContain('data-case="c3"');
    });

    it("a C4 trigger sentence leaves 'C4' as plain text (case not yet registered)", () => {
        const text = "# Evidence routes\n\nC4 uses the frozen artifact.\n";
        const { markdown, unresolved } = annotateArticleMarkdown(text, deps);
        const html = resolvePlaceholders(markdown);
        expect(html).not.toContain("data-case");
        expect(unresolved).toContainEqual(
            expect.objectContaining({ raw: "C4", reason: "case_not_registered" })
        );
    });
});
