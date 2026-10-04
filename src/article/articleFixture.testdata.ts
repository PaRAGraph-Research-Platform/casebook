// Test-only article fixture: a small stand-in for data/article/ARTICLE_EN.md,
// so the article rendering path stays covered while the real text is not
// vendored. Record anchors used here (K1, K2, S4, …) exist in the real
// c2/c3 bundles, since ArticleView resolves them against the registry.
import type { ArticleData } from "./loadArticle";

export const FIXTURE_ARTICLE_MARKDOWN = [
    "---",
    "title: Fixture Article About Comparison",
    "author: A. N. Author",
    "date: 1 January 2026",
    "---",
    "",
    "# 1 The question and the contribution",
    "",
    "Cases C1–C3 concern the object of comparison; C4 concerns the feature.",
    "",
    "| Case | Axis |",
    "|---|---|",
    "| C1 | object |",
    "",
    "# Evidence routes",
    "",
    "The Casebook provides the evidence routes for C1-C3. C2 uses the source-reading records K1-K5 and the record-reading items S1-S4 and the shared-basis diagnostics. C3 uses the evidence items A1 and Y1-Y4 and curator annotations K1-K2.",
    "",
    "# References",
    "",
    "Example, A. 2020. A reference. <https://doi.org/10.0000/example>",
    "",
].join("\n");

export const FIXTURE_ARTICLE: ArticleData = {
    markdown: FIXTURE_ARTICLE_MARKDOWN,
    meta: {
        version_label: "Working draft v9",
        status: "working_draft",
        date: "2026-01-15",
        sha256: "0".repeat(64),
        preprint_url: null,
    },
};

export const PLACEHOLDER_ARTICLE: ArticleData = {
    markdown: null,
    meta: { version_label: null, status: "in_preparation", date: null, sha256: null, preprint_url: null },
};
