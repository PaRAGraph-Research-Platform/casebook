import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCaseDefinition } from "../cases/registry";
import { CasebookStore } from "../stores/CasebookStore";
import type { CasebookBundle } from "../types/bundle";
import { PositionsView } from "./PositionsView";

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

describe("PositionsView", () => {
    it("keeps the derivation column out of the main table (moved to the technical footnote)", () => {
        const caseDef = getCaseDefinition("c1");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const store = new CasebookStore(caseDef, bundle);

        act(() => {
            root.render(<PositionsView store={store} />);
        });

        const rendered = container.querySelector(".positions-table");
        expect(rendered?.textContent).not.toContain("Derivation");
    });

    it("shows a dash in the technical footnote's Derivation column for a row with no derivation field", () => {
        const caseDef = getCaseDefinition("c1");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const table = bundle.positionsTable!;
        // Bundles from 0.2 on carry `derivation` on every row; older ones do not.
        // Strip it from the first row to exercise the tolerant fallback.
        const patchedRows = table.rows.map((row, index) => {
            if (index !== 0) return row;
            const { derivation: _dropped, ...rest } = row;
            return rest;
        });
        const store = new CasebookStore(caseDef, {
            ...bundle,
            positionsTable: { ...table, rows: patchedRows },
        });

        act(() => {
            root.render(<PositionsView store={store} />);
        });

        const footnote = container.querySelector(".tech-footnote");
        expect(footnote?.textContent).toContain("Derivation");
        const firstDataRow = footnote?.querySelector("tbody tr");
        expect(firstDataRow?.lastElementChild?.textContent).toBe("—");
    });

    it("renders the reader-facing derivation label in the technical footnote for a row that carries a derivation field", () => {
        const caseDef = getCaseDefinition("c1");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const table = bundle.positionsTable!;
        const patchedRows = table.rows.map((row, index) =>
            index === 0 ? { ...row, derivation: "editor_inferred_from_boundary_description" as const } : row
        );
        const store = new CasebookStore(caseDef, {
            ...bundle,
            positionsTable: { ...table, rows: patchedRows },
        });

        act(() => {
            root.render(<PositionsView store={store} />);
        });

        const footnote = container.querySelector(".tech-footnote");
        const firstDataRow = footnote?.querySelector("tbody tr");
        expect(firstDataRow?.lastElementChild?.textContent).toBe("Editor's reading of a boundary description");
    });

    it("renders reader-facing comparability labels instead of raw enum values", () => {
        const caseDef = getCaseDefinition("c1");
        const bundle: CasebookBundle = caseDef.loadBundle();
        const store = new CasebookStore(caseDef, bundle);

        act(() => {
            root.render(<PositionsView store={store} />);
        });

        const rendered = container.querySelector(".positions-table");
        expect(rendered?.textContent).toContain("Comparable at the pian level");
        expect(rendered?.textContent).toContain("Reported only");
        expect(rendered?.textContent).not.toContain("comparable_at_pian_level");
        expect(rendered?.textContent).not.toContain("reported_only");
    });
});
