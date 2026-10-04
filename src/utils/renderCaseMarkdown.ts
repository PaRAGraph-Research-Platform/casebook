import { marked } from "marked";

/**
 * Renders CASE_EN.md to HTML and turns every anchor token matching
 * `anchorPattern` into a clickable button (`data-anchor="K1"`), so the
 * surrounding view can wire up claim selection via event delegation. Anchor
 * tokens never occur inside HTML tag or attribute syntax in these
 * documents (no links, no code blocks), so a whole-string regex pass over
 * the rendered HTML is safe here.
 */
export function renderCaseMarkdown(markdown: string, anchorPattern: RegExp): string {
    const html = marked.parse(markdown, { async: false }) as string;
    // Links to bundle files (positions_table.json etc.) lead nowhere in a standalone build:
    // show the file name as code rather than as a dead link.
    const withoutFileLinks = html.replace(/<a href="(?!https?:|#)[^"]*">([\s\S]*?)<\/a>/g, "<code>$1</code>");
    return withoutFileLinks.replace(
        anchorPattern,
        (match) => `<button type="button" class="anchor-link" data-anchor="${match}">${match}</button>`
    );
}

/**
 * Splits a CASE_EN.md document around its `## Anchor index` section (that
 * section runs from the heading up to the next `## ` heading, or to the end
 * of the document). Returns the markdown before and after that section,
 * with the section itself dropped: it is an internal claim/evidence-id
 * lookup table, not reader-facing content — the `AnchorIndex` component
 * renders the same anchors from `core.json`/`supplement.json` instead, with
 * quotes and locators rather than raw ids.
 *
 * The editors' own "Open curator decisions/questions" working notes are cut
 * out of CASE_EN.md upstream, before
 * this bundle ever reaches the viewer — this function only ever sees the
 * public projection of the document.
 */
export function splitAnchorIndexSection(markdown: string): { pre: string; post: string } {
    const headingMatch = /^## Anchor index\s*$/m.exec(markdown);
    if (!headingMatch) {
        return { pre: markdown, post: "" };
    }
    const pre = markdown.slice(0, headingMatch.index);
    const rest = markdown.slice(headingMatch.index + headingMatch[0].length);
    const nextHeadingMatch = /^## /m.exec(rest);
    const post = nextHeadingMatch ? rest.slice(nextHeadingMatch.index) : "";
    return { pre, post };
}
