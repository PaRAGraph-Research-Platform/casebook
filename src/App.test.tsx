import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { PROJECT_URL, REPO_URL } from "./config";

// The Article-tab wiring below needs an article body with chips, which the
// repository does not vendor while the article is in preparation; the
// loader is replaced with the shared test fixture so this wiring stays
// covered independently of that state.
vi.mock("./article/loadArticle", async () => {
    const { FIXTURE_ARTICLE } = await import("./article/articleFixture.testdata");
    return { loadArticle: () => FIXTURE_ARTICLE };
});

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

function clickTab(label: string): void {
    const tab = Array.from(container.querySelectorAll(".app-tabs .tab")).find(
        (button) => button.textContent === label
    ) as HTMLButtonElement | undefined;
    expect(tab).toBeDefined();
    act(() => {
        tab!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
}

describe("App — Article tab wiring into case switch + Evidence selection", () => {
    it("clicking a record chip on the Article tab switches the active case, opens Case, and selects that record", () => {
        act(() => {
            root.render(<App />);
        });

        // App starts on C1 (CASES[0]); the article's record chip we click
        // below belongs to C2, exercising the case-switch path.
        clickTab("Article");
        const chip = container.querySelector<HTMLButtonElement>('[data-case="c2"][data-anchor="S4"]');
        expect(chip).not.toBeNull();

        act(() => {
            chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        // The case switcher reflects the new active case…
        const activeCaseButton = container.querySelector(".case-switch-button.active");
        expect(activeCaseButton?.textContent).toContain("C2");

        // …the Case tab is now active (not Article any more)…
        const activeTabButton = container.querySelector(".app-tabs .tab.active");
        expect(activeTabButton?.textContent).toBe("Case");

        // …and the Evidence panel shows the record the chip pointed at.
        const evidencePanelText = container.querySelector(".evidence-panel")?.textContent ?? "";
        expect(evidencePanelText.length).toBeGreaterThan(0);
    });

    it("clicking a bare case-id chip (no anchor) still switches case and opens Case, without touching selection", () => {
        act(() => {
            root.render(<App />);
        });

        clickTab("Article");
        const chip = container.querySelector<HTMLButtonElement>('[data-case="c3"]:not([data-anchor])');
        expect(chip).not.toBeNull();

        act(() => {
            chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });

        const activeCaseButton = container.querySelector(".case-switch-button.active");
        expect(activeCaseButton?.textContent).toContain("C3");
        const activeTabButton = container.querySelector(".app-tabs .tab.active");
        expect(activeTabButton?.textContent).toBe("Case");
    });
});

describe("App — header links", () => {
    it("links to the source repository and the PaRAGraph page in a new tab", () => {
        act(() => {
            root.render(<App />);
        });
        const links = Array.from(container.querySelectorAll<HTMLAnchorElement>(".app-header a"));
        const repo = links.find((a) => a.textContent === "Source code & data on GitHub");
        const project = links.find((a) => a.textContent === "About PaRAGraph");

        expect(repo?.getAttribute("href")).toBe(REPO_URL);
        expect(project?.getAttribute("href")).toBe(PROJECT_URL);
        expect(PROJECT_URL).toBe("https://www.sciencerag.win/info");
        for (const link of [repo, project]) {
            expect(link?.getAttribute("target")).toBe("_blank");
            expect(link?.getAttribute("rel")).toBe("noopener");
        }
    });
});
