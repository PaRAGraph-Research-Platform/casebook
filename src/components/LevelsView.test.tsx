import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import type { CasebookBundle } from "../types/bundle";
import { LevelsView } from "./LevelsView";

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

describe("LevelsView", () => {
    it("keeps derivation out of the main row buttons (moved to the technical footnote)", () => {
        const caseDef = getCaseDefinition("c3");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const store = new CasebookStore(caseDef, bundle);

        act(() => {
            root.render(<LevelsView store={store} />);
        });

        expect(container.querySelector(".levels-row-derivation")).toBeNull();
    });

    it("shows a dash in the technical footnote for a row with no derivation field", () => {
        const caseDef = getCaseDefinition("c3");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const levelsTable = bundle.levelsTable!;
        // Bundles from 0.2 on carry `derivation` on every row; strip it to
        // exercise the tolerant fallback used for older bundles.
        const patchedRows = levelsTable.rows.map((row) => {
            const { derivation: _dropped, ...rest } = row;
            return rest;
        });
        const store = new CasebookStore(caseDef, {
            ...bundle,
            levelsTable: { ...levelsTable, rows: patchedRows },
        });

        act(() => {
            root.render(<LevelsView store={store} />);
        });

        const footnote = container.querySelector(".tech-footnote");
        expect(footnote?.textContent).toContain("Derivation");
        expect(footnote?.textContent).not.toContain("Derived from source scheme records");
    });

    it("shows the reader-facing derivation label in the technical footnote for a row that carries a derivation field", () => {
        const caseDef = getCaseDefinition("c3");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const levelsTable = bundle.levelsTable!;
        const patchedRows = levelsTable.rows.map((row, index) =>
            index === 0 ? { ...row, derivation: "derived_from_schemes_layer" as const } : row
        );
        const store = new CasebookStore(caseDef, {
            ...bundle,
            levelsTable: { ...levelsTable, rows: patchedRows },
        });

        act(() => {
            root.render(<LevelsView store={store} />);
        });

        const footnote = container.querySelector(".tech-footnote");
        expect(footnote?.textContent).toContain("Derived from source scheme records");
    });
});
