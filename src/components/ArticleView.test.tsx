import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_ARTICLE, PLACEHOLDER_ARTICLE } from "../article/articleFixture.testdata";
import { CONTACT } from "../config";
import { ArticleView } from "./ArticleView";

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

describe("ArticleView — placeholder (no article text vendored)", () => {
    it("shows the in-preparation notice and a contact link, and no article body", () => {
        act(() => {
            root.render(<ArticleView onOpenLink={vi.fn()} article={PLACEHOLDER_ARTICLE} />);
        });
        const text = container.textContent ?? "";
        expect(text).toContain("A companion research article is in preparation");
        expect(text).toContain("once a preprint is available");

        const contact = container.querySelector<HTMLAnchorElement>(`a[href="${CONTACT.url}"]`);
        expect(contact).not.toBeNull();
        expect(contact!.textContent).toBe(CONTACT.label);
        expect(contact!.getAttribute("target")).toBe("_blank");
        expect(contact!.getAttribute("rel")).toBe("noopener");

        expect(container.querySelector(".article-markdown")).toBeNull();
        expect(container.querySelector(".article-toc")).toBeNull();
        expect(container.querySelector(".article-status-pill")).toBeNull();
    });

    it("links to the preprint when META carries a preprint_url", () => {
        const url = "https://example.org/preprint";
        act(() => {
            root.render(
                <ArticleView
                    onOpenLink={vi.fn()}
                    article={{ ...PLACEHOLDER_ARTICLE, meta: { ...PLACEHOLDER_ARTICLE.meta, preprint_url: url } }}
                />
            );
        });
        const link = container.querySelector<HTMLAnchorElement>(`a[href="${url}"]`);
        expect(link).not.toBeNull();
        expect(link!.getAttribute("target")).toBe("_blank");
        expect(link!.getAttribute("rel")).toBe("noopener");
    });

    it("has no preprint link when META has no preprint_url", () => {
        act(() => {
            root.render(<ArticleView onOpenLink={vi.fn()} article={PLACEHOLDER_ARTICLE} />);
        });
        const hrefs = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href"));
        expect(hrefs).toEqual([CONTACT.url]);
    });
});

describe("ArticleView — rendered article (text vendored)", () => {
    function renderFixture(onOpenLink = vi.fn()) {
        act(() => {
            root.render(<ArticleView onOpenLink={onOpenLink} article={FIXTURE_ARTICLE} />);
        });
        return onOpenLink;
    }

    it("renders a status banner with title, author and version/date pill, no raw frontmatter", () => {
        renderFixture();
        const banner = container.querySelector(".article-banner");
        expect(banner?.querySelector("h2")?.textContent).toBe("Fixture Article About Comparison");
        expect(banner?.querySelector(".article-author")?.textContent).toBe("A. N. Author");
        expect(banner?.querySelector(".article-status-pill")?.textContent).toBe("Working draft v9 · 15 Jan 2026");
        expect(container.textContent ?? "").not.toContain("in preparation");

        // The frontmatter delimiter and raw "title:"/"author:" lines must
        // never reach rendered text — only the parsed values above should.
        expect(container.textContent ?? "").not.toContain("---");
        expect(container.textContent ?? "").not.toMatch(/^title:/m);
        expect(container.textContent ?? "").not.toMatch(/^author:/m);
    });

    it("builds a table of contents from the article's h1 sections", () => {
        renderFixture();
        const tocLinks = Array.from(container.querySelectorAll(".article-toc a")).map((a) => a.textContent);
        expect(tocLinks).toEqual(["1 The question and the contribution", "Evidence routes", "References"]);
    });

    it("clicking a case-id chip (C2) calls onOpenLink with that case and no anchor", () => {
        const onOpenLink = renderFixture();
        const chip = container.querySelector<HTMLButtonElement>('[data-case="c2"]:not([data-anchor])');
        expect(chip).not.toBeNull();
        act(() => {
            chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(onOpenLink).toHaveBeenCalledWith("c2", undefined);
    });

    it("clicking a record chip (S4 in Evidence routes, resolved to C2) calls onOpenLink with the anchor", () => {
        const onOpenLink = renderFixture();
        const chip = container.querySelector<HTMLButtonElement>('[data-anchor="S4"][data-case="c2"]');
        expect(chip).not.toBeNull();
        act(() => {
            chip!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        });
        expect(onOpenLink).toHaveBeenCalledWith("c2", "S4");
    });

    it("resolves 'C4' to a clickable chip, since a c4 case is registered", () => {
        renderFixture();
        expect(container.querySelector('[data-case="c4"]')).not.toBeNull();
    });

    it("resolves the same record letter+number to different cases in different Evidence-routes sentences (K1 collision)", () => {
        renderFixture();
        expect(container.querySelector('[data-case="c2"][data-anchor="K1"]')).not.toBeNull();
        expect(container.querySelector('[data-case="c3"][data-anchor="K1"]')).not.toBeNull();
    });
});
