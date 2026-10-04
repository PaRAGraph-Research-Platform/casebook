#!/usr/bin/env python3
"""Generate NOTICE.md — the list of third-party works this repository quotes
from, and how much of each is quoted — straight from the imported case
bundles under data/, for the case versions currently active in
src/cases/registry.ts.

Run via `npm run notice`, so NOTICE.md always matches the data actually
shipped (never hand-edited). `--check` (used by the vitest suite, see
src/notice.test.ts) regenerates the content and compares it against the
committed NOTICE.md without writing, exiting non-zero with a pointer to
`npm run notice` on any mismatch.

Every number in NOTICE.md is counted from data actually present in
core.json/supplement.json/sources.json — a source field this script cannot
find (e.g. no publisher recorded) is rendered as "—", never guessed.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = REPO_ROOT / "src" / "cases" / "registry.ts"
NOTICE_PATH = REPO_ROOT / "NOTICE.md"
DATA_DIR = REPO_ROOT / "data"

JURISDICTION_NOTE = (
    "Jurisdictional basis for quotation without a license (informational, not legal advice): "
    "EU InfoSoc Directive 2001/29/EC Art. 5(3)(d); Russian Federation Civil Code Art. 1274; "
    "PRC Copyright Law Art. 24(2); US 17 U.S.C. §107."
)

NO_FULL_TEXT_NOTE = (
    "No full texts, PDFs or whole chunks are distributed; only the quoted spans and their "
    "immediate context."
)


def find_case_blocks(registry_source: str) -> list[dict[str, str]]:
    """Extracts {id, shortLabel, dataVersion} for every `const c<N>Case: CaseDefinition = {...}`
    block in registry.ts — deliberately parsed from the source file rather than imported
    (this script runs under plain python3, with no TS toolchain), so a new case only needs
    adding to registry.ts itself for NOTICE.md to pick it up."""
    blocks = []
    for match in re.finditer(r"const \w+Case: CaseDefinition = \{(.*?)\n\};", registry_source, re.DOTALL):
        body = match.group(1)
        id_match = re.search(r'\bid:\s*"([^"]+)"', body)
        short_label_match = re.search(r'shortLabel:\s*"([^"]+)"', body)
        data_version_match = re.search(r'dataVersion:\s*"([^"]+)"', body)
        if id_match and short_label_match and data_version_match:
            blocks.append(
                {
                    "id": id_match.group(1),
                    "shortLabel": short_label_match.group(1),
                    "dataVersion": data_version_match.group(1),
                }
            )
    return blocks


def normalize_sources(raw: object) -> list[dict]:
    """Mirrors src/data/loadBundle.ts's normalizeSources: some bundles' sources.json
    is a bare array (C2, C4), others wrap it as {"sources": [...], ...} (C1, C3)."""
    if isinstance(raw, dict):
        return list(raw.get("sources", []))
    if isinstance(raw, list):
        return list(raw)
    return []


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8"))


def author_display(library: dict, csl_data: dict) -> str:
    """Author list, preferring the curator-checked `library.authors`
    ("Family, Given" strings) over `csl_data.author` — see the project's
    library/csl_data source-of-truth split (`src/types/bundle.ts`,
    `SourceLibraryRecord`). More than three authors abbreviate to the first
    three plus "et al."; the list itself is joined by "; "."""
    library_authors = library.get("authors") or []
    if library_authors:
        names = []
        for author in library_authors:
            if "," in author:
                family, _, given = author.partition(",")
                given = given.strip()
                family = family.strip()
                names.append(f"{given} {family}" if given else family)
            else:
                names.append(author.strip())
        return format_author_list(names)

    authors = csl_data.get("author") or []
    names = []
    for author in authors:
        given = author.get("given")
        family = author.get("family")
        if family and given:
            names.append(f"{given} {family}")
        elif family:
            names.append(family)
    if names:
        return format_author_list(names)
    return "—"


def format_author_list(names: list[str]) -> str:
    if len(names) > 3:
        return "; ".join(names[:3]) + "; et al."
    return "; ".join(names)


def publisher_venue_year(library: dict, csl_data: dict) -> str:
    publisher = library.get("journal") or csl_data.get("publisher") or csl_data.get("container-title") or "—"
    year = library.get("publication_year")
    if year is None:
        date_parts = (csl_data.get("issued") or {}).get("date-parts") or []
        year = date_parts[0][0] if date_parts and date_parts[0] else "—"
    return f"{publisher}, {year}"


def build_notice() -> str:
    case_blocks = find_case_blocks(REGISTRY_PATH.read_text(encoding="utf-8"))
    if not case_blocks:
        raise SystemExit("ERROR: no case blocks found in src/cases/registry.ts — refusing to write an empty NOTICE.md")

    # work_key -> aggregate state, keyed by document_id (stable across
    # bundles for the same underlying source document).
    works: dict[str, dict] = {}
    manifest_dates: list[str] = []
    context_by_work: dict[str, dict] = {}

    for case_block in case_blocks:
        # Folder = case id (data/c1..c4); dataVersion is the iteration id kept in MANIFEST.json.
        version_dir = DATA_DIR / case_block["id"]
        manifest = load_json(version_dir / "MANIFEST.json")
        if isinstance(manifest, dict) and manifest.get("created_at"):
            manifest_dates.append(manifest["created_at"])

        sources = normalize_sources(load_json(version_dir / "sources.json"))
        sources_by_doc = {s["document_id"]: s for s in sources if "document_id" in s}

        core = load_json(version_dir / "core.json")
        supplement = load_json(version_dir / "supplement.json")

        for record in [*core, *supplement]:
            native = record.get("native", {})
            annotation = record.get("annotation", {})
            document_id = native.get("document_id")
            if not document_id:
                continue

            quote = native.get("public_quote") or native.get("quote")
            if not quote:
                continue

            source = sources_by_doc.get(document_id)
            work = works.setdefault(
                document_id,
                {
                    "title": (source or {}).get("title") or native.get("source_title") or "—",
                    "csl_data": (source or {}).get("csl_data", {}),
                    "library": (source or {}).get("library", {}),
                    "quoted_passages": 0,
                    "characters_quoted": 0,
                    "longest_passage": 0,
                    "cases": set(),
                },
            )
            work["quoted_passages"] += 1
            work["characters_quoted"] += len(quote)
            work["longest_passage"] = max(work["longest_passage"], len(quote))
            work["cases"].add(case_block["shortLabel"])

            context_segments = native.get("public_context_segments") or annotation.get(
                "context_segments"
            ) or native.get("context_segments")
            if context_segments:
                context_state = context_by_work.setdefault(
                    document_id, {"segments": 0, "characters": 0}
                )
                context_state["segments"] += len(context_segments)
                context_state["characters"] += sum(len(seg.get("text", "")) for seg in context_segments)

    lines: list[str] = []
    lines.append("# NOTICE")
    lines.append("")
    lines.append(
        "This file inventories third-party works quoted in the core/supplement evidence records of this repository's "
        "case bundles, generated by `scripts/make_notice.py` directly from `data/` "
        "(`sources.json` + `core.json` + `supplement.json` of each active case version "
        "in `src/cases/registry.ts`). Do not edit by hand — run `npm run notice`."
    )
    lines.append("")
    lines.append(
        "The passage and character counts below cover core/supplement evidence records only. "
        "Quotations embedded in case narratives and curated tables are not included in these totals; "
        "they retain their source attributions and are also excluded from the CC BY 4.0 grant."
    )
    lines.append("")
    lines.append(
        "Quoted passages are reproduced under the quotation exception for purposes of "
        "analysis and criticism (see `LICENSING.md`); all rights in the quoted text "
        "remain with the respective rightsholders."
    )
    lines.append("")
    lines.append(
        "| Work | Author(s)/editor | Publisher/venue, year | Quoted passages | "
        "Characters quoted | Longest passage | Cases | Basis |"
    )
    lines.append("|---|---|---|---|---|---|---|---|")

    total_characters = 0
    for document_id in sorted(works, key=lambda d: works[d]["title"]):
        work = works[document_id]
        csl_data = work["csl_data"]
        library = work["library"]
        cases = ", ".join(sorted(work["cases"]))
        total_characters += work["characters_quoted"]
        lines.append(
            "| {title} | {author} | {publisher_year} | {passages} | {chars} chars | "
            "{longest} chars | {cases} | quotation exception (analysis and criticism), "
            "source and page named with each passage |".format(
                title=work["title"],
                author=author_display(library, csl_data),
                publisher_year=publisher_venue_year(library, csl_data),
                passages=work["quoted_passages"],
                chars=work["characters_quoted"],
                longest=work["longest_passage"],
                cases=cases,
            )
        )

    lines.append("")
    lines.append("## Context segments shipped with quoted passages, by source")
    lines.append("")
    lines.append(
        "These counts include both segments containing a quoted span and any surrounding context; "
        "they do not measure non-quoted text alone."
    )
    lines.append("")
    if context_by_work:
        for document_id in sorted(context_by_work, key=lambda d: works.get(d, {}).get("title", d)):
            title = works.get(document_id, {}).get("title", document_id)
            context_state = context_by_work[document_id]
            lines.append(
                f"- {title}: {context_state['segments']} context segment(s), "
                f"{context_state['characters']} characters"
            )
    else:
        lines.append("- (none recorded)")

    lines.append("")
    lines.append(f"**Total characters quoted in core/supplement evidence records: {total_characters}.**")
    lines.append("")
    snapshot_date = max(manifest_dates)[:10] if manifest_dates else "unknown"
    lines.append(f"Generated from case bundle data as of {snapshot_date} (each bundle's own `MANIFEST.json` `created_at`).")
    lines.append("")
    lines.append(NO_FULL_TEXT_NOTE)
    lines.append("")
    lines.append(JURISDICTION_NOTE)
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    content = build_notice()
    if "--check" in sys.argv[1:]:
        existing = NOTICE_PATH.read_text(encoding="utf-8") if NOTICE_PATH.exists() else ""
        if existing != content:
            print(
                "NOTICE.md is out of date with data/ — run `npm run notice` and commit the result.",
                file=sys.stderr,
            )
            return 1
        print("NOTICE.md is up to date.")
        return 0

    NOTICE_PATH.write_text(content, encoding="utf-8")
    print(f"Wrote {NOTICE_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
