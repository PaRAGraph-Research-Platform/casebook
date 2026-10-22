/**
 * Single source of truth for the public repository URL this viewer links
 * to from its own "technical details" footnotes and About page — never
 * hardcode the URL string anywhere else. It uses the same ordinary external
 * link convention (`target="_blank" rel="noopener"`) as every outbound link
 * this offline viewer renders.
 */
export const REPO_URL = "https://github.com/PaRAGraph-Research-Platform/casebook";

/** Public version label for this viewer/casebook, used by the About tab's
 * "How to cite" citation and by `LICENSING.md`'s attribution example.
 * Bump alongside a real release, not per commit. */
export const CASEBOOK_VERSION = "Version 0.3";

/** Canonical public URL for the casebook, used the same places
 * `CASEBOOK_VERSION` is (the citation string) — never hardcode it elsewhere. */
export const CASEBOOK_URL = "https://paragraph-lab.org/casebook";

/** Zenodo DOI of the archived release that matches `CASEBOOK_VERSION`, used by
 * the About tab's citation. Each release gets its own version DOI from Zenodo;
 * update it together with `CASEBOOK_VERSION`. */
export const CASEBOOK_DOI = "10.5281/zenodo.23140493";

/** Public page about the PaRAGraph platform itself, linked from the app
 * header — never hardcode the URL string anywhere else. */
export const PROJECT_URL = "https://paragraph-lab.org/info";

/** Where a reader should send questions or corrections. */
export const CONTACT = { label: "ksenia@paragraph-lab.org", url: "mailto:ksenia@paragraph-lab.org" };

/** The companion research article, published as an arXiv preprint — the single
 * source for the Article tab's preprint card and the About tab's citation.
 * `data/article/ARTICLE_META.json` carries the same `absUrl` as `preprint_url`. */
export const COMPANION_ARTICLE = {
    title: "Beyond source attribution: Address authorship and comparability decisions in an LLM-built scholarly knowledge graph",
    authors: "Ksenia Kozha",
    arxivId: "2610.28663",
    category: "cs.DL",
    year: 2026,
    absUrl: "https://arxiv.org/abs/2610.28663",
    pdfUrl: "https://arxiv.org/pdf/2610.28663",
    doi: "10.48550/arXiv.2610.28663",
} as const;

export const COMPANION_ARTICLE_CITATION = `Kozha, K. A. ${COMPANION_ARTICLE.year}. ${COMPANION_ARTICLE.title}. arXiv:${COMPANION_ARTICLE.arxivId} [${COMPANION_ARTICLE.category}]. https://doi.org/${COMPANION_ARTICLE.doi}`;

export const COMPANION_ARTICLE_BIBTEX = `@misc{kozha2026beyond,
  author = {Kozha, K. A.},
  title = {${COMPANION_ARTICLE.title}},
  year = {${COMPANION_ARTICLE.year}},
  eprint = {${COMPANION_ARTICLE.arxivId}},
  archivePrefix = {arXiv},
  primaryClass = {${COMPANION_ARTICLE.category}},
  doi = {${COMPANION_ARTICLE.doi}},
  url = {${COMPANION_ARTICLE.absUrl}}
}`;
