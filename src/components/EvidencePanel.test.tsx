import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import type { CasebookBundle, CoreRecord } from "../types/bundle";
import { EvidencePanel } from "./EvidencePanel";

/** Builds a store whose bundle has one core claim's annotation patched with
 * extra fields, without mutating the shared, module-level imported JSON
 * (loadBundle's JSON imports are singletons reused across every test file
 * in the run). */
function storeWithPatchedClaim(claimId: string, patch: Partial<CoreRecord["annotation"]>): CasebookStore {
    const caseDef = getCaseDefinition("c2");
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

describe("EvidencePanel", () => {
    it("falls back to the origin_kind-based editorial label when a claim carries no origin_method", () => {
        const store = new CasebookStore(getCaseDefinition("c2"), getCaseDefinition("c2").loadBundle());
        const claim = store.combinedClaims[0];
        store.selectNode(claim.native.claim_id);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("Labels added by the editors");
        expect(container.textContent).not.toContain("Extracted by model");
    });

    it("shows the origin_method label and review_status badge instead of calling model-extracted content editorial", () => {
        const claimId = "claim_1cd75cb6f867faacbf730003";
        const store = storeWithPatchedClaim(claimId, {
            origin_method: "model_extracted",
            review_status: "unreviewed",
        });
        store.selectNode(claimId);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("Extracted by model");
        expect(container.textContent).toContain("Not yet expert-reviewed");
        expect(container.textContent).not.toContain("Labels added by the editors");
    });

    it("shows a Verifier note block when the claim carries verifier_note_en, and none when it doesn't", () => {
        const claimId = "claim_1cd75cb6f867faacbf730003";
        const store = storeWithPatchedClaim(claimId, {
            verifier_note_en: "Cross-checked against the 1987 survey; wording matches.",
        });
        store.selectNode(claimId);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });
        expect(container.textContent).toContain("Verifier note");
        expect(container.textContent).toContain("Cross-checked against the 1987 survey");

        const bareStore = new CasebookStore(getCaseDefinition("c2"), getCaseDefinition("c2").loadBundle());
        bareStore.selectNode(claimId);
        act(() => {
            root.render(<EvidencePanel store={bareStore} />);
        });
        expect(container.textContent).not.toContain("Verifier note");
    });

    it("shows the author-unit sentence, with attribution when the source credits a third party", () => {
        const claimId = "claim_1cd75cb6f867faacbf730003";
        const store = storeWithPatchedClaim(claimId, {
            author_unit: { unit_as_written: "兩陽片", rank_as_written: "片", attributed_to: "熊正辉 1987" },
        });
        store.selectNode(claimId);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("Unit as named by the author: 兩陽片 (片)");
        expect(container.textContent).toContain("as attributed to 熊正辉 1987 by this source");
    });

    it("shows the C4 Pair & basis review block, the native scan/printed page, and the Full passage context accordion", () => {
        const caseDef = getCaseDefinition("c4");
        const store = new CasebookStore(caseDef, caseDef.loadBundle());
        store.selectAnchor("G1");

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("Pair & basis review");
        expect(container.textContent).toContain("P01");
        expect(container.textContent).toContain(
            "A — number and evidential basis both correct"
        );
        expect(container.textContent).toMatch(/scan \d+(–\d+)? \/ printed/);

        const accordion = container.querySelector(".full-passage-context-accordion");
        expect(accordion).not.toBeNull();
        expect(accordion?.textContent).toContain("Full passage context");
    });

    it("shows the human-readable rights label instead of the raw rights value", () => {
        const store = new CasebookStore(getCaseDefinition("c2"), getCaseDefinition("c2").loadBundle());
        const claim = store.combinedClaims[0];
        store.selectNode(claim.native.claim_id);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("Quoted under the quotation exception; full text not redistributed");
        expect(container.textContent).not.toContain("not_cleared_for_public_redistribution");
        expect(container.textContent).not.toContain("internal_only");
    });

    it("shows an abridged-quotation note when the claim's annotation carries quote_trimmed", () => {
        const claimId = "claim_1cd75cb6f867faacbf730003";
        const store = storeWithPatchedClaim(claimId, {
            quote_trimmed: true,
            quote_trim_note_en: "abridged quotation — see the source, p. 42",
        });
        store.selectNode(claimId);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).toContain("abridged quotation");
        const note = container.querySelector(".quote-abridged-note");
        expect(note).not.toBeNull();
        expect(note?.getAttribute("title")).toBe("abridged quotation — see the source, p. 42");

        const bareStore = new CasebookStore(getCaseDefinition("c2"), getCaseDefinition("c2").loadBundle());
        bareStore.selectNode(claimId);
        act(() => {
            root.render(<EvidencePanel store={bareStore} />);
        });
        expect(container.querySelector(".quote-abridged-note")).toBeNull();
    });

    it("does not render the Pair & basis review block for a claim with no pair_id (C2)", () => {
        const store = new CasebookStore(getCaseDefinition("c2"), getCaseDefinition("c2").loadBundle());
        const claim = store.combinedClaims[0];
        store.selectNode(claim.native.claim_id);

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(container.textContent).not.toContain("Pair & basis review");
    });

    it("opens a C4 supplement record (GS/TS subgroup-address anchor) the same way a core record opens", () => {
        const store = new CasebookStore(getCaseDefinition("c4"), getCaseDefinition("c4").loadBundle());
        // GS7 lives in c4's supplement.json, not core.json (see
        // combinedClaims.ts merging both) — this is the anchor a Passport
        // row resolves to via its by_subgroup_address link_method.
        const supplementClaim = store.combinedClaims.find((claim) => claim.annotation.anchor === "GS7");
        expect(supplementClaim).toBeDefined();
        expect(store.bundle.core.some((record) => record.native.claim_id === supplementClaim!.native.claim_id)).toBe(
            false
        );
        expect(
            store.bundle.supplement.some((record) => record.native.claim_id === supplementClaim!.native.claim_id)
        ).toBe(true);

        store.selectAnchor("GS7");

        act(() => {
            root.render(<EvidencePanel store={store} />);
        });

        expect(store.selectedClaim?.annotation.anchor).toBe("GS7");
        expect(container.textContent).toContain("GS7");
        expect(container.querySelector(".evidence-main-quote")?.textContent).toBe(supplementClaim!.native.quote);
    });
});
