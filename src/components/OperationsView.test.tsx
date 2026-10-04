import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import { OperationsView } from "./OperationsView";

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

describe("OperationsView", () => {
    it("shows C4's addressing_gap as a recorded editorial observation, not a browser recomputation", () => {
        const caseDef = getCaseDefinition("c4");
        const store = new CasebookStore(caseDef, caseDef.loadBundle());
        const entry = store.bundle.nativeOperations.context_findings?.addressing_gap;
        expect(entry).toBeDefined();
        expect(entry!.reader_visible).toBe(true);

        act(() => {
            root.render(<OperationsView store={store} />);
        });

        expect(container.textContent).toContain(entry!.title_en);
        expect(container.textContent).toContain(entry!.finding_en);
        expect(container.textContent).toContain(
            "Recorded editorial observation — supplied with this bundle; not recomputed in this browser."
        );
        expect(container.textContent).toContain(
            "The native operations below are checked against the same claim/evidence data this page ships with"
        );
        expect(container.textContent).toContain(
            "Curated editorial observations in the findings list are supplied as recorded bundle content"
        );
        expect(container.textContent).not.toContain("Each finding above was recomputed in your browser");
    });

    it("does not show a context finding for a case whose bundle carries none (C1)", () => {
        const caseDef = getCaseDefinition("c1");
        const store = new CasebookStore(caseDef, caseDef.loadBundle());
        expect(store.bundle.nativeOperations.context_findings).toBeUndefined();

        act(() => {
            root.render(<OperationsView store={store} />);
        });

        expect(container.textContent).not.toContain("Same book, two kinds of address");
    });
});
