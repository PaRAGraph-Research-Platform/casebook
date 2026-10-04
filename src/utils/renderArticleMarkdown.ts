import { marked } from "marked";
import { annotateArticleMarkdown, resolvePlaceholders, type AnchorResolutionDeps, type UnresolvedToken } from "../article/anchorMap";

export interface ArticleTocEntry {
    id: string;
    text: string;
}

export interface RenderedArticle {
    html: string;
    unresolved: UnresolvedToken[];
    toc: ArticleTocEntry[];
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

/**
 * Renders the article body (frontmatter already stripped, see
 * src/article/frontmatter.ts) to HTML: resolves case/record tokens to
 * clickable chips (src/article/anchorMap.ts), builds an h1-based table of
 * contents with stable heading ids, and opens every external link
 * (doi/arxiv/w3.org/…) in a new tab — the only place this offline viewer
 * ever links outward.
 */
export function renderArticleMarkdown(body: string, deps: AnchorResolutionDeps): RenderedArticle {
    const { markdown: annotated, unresolved } = annotateArticleMarkdown(body, deps);
    const rawHtml = marked.parse(annotated, { async: false }) as string;

    const toc: ArticleTocEntry[] = [];
    const usedIds = new Set<string>();
    const withHeadingIds = rawHtml.replace(/<h1>([\s\S]*?)<\/h1>/g, (_full, inner: string) => {
        const text = inner.replace(/<[^>]+>/g, "");
        const baseId = slugify(text);
        let id = baseId;
        let suffix = 2;
        while (usedIds.has(id)) {
            id = `${baseId}-${suffix}`;
            suffix += 1;
        }
        usedIds.add(id);
        toc.push({ id, text });
        return `<h1 id="${id}">${inner}</h1>`;
    });

    // References: wrap the section's own paragraphs in a dedicated class so
    // it can be styled at a smaller size with a hanging indent, distinct
    // from the rest of the article's reading typography.
    const withReferencesWrap = withHeadingIds.replace(
        /(<h1 id="references">[\s\S]*?<\/h1>)([\s\S]*?)(?=<h1 |$)/,
        (_full, heading: string, rest: string) => `${heading}<div class="article-references">${rest}</div>`
    );

    const withChips = resolvePlaceholders(withReferencesWrap);

    // Table 1 (the only table in the article) gets the same scroll wrapper
    // as every other wide table in this viewer, rather than relying on
    // .case-markdown table's own overflow rule.
    const withTableScroll = withChips
        .replace(/<table>/g, '<div class="table-scroll"><table>')
        .replace(/<\/table>/g, "</table></div>");

    // External links (doi, arxiv, w3.org, …) are the only place this offline
    // viewer links outward; they open in a new tab without an opener.
    const withExternalLinks = withTableScroll.replace(
        /<a href="(https?:\/\/[^"]*)"/g,
        '<a href="$1" target="_blank" rel="noopener"'
    );

    return { html: withExternalLinks, unresolved, toc };
}
