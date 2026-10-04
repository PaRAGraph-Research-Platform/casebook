import { observer } from "mobx-react-lite";
import { useMemo, type AnimationEvent, type MouseEvent } from "react";
import type { CasebookStore } from "../stores/CasebookStore";
import { renderCaseMarkdown, splitAnchorIndexSection } from "../utils/renderCaseMarkdown";
import { AnchorIndex } from "./AnchorIndex";

interface CaseViewProps {
    store: CasebookStore;
}

export const CaseView = observer(function CaseView({ store }: CaseViewProps) {
    // CASE_EN.md's own "## Anchor index" section is a raw claim/evidence-id
    // lookup table — internal bundle plumbing, not reader-facing content.
    // It is dropped from the rendered markdown and replaced with the
    // AnchorIndex component, which renders the same anchors from
    // core.json/supplement.json with quotes and locators instead of ids.
    const { pre, post } = useMemo(
        () => splitAnchorIndexSection(store.bundle.caseMarkdown),
        [store.bundle.caseMarkdown]
    );
    const preHtml = useMemo(
        () => renderCaseMarkdown(pre, store.caseDef.anchorPattern),
        [pre, store.caseDef.anchorPattern]
    );
    const postHtml = useMemo(
        () => renderCaseMarkdown(post, store.caseDef.anchorPattern),
        [post, store.caseDef.anchorPattern]
    );

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
        const target = event.target as HTMLElement;
        const anchorButton = target.closest<HTMLElement>("[data-anchor]");
        if (!anchorButton) return;
        const anchor = anchorButton.dataset.anchor;
        if (anchor) {
            store.selectAnchor(anchor);

            // Removing the class and forcing style recalculation lets a
            // second click restart the CSS animation before the first run
            // has finished.
            anchorButton.classList.remove("anchor-flash");
            void anchorButton.offsetWidth;
            anchorButton.classList.add("anchor-flash");
        }
    };

    const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.classList.contains("anchor-flash")) {
            target.classList.remove("anchor-flash");
        }
    };

    return (
        <div className="case-view" onClick={handleClick} onAnimationEnd={handleAnimationEnd}>
            {/* CASE_EN.md is a repo-vendored, reviewed document, not user input. */}
            <div className="case-markdown" dangerouslySetInnerHTML={{ __html: preHtml }} />
            {post && <div className="case-markdown" dangerouslySetInnerHTML={{ __html: postHtml }} />}

            <details className="tech-footnote">
                <summary>Technical details — anchor index</summary>
                <AnchorIndex store={store} />
            </details>
        </div>
    );
});
