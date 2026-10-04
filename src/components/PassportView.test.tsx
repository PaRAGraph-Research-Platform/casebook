import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import { PassportView } from "./PassportView";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => {
        root.unmount();
    });
    container.remove();
});

function newC4Store(): CasebookStore {
    const caseDef = getCaseDefinition("c4");
    return new CasebookStore(caseDef, caseDef.loadBundle());
}

describe("PassportView", () => {
    it("renders all three idiom passports and switches between them", () => {
        const store = newC4Store();

        act(() => {
            root.render(<PassportView store={store} />);
        });

        const switcher = container.querySelectorAll(".passport-idiom-button");
        expect(switcher.length).toBe(3);
        expect(container.textContent).toContain("Guangzhou");

        const taishanButton = Array.from(switcher).find((b) => b.textContent === "Taishan") as HTMLButtonElement;
        act(() => {
            taishanButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(store.passportIdiom).toBe("TAISHAN");
        // Taishan's own passport entries (黄剑云 2017) replace Guangzhou's
        // (Bauer, Benedict 1997).
        expect(container.textContent).toContain("黄剑云 2017");
        expect(container.textContent).not.toContain("Bauer, Benedict");
    });

    it("clicking a linked passport row highlights its claims and switches to Explore", () => {
        const store = newC4Store();
        store.setPassportIdiom("XINYI");

        act(() => {
            root.render(<PassportView store={store} />);
        });

        const linkedRow = container.querySelector(".passport-row-linked") as HTMLTableRowElement;
        expect(linkedRow).not.toBeNull();

        act(() => {
            linkedRow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        expect(store.activeTab).toBe("explore");
        expect(store.highlightedNodeIds.size).toBeGreaterThan(0);
    });

    it("shows a 'no matching record' pill for a row with no linked claim_ids, and it is not clickable", () => {
        const store = newC4Store();
        store.setPassportIdiom("CANTONESE_STD");

        act(() => {
            root.render(<PassportView store={store} />);
        });

        expect(container.textContent).toContain("no matching record in the graph");
        const rows = Array.from(container.querySelectorAll(".passport-row"));
        const unlinkedRow = rows.find((row) => !row.classList.contains("passport-row-linked"));
        expect(unlinkedRow).toBeDefined();

        const before = store.selectedNodeId;
        act(() => {
            unlinkedRow!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        // No onClick handler attached — clicking it must not change selection/tab.
        expect(store.selectedNodeId).toBe(before);
        expect(store.activeTab).toBe("case");
    });

    it("labels a subgroup-address linked row distinctly from a locality-tag linked row", () => {
        const store = newC4Store();
        store.setPassportIdiom("CANTONESE_STD");

        act(() => {
            root.render(<PassportView store={store} />);
        });

        expect(container.textContent).toContain("found via subgroup address");
    });

    it("labels a locality-tag linked row and exposes its anchors as clickable chips", () => {
        const store = newC4Store();
        store.setPassportIdiom("TAISHAN");

        act(() => {
            root.render(<PassportView store={store} />);
        });

        expect(container.textContent).toContain("found by locality tag");
        const chip = Array.from(container.querySelectorAll(".passport-anchor-chips .anchor-link")).find(
            (b) => b.textContent === "T1"
        ) as HTMLButtonElement | undefined;
        expect(chip).toBeDefined();

        act(() => {
            chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(store.anchorToClaimId.get("T1")).toBeDefined();
        expect(store.selectedNodeId).toBe(store.anchorToClaimId.get("T1"));
    });

    it("shows a computed linkage summary sentence above the table, not hardcoded", () => {
        const store = newC4Store();
        act(() => {
            root.render(<PassportView store={store} />);
        });

        const summary = container.querySelector(".passport-linkage-summary");
        expect(summary).not.toBeNull();
        // Regression guard against a hardcoded stale count: recompute the
        // same totals directly from the bundle and check the sentence
        // actually reflects them.
        const passports = store.bundle.passports!;
        let total = 0;
        let linked = 0;
        for (const idiom of Object.values(passports)) {
            for (const entry of idiom.entries) {
                total += 1;
                if (entry.annotation.link_method === "by_locality_tag" || entry.annotation.link_method === "by_subgroup_address") {
                    linked += 1;
                }
            }
        }
        expect(summary!.textContent).toContain(`${linked} of ${total}`);
    });

    it("shows no raw entry ids or idiom_tag codes in the main table for any idiom", () => {
        for (const idiom of ["CANTONESE_STD", "TAISHAN", "XINYI"]) {
            const store = newC4Store();
            store.setPassportIdiom(idiom);

            act(() => {
                root.render(<PassportView store={store} />);
            });

            const table = container.querySelector(".passport-table");
            expect(table).not.toBeNull();
            // A curator's own linked_claim_note can legitimately cross-
            // reference another passport row by its entry id (e.g. "two
            // passport entries (01, 03) compete for the same group" reads
            // "XINYI-01" in Xinyi's own notes) — that free text sits behind
            // its own closed "Note" disclosure, the same convention as
            // EvidencePanel's "Technical identifiers" accordion, so it is
            // excluded here rather than the main reading flow it never
            // reaches.
            const clone = table!.cloneNode(true) as HTMLElement;
            clone.querySelectorAll(".passport-row-note").forEach((note) => note.remove());
            // Entry ids look like "TAISHAN-01"; the raw idiom_tag itself
            // (e.g. "CANTONESE_STD") is a technical code, not reader-facing
            // text — neither should leak into the visible table body.
            expect(clone.textContent).not.toMatch(/\b[A-Z_]+-\d+\b/);
            expect(clone.textContent).not.toContain("CANTONESE_STD");
        }
    });
});
