import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import { CaseView } from "./CaseView";

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
    vi.restoreAllMocks();
});

describe("CaseView", () => {
    it("selects and flashes an anchor, restarts the flash on repeat click, and clears it after animation", () => {
        const caseDef = getCaseDefinition("c1");
        const store = new CasebookStore(caseDef, caseDef.loadBundle());
        const firstClaim = store.combinedClaims[0];
        let reflowReads = 0;
        vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(() => {
            reflowReads += 1;
            return 0;
        });

        act(() => {
            root.render(<CaseView store={store} />);
        });

        const button = container.querySelector<HTMLButtonElement>(
            `[data-anchor="${firstClaim.annotation.anchor}"]`
        );
        expect(button).not.toBeNull();

        act(() => {
            button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(store.selectedNodeId).toBe(firstClaim.native.claim_id);
        expect(button?.classList.contains("anchor-flash")).toBe(true);

        act(() => {
            button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(reflowReads).toBe(2);
        expect(button?.classList.contains("anchor-flash")).toBe(true);

        act(() => {
            button!.dispatchEvent(new Event("animationend", { bubbles: true }));
        });
        expect(button?.classList.contains("anchor-flash")).toBe(false);
    });
});
