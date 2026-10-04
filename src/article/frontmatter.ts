export interface FrontmatterResult {
    attributes: Record<string, string>;
    body: string;
}

/**
 * Minimal YAML-frontmatter parser for the article draft's own header block
 * (`title`/`author`/`date`, flat string values only) — no YAML dependency,
 * per this repo's no-new-deps rule. Only handles the shape the article
 * actually uses: a `---`-delimited block of `key: value` lines at the very
 * top of the document. The parsed attributes are shown in the Article
 * banner; the raw frontmatter block itself is stripped from `body` and
 * never rendered as markdown text.
 */
export function parseFrontmatter(markdown: string): FrontmatterResult {
    const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/.exec(markdown);
    if (!match) {
        return { attributes: {}, body: markdown };
    }
    const attributes: Record<string, string> = {};
    for (const line of match[1].split("\n")) {
        const lineMatch = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
        if (!lineMatch) continue;
        attributes[lineMatch[1]] = lineMatch[2].trim();
    }
    const body = markdown.slice(match[0].length);
    return { attributes, body };
}
