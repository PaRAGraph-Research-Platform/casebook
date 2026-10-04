import { describe, expect, it } from "vitest";
import { CASES, getCaseDefinition } from "../cases/registry";
import { renderCaseMarkdown, splitAnchorIndexSection } from "./renderCaseMarkdown";

describe("splitAnchorIndexSection", () => {
    it("drops the ## Anchor index section, keeping the markdown before and after it", () => {
        const markdown = [
            "# Title",
            "",
            "Body text with **K1** mentioned.",
            "",
            "## Anchor index",
            "",
            "| Anchor | Claim | Evidence |",
            "|---|---|---|",
            "| K1 | `claim_x` | `ev_y` |",
            "",
            "Full source context and exact segment IDs are in core.json.",
        ].join("\n");

        const { pre, post } = splitAnchorIndexSection(markdown);

        expect(pre).toContain("Body text with **K1** mentioned.");
        expect(pre).not.toContain("Anchor index");
        expect(pre).not.toContain("claim_x");
        expect(post).not.toContain("claim_x");
        expect(post).not.toContain("Full source context");
    });

    it("returns the whole document as pre, with empty post, when there is no Anchor index heading", () => {
        const markdown = "# Title\n\nNo anchor table here.";
        const { pre, post } = splitAnchorIndexSection(markdown);
        expect(pre).toBe(markdown);
        expect(post).toBe("");
    });

    for (const caseDef of CASES) {
        it(`strips the raw Anchor index table (with its claim_id/ev_ ids) out of ${caseDef.id}'s CASE_EN.md`, () => {
            const bundle = getCaseDefinition(caseDef.id).loadBundle();
            const { pre, post } = splitAnchorIndexSection(bundle.caseMarkdown);
            const combined = `${pre}\n${post}`;

            expect(bundle.caseMarkdown).toContain("## Anchor index");
            expect(combined).not.toContain("## Anchor index");
            // The anchor table's own claim/evidence ids must not survive the split.
            for (const claim of [...bundle.core, ...bundle.supplement]) {
                expect(combined).not.toContain(claim.native.claim_id);
                expect(combined).not.toContain(claim.native.evidence_id);
            }

            const preHtml = renderCaseMarkdown(pre, caseDef.anchorPattern);
            const postHtml = renderCaseMarkdown(post, caseDef.anchorPattern);
            expect(`${preHtml}${postHtml}`).not.toMatch(/claim_[0-9a-f]{20,}/);
        });
    }
});

describe("case title and 'Case material' subtitle never become anchor-link buttons", () => {
    for (const caseDef of CASES) {
        it(`${caseDef.id}: CASE_EN.md's H1 title + 'Case material' line render as plain text, not anchors`, () => {
            const bundle = caseDef.loadBundle();
            const { pre } = splitAnchorIndexSection(bundle.caseMarkdown);
            // First two non-empty blocks of CASE_EN.md: the "# C<n>. <title>"
            // heading and the "*Case material: ...*" line right below it.
            const [heading, subtitleLine] = pre.split(/\n{2,}/);
            expect(heading).toMatch(/^# C\d+\. /);
            expect(subtitleLine).toMatch(/^\*Case material: .+\*$/);

            const html = renderCaseMarkdown(`${heading}\n\n${subtitleLine}`, caseDef.anchorPattern);
            // Neither the case's own number ("C1.") nor any word inside the
            // new title/subtitle text should be turned into a clickable
            // anchor token by this case's anchorPattern.
            expect(html).not.toContain("anchor-link");
            expect(html).not.toContain("data-anchor");
            expect(html).toContain("<em>Case material:");
        });
    }
});

describe("renderCaseMarkdown: links to bundle files", () => {
    it("replaces a relative link with code and leaves an external link intact", () => {
        const html = renderCaseMarkdown("See [positions_table.json](positions_table.json) and [site](https://example.org).", /\[A\d+\]/g);
        expect(html).toContain("<code>positions_table.json</code>");
        expect(html).not.toContain('href="positions_table.json"');
        expect(html).toContain('href="https://example.org"');
    });
});
