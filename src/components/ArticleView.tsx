import { useMemo, type MouseEvent } from "react";
import { CASES } from "../cases/registry";
import { buildCombinedClaims } from "../operations/combinedClaims";
import { parseFrontmatter } from "../article/frontmatter";
import { loadArticle, type ArticleData, type ArticleMeta } from "../article/loadArticle";
import { CONTACT } from "../config";
import { renderArticleMarkdown } from "../utils/renderArticleMarkdown";
import type { AnchorResolutionDeps } from "../article/anchorMap";

interface ArticleViewProps {
    /** Switches the active case (and, when an anchor is given, selects that
     * record and opens the Case tab) — wired by App to its own case-switch
     * state, since the Article tab is case-independent (like About) and so
     * cannot hold a CasebookStore of its own. */
    onOpenLink: (caseId: string, anchor?: string) => void;
    /** Article text and metadata; defaults to the vendored `data/article/`
     * (see loadArticle). Injectable so the placeholder and the rendered
     * article can both be exercised without depending on which of the two
     * states the repository is currently in. */
    article?: ArticleData;
}

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

/** "2026-09-20" -> "20 Sep 2026" — spelled out by hand rather than via
 * `Intl.DateTimeFormat`, whose month abbreviation is locale/engine-dependent
 * (e.g. "Sept" in some `en-GB` implementations) and so not stable to test. */
function formatDate(isoDate: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!match) return isoDate;
    const [, year, month, day] = match;
    const monthName = MONTHS[Number(month) - 1];
    if (!monthName) return isoDate;
    return `${Number(day)} ${monthName} ${year}`;
}

/**
 * Case-independent Article tab. While no article text is vendored
 * (`markdown: null`) it shows a short placeholder; once
 * `data/article/ARTICLE_EN.md` is imported again it renders the article
 * with live case/record links, with no code change needed.
 */
export function ArticleView({ onOpenLink, article }: ArticleViewProps) {
    const { markdown, meta } = useMemo(() => article ?? loadArticle(), [article]);
    if (markdown === null) {
        return <ArticlePlaceholder meta={meta} />;
    }
    return <ArticleBody markdown={markdown} meta={meta} onOpenLink={onOpenLink} />;
}

function ArticlePlaceholder({ meta }: { meta: ArticleMeta }) {
    return (
        <div className="article-view">
            <section className="article-banner article-placeholder">
                <h2>Companion article</h2>
                <p>
                    A companion research article is in preparation; its text will appear here once a
                    preprint is available.
                </p>
                {meta.preprint_url && (
                    <p>
                        <a href={meta.preprint_url} target="_blank" rel="noopener">
                            Read the preprint
                        </a>
                    </p>
                )}
                <p className="muted">
                    Questions about the article or the cases:{" "}
                    <a href={CONTACT.url} target="_blank" rel="noopener">
                        {CONTACT.label}
                    </a>
                    .
                </p>
            </section>
        </div>
    );
}

interface ArticleBodyProps {
    markdown: string;
    meta: ArticleMeta;
    onOpenLink: (caseId: string, anchor?: string) => void;
}

function ArticleBody({ markdown, meta, onOpenLink }: ArticleBodyProps) {
    const { attributes, body } = useMemo(() => parseFrontmatter(markdown), [markdown]);

    // A case's own anchor set — built the same way CasebookStore.anchorToClaimId
    // does (buildCombinedClaims over core+supplement) — is the ground truth a
    // record-id token in the article resolves against. Computed once per
    // registered case: this is a handful of already-loaded, in-memory bundles,
    // not a network fetch.
    const anchorSetsByCase = useMemo(() => {
        const map = new Map<string, Set<string>>();
        for (const caseDef of CASES) {
            const bundle = caseDef.loadBundle();
            const claims = buildCombinedClaims(bundle.core, bundle.supplement);
            map.set(
                caseDef.id,
                new Set(claims.map((claim) => claim.annotation.anchor))
            );
        }
        return map;
    }, []);

    const deps: AnchorResolutionDeps = useMemo(
        () => ({
            caseExists: (caseId) => CASES.some((c) => c.id === caseId),
            anchorExists: (caseId, anchor) => anchorSetsByCase.get(caseId)?.has(anchor) ?? false,
        }),
        [anchorSetsByCase]
    );

    const rendered = useMemo(() => renderArticleMarkdown(body, deps), [body, deps]);

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        const link = target.closest<HTMLElement>("[data-case]");
        if (!link) return;
        const caseId = link.dataset.case;
        if (!caseId) return;
        const anchor = link.dataset.anchor || undefined;
        onOpenLink(caseId, anchor);
    };

    const handleTocClick = (event: MouseEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        const link = target.closest<HTMLAnchorElement>("a[href^='#']");
        if (!link) return;
        const id = link.getAttribute("href")?.slice(1);
        if (!id) return;
        const heading = document.getElementById(id);
        if (heading) {
            event.preventDefault();
            heading.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const dateLabel = meta.date ? formatDate(meta.date) : null;
    const statusLabel = [meta.version_label, dateLabel].filter(Boolean).join(" \u00b7 ");

    return (
        <div className="article-view">
            <section className="article-banner">
                <h2>{attributes.title ?? "PaRAGraph article draft"}</h2>
                {attributes.author && <p className="article-author">{attributes.author}</p>}
                <div className="article-status-row">
                    {statusLabel && <span className="status-badge article-status-pill">{statusLabel}</span>}
                    {meta.preprint_url && (
                        <a
                            className="status-badge article-status-pill article-preprint-pill"
                            href={meta.preprint_url}
                            target="_blank"
                            rel="noopener"
                        >
                            Preprint
                        </a>
                    )}
                </div>
                <p className="article-explainer muted">
                    This is a working draft of the article this Casebook accompanies. Case
                    identifiers (e.g. C1) and record identifiers (e.g. K1, S4) below are clickable: they
                    open the matching case and, for a record, select it in the Evidence panel.
                </p>
            </section>

            <div className="article-body">
                <details className="article-toc" open>
                    <summary>Contents</summary>
                    <nav onClick={handleTocClick}>
                        <ol>
                            {rendered.toc.map((entry) => (
                                <li key={entry.id}>
                                    <a href={`#${entry.id}`}>{entry.text}</a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                </details>

                <div
                    className="case-markdown article-markdown"
                    onClick={handleClick}
                    // Rendered from the repo-vendored article draft prepared
                    // upstream by the PaRAGraph pipeline, not user input.
                    dangerouslySetInnerHTML={{ __html: rendered.html }}
                />
            </div>
        </div>
    );
}
