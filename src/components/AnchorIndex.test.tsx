import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import type { CasebookBundle } from "../types/bundle";
import { AnchorIndex } from "./AnchorIndex";

function newStore(caseId: "c1" | "c2"): CasebookStore {
    const caseDef = getCaseDefinition(caseId);
    return new CasebookStore(caseDef, caseDef.loadBundle());
}

/** Same non-mutating patch convention as EvidencePanel.test.tsx: loadBundle's
 * JSON imports are module-level singletons shared with every other test
 * file in the run. */
function newStoreWithPatchedClaim(
    caseId: "c1" | "c2",
    claimId: string,
    patch: { verifier_note_en?: string }
): CasebookStore {
    const caseDef = getCaseDefinition(caseId);
    const bundle: CasebookBundle = caseDef.loadBundle();
    const patchedCore = bundle.core.map((record) =>
        record.native.claim_id === claimId ? { ...record, annotation: { ...record.annotation, ...patch } } : record
    );
    return new CasebookStore(caseDef, { ...bundle, core: patchedCore });
}

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

describe("AnchorIndex", () => {
    it("renders C2's K3 with its quote (truncated) and printed page, without its claim_id in the visible table", () => {
        const store = newStore("c2");
        const claim = store.combinedClaims.find((c) => c.annotation.anchor === "K3");
        expect(claim).toBeDefined();

        act(() => {
            root.render(<AnchorIndex store={store} />);
        });

        const table = container.querySelector(".anchor-index-table");
        expect(table).not.toBeNull();
        const tableText = table!.textContent ?? "";

        expect(tableText).toContain("K3");
        expect(tableText).toContain("printed 311");
        // The full quote is >240 chars, so the visible table shows a
        // truncated form with an ellipsis and a "show full quote" toggle,
        // not the raw claim_id.
        expect(claim!.native.quote!.length).toBeGreaterThan(240);
        expect(tableText).toContain(claim!.native.quote!.slice(0, 240));
        expect(tableText).toContain("…");
        expect(tableText).toContain("show full quote");
        expect(tableText).not.toContain(claim!.native.claim_id);
        expect(tableText).not.toContain(claim!.native.evidence_id);

        // Claim/evidence ids only live in the collapsed technical accordion.
        const technical = container.querySelector(".anchor-index-technical");
        expect(technical?.textContent).toContain(claim!.native.claim_id);
        expect(technical?.textContent).toContain(claim!.native.evidence_id);
    });

    it("expands the K3 quote in full on 'show full quote' click", () => {
        const store = newStore("c2");
        const claim = store.combinedClaims.find((c) => c.annotation.anchor === "K3")!;

        act(() => {
            root.render(<AnchorIndex store={store} />);
        });

        const toggle = Array.from(container.querySelectorAll("button.quote-toggle")).find(
            (b) => b.closest("tr")?.textContent?.includes("K3")
        ) as HTMLButtonElement;
        expect(toggle).toBeDefined();

        act(() => {
            toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        const table = container.querySelector(".anchor-index-table");
        expect(table?.textContent).toContain(claim.native.quote);
    });

    it("renders C1's anchor C1 with its own quote and printed page, without its claim_id in the visible table", () => {
        const store = newStore("c1");
        const claim = store.combinedClaims.find((c) => c.annotation.anchor === "C1");
        expect(claim).toBeDefined();

        act(() => {
            root.render(<AnchorIndex store={store} />);
        });

        const table = container.querySelector(".anchor-index-table");
        const tableText = table!.textContent ?? "";

        expect(tableText).toContain("printed 176");
        expect(tableText).not.toContain(claim!.native.claim_id);
        expect(tableText).not.toContain(claim!.native.evidence_id);

        const technical = container.querySelector(".anchor-index-technical");
        expect(technical?.textContent).toContain(claim!.native.claim_id);
    });

    it("orders anchors as they appear in the bundle (core.json then supplement.json)", () => {
        const store = newStore("c1");
        act(() => {
            root.render(<AnchorIndex store={store} />);
        });
        const anchorButtons = Array.from(container.querySelectorAll(".anchor-index-table [data-anchor]")).map(
            (el) => el.getAttribute("data-anchor")
        );
        expect(anchorButtons).toEqual(store.combinedClaims.map((c) => c.annotation.anchor));
    });

    it("shows a Verifier note next to a claim's row when it carries verifier_note_en, and shows none when it doesn't", () => {
        const claimId = "claim_1cd75cb6f867faacbf730003";
        const store = newStoreWithPatchedClaim("c2", claimId, {
            verifier_note_en: "Cross-checked against the 1987 survey; wording matches.",
        });

        act(() => {
            root.render(<AnchorIndex store={store} />);
        });

        const table = container.querySelector(".anchor-index-table");
        expect(table?.textContent).toContain("Verifier note");
        expect(table?.textContent).toContain("Cross-checked against the 1987 survey");

        const bareStore = newStore("c2");
        act(() => {
            root.render(<AnchorIndex store={bareStore} />);
        });
        const bareTable = container.querySelector(".anchor-index-table");
        expect(bareTable?.textContent).not.toContain("Verifier note");
    });
});
