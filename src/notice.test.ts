import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * NOTICE.md is generated (never hand-edited) by scripts/make_notice.py
 * directly from data/ — see that script's own docstring. `--check`
 * regenerates it in memory and diffs against the committed file without
 * writing, so this test fails the moment the two drift apart (a bundle
 * re-import that changed quoted content without running `npm run notice`,
 * or a hand-edit to NOTICE.md itself), with the same message a contributor
 * sees locally.
 */
describe("NOTICE.md matches scripts/make_notice.py's output for the current data/", () => {
    it("passes make_notice.py --check", () => {
        expect(() => {
            execFileSync("python3", ["-B", "scripts/make_notice.py", "--check"], {
                cwd: process.cwd(),
                stdio: "pipe",
            });
        }).not.toThrow();
    });

    it("describes shipped context segments without calling them non-quoted", () => {
        const notice = String(
            execFileSync("python3", ["-B", "-c", "from pathlib import Path; print(Path('NOTICE.md').read_text(encoding='utf-8'))"], {
                cwd: process.cwd(),
                stdio: "pipe",
            })
        );
        expect(notice).toContain("## Context segments shipped with quoted passages, by source");
        expect(notice).toContain("they do not measure non-quoted text alone.");
        expect(notice).not.toContain("Surrounding (non-quoted) context segments");
        expect(notice).toContain("counts below cover core/supplement evidence records only");
        expect(notice).toContain("Quotations embedded in case narratives and curated tables are not included");
    });
});
