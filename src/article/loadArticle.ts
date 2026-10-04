// Static, offline import of the vendored article — same pattern as
// src/data/loadBundle.ts's case bundles: Vite inlines the `?raw` markdown
// and the JSON import at build time, so no runtime fetch is needed.
//
// The article text is optional. `import.meta.glob` on a literal path yields
// an empty record when the file is absent, so the build succeeds without
// `data/article/ARTICLE_EN.md` and the Article tab shows its placeholder
// (see ArticleView). Restoring the text only requires putting the file back
// (the article text and ARTICLE_META.json are prepared upstream by the
// PaRAGraph pipeline before they land in this repository).
import articleMetaJson from "../../data/article/ARTICLE_META.json";

const articleMarkdownFiles = import.meta.glob<string>("../../data/article/ARTICLE_EN.md", {
    query: "?raw",
    import: "default",
    eager: true,
});

/** `in_preparation`: no text is vendored (placeholder only);
 * `working_draft`: set upstream alongside the article text. */
export type ArticleStatus = "in_preparation" | "working_draft";

export interface ArticleMeta {
    /** e.g. "Working draft v3"; null while no text is vendored. */
    version_label: string | null;
    status: ArticleStatus;
    /** ISO import date (YYYY-MM-DD); null while no text is vendored. */
    date: string | null;
    /** SHA-256 of the vendored ARTICLE_EN.md; null while no text is vendored,
     * since there is no file in the repository for the hash to identify. */
    sha256: string | null;
    preprint_url: string | null;
}

export interface ArticleData {
    /** Article markdown (with frontmatter), or null when no text is vendored. */
    markdown: string | null;
    meta: ArticleMeta;
}

export function loadArticle(): ArticleData {
    const markdown = Object.values(articleMarkdownFiles)[0] ?? null;
    return { markdown, meta: articleMetaJson as ArticleMeta };
}
