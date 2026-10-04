import { describe, expect, it } from "vitest";
import type { AnchorResolutionDeps } from "../article/anchorMap";
import { renderArticleMarkdown } from "./renderArticleMarkdown";

const deps: AnchorResolutionDeps = {
    caseExists: (caseId) => caseId === "c1" || caseId === "c2",
    anchorExists: (caseId, anchor) => caseId === "c2" && anchor === "K1",
};

const BODY = [
    "# 1 Intro",
    "",
    "C1 and C2 are compared.",
    "",
    "| A | B |",
    "|---|---|",
    "| 1 | 2 |",
    "",
    "# 1 Intro",
    "",
    "A repeated heading.",
    "",
    "# Evidence routes",
    "",
    "C2 uses K1 as its record.",
    "",
    "# References",
    "",
    "Example 2020. <https://doi.org/10.0000/x>",
    "",
].join("\n");

describe("renderArticleMarkdown", () => {
    it("builds an h1 table of contents with unique, stable heading ids", () => {
        const { html, toc } = renderArticleMarkdown(BODY, deps);
        expect(toc).toEqual([
            { id: "1-intro", text: "1 Intro" },
            { id: "1-intro-2", text: "1 Intro" },
            { id: "evidence-routes", text: "Evidence routes" },
            { id: "references", text: "References" },
        ]);
        expect(html).toContain('<h1 id="1-intro-2">');
    });

    it("turns resolved case/record tokens into chips and reports nothing unresolved", () => {
        const { html, unresolved } = renderArticleMarkdown(BODY, deps);
        expect(html).toContain('data-case="c1"');
        expect(html).toContain('data-case="c2" data-anchor="K1"');
        expect(unresolved).toEqual([]);
    });

    it("wraps tables in .table-scroll and the References section in .article-references", () => {
        const { html } = renderArticleMarkdown(BODY, deps);
        expect(html).toContain('<div class="table-scroll"><table>');
        expect(html).toMatch(/<h1 id="references">References<\/h1><div class="article-references">[\s\S]*doi\.org/);
    });

    it("opens external links in a new tab without an opener", () => {
        const { html } = renderArticleMarkdown(BODY, deps);
        expect(html).toContain('<a href="https://doi.org/10.0000/x" target="_blank" rel="noopener"');
    });
});
