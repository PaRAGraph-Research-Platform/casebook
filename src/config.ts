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
export const CASEBOOK_URL = "https://www.sciencerag.win/casebook";

/** Zenodo DOI of the archived release that matches `CASEBOOK_VERSION`, used by
 * the About tab's citation. Each release gets its own version DOI from Zenodo;
 * update it together with `CASEBOOK_VERSION`. */
export const CASEBOOK_DOI = "10.5281/zenodo.23140493";

/** Public page about the PaRAGraph platform itself, linked from the app
 * header — never hardcode the URL string anywhere else. */
export const PROJECT_URL = "https://www.sciencerag.win/info";

/** Where a reader should send questions or corrections. */
export const CONTACT = { label: "ksenia@sciencerag.win", url: "mailto:ksenia@sciencerag.win" };
