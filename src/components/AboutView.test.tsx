import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CASES } from "../cases/registry";
import { CASEBOOK_URL, CASEBOOK_VERSION, CONTACT, REPO_URL } from "../config";
import { AboutView } from "./AboutView";

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

describe("AboutView", () => {
    it("contains publication-ready copy without lifecycle disclaimers or raw manifest statuses", () => {
        act(() => {
            root.render(<AboutView />);
        });
        const text = container.textContent ?? "";
        expect(text).not.toMatch(/TODO/);
        expect(text).not.toMatch(/not yet resolved/i);
        expect(text).not.toMatch(/do not publish/i);
        expect(text).not.toMatch(/public preview/i);
        expect(text).not.toMatch(/not a frozen release/i);
        expect(text).not.toMatch(/public scope.*not yet assigned/i);
        for (const caseDef of CASES) {
            const bundle = caseDef.loadBundle();
            expect(text).toContain(bundle.manifest.version);
            expect(text).not.toContain(bundle.manifest.status);
        }
    });

    it("shows the Licence section with links to LICENSE, LICENSING.md and NOTICE.md", () => {
        act(() => {
            root.render(<AboutView />);
        });
        expect(container.textContent).toContain("Licence, quotations and how to cite");
        const links = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
        expect(links).toContain(`${REPO_URL}/blob/main/LICENSE`);
        expect(links).toContain(`${REPO_URL}/blob/main/LICENSING.md`);
        expect(links).toContain(`${REPO_URL}/blob/main/NOTICE.md`);
    });

    it("shows a How to cite section built from CASEBOOK_VERSION/CASEBOOK_URL, and a Contact section using CONTACT", () => {
        act(() => {
            root.render(<AboutView />);
        });
        const text = container.textContent ?? "";
        expect(text).toContain("Kozha, K. A. 2026.");
        expect(text).toContain(CASEBOOK_URL);
        expect(text).toMatch(new RegExp(CASEBOOK_VERSION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
        expect(text).toContain("The companion research article is in preparation; the Article tab will carry its text once a preprint is available.");

        const contactLink = Array.from(container.querySelectorAll("a")).find(
            (a) => a.getAttribute("href") === CONTACT.url
        );
        expect(contactLink).toBeDefined();
    });

    it("uses the public numeric casebook version without a preview qualifier", () => {
        act(() => {
            root.render(<AboutView />);
        });
        expect(CASEBOOK_VERSION).toBe("Version 0.3");
        expect(container.textContent).toContain(CASEBOOK_VERSION);
        expect(container.textContent).not.toMatch(/preview/i);
    });
});
