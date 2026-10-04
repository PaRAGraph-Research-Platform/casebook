import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./frontmatter";
import { FIXTURE_ARTICLE_MARKDOWN } from "./articleFixture.testdata";

describe("parseFrontmatter", () => {
    it("parses flat key: value attributes and strips the block from the body", () => {
        const { attributes, body } = parseFrontmatter(FIXTURE_ARTICLE_MARKDOWN);
        expect(attributes).toEqual({
            title: "Fixture Article About Comparison",
            author: "A. N. Author",
            date: "1 January 2026",
        });
        expect(body).toMatch(/^\s*# 1 The question and the contribution/);
        expect(body).not.toContain("title:");
    });

    it("returns the markdown unchanged when there is no frontmatter", () => {
        const markdown = "# Heading\n\ntitle: not frontmatter\n";
        expect(parseFrontmatter(markdown)).toEqual({ attributes: {}, body: markdown });
    });

    it("does not treat a later horizontal rule as frontmatter", () => {
        const markdown = "Intro\n---\nkey: value\n---\n";
        expect(parseFrontmatter(markdown).attributes).toEqual({});
    });
});
