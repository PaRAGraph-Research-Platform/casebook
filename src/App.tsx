import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { CASES, getCaseDefinition } from "./cases/registry";
import { CasebookStore, type CasebookTab } from "./stores/CasebookStore";
import { CaseView } from "./components/CaseView";
import { ExploreView } from "./components/ExploreView";
import { OperationsView } from "./components/OperationsView";
import { PositionsView } from "./components/PositionsView";
import { LevelsView } from "./components/LevelsView";
import { PassportView } from "./components/PassportView";
import { AboutView } from "./components/AboutView";
import { ArticleView } from "./components/ArticleView";
import { EvidencePanel } from "./components/EvidencePanel";
import { PROJECT_URL, REPO_URL } from "./config";

const TABS: Array<{ id: CasebookTab; label: string }> = [
    { id: "case", label: "Case" },
    { id: "explore", label: "Explore" },
    { id: "operations", label: "Findings" },
];

/** A case/anchor link clicked from the case-independent Article tab: applied
 * to the (possibly freshly created) CasebookStore once the reader's case
 * switch has taken effect — see the effect below. */
interface PendingArticleLink {
    caseId: string;
    anchor?: string;
}

export const App = observer(function App() {
    const [activeCaseId, setActiveCaseId] = useState(CASES[0].id);
    const [pendingArticleLink, setPendingArticleLink] = useState<PendingArticleLink | null>(null);

    // The bundle is a static, offline-imported artifact — loading it once
    // per store instance (not per render) belongs in the store's lifetime,
    // not in a MobX action; useMemo here is view lifecycle, not app state.
    // Keying on activeCaseId rebuilds the store (and so resets filters,
    // selection, and tab) whenever the reader switches cases.
    const store = useMemo(() => {
        const caseDef = getCaseDefinition(activeCaseId);
        return new CasebookStore(caseDef, caseDef.loadBundle());
    }, [activeCaseId]);

    // A link clicked from the Article tab may first need to switch the
    // active case (which rebuilds `store` above); only once that store is
    // for the right case can the Case tab + anchor selection be applied to
    // it — DOM/store-lifecycle sequencing, not app business state.
    useEffect(() => {
        if (!pendingArticleLink || pendingArticleLink.caseId !== activeCaseId) return;
        store.setActiveTab("case");
        if (pendingArticleLink.anchor) {
            store.selectAnchor(pendingArticleLink.anchor);
        }
        setPendingArticleLink(null);
    }, [pendingArticleLink, activeCaseId, store]);

    const handleArticleLink = (caseId: string, anchor?: string) => {
        setActiveCaseId(caseId);
        setPendingArticleLink({ caseId, anchor });
    };

    const tabs = [
        ...TABS,
        ...(store.caseDef.hasPositionsView ? [{ id: "positions" as const, label: "Positions" }] : []),
        ...(store.caseDef.hasLevelsView ? [{ id: "levels" as const, label: "Levels" }] : []),
        ...(store.caseDef.hasPassportView ? [{ id: "passport" as const, label: "Passport" }] : []),
        { id: "article" as const, label: "Article" },
        { id: "about" as const, label: "About" },
    ];

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-top">
                    <div className="app-brand">
                        <h1>PaRAGraph Casebook</h1>
                        <p className="app-brand-subtitle">Offline viewer &mdash; annotated claim casebook</p>
                    </div>
                    <div className="app-header-links">
                        <a className="header-link" href={REPO_URL} target="_blank" rel="noopener">
                            Source code &amp; data on GitHub
                        </a>
                        <a className="header-link" href={PROJECT_URL} target="_blank" rel="noopener">
                            About PaRAGraph
                        </a>
                        <button type="button" className="link-button" onClick={() => store.setActiveTab("about")}>
                            About this dataset
                        </button>
                    </div>
                </div>

                <nav className="case-switcher">
                    {CASES.map((c, index) => (
                        <button
                            key={c.id}
                            type="button"
                            className={activeCaseId === c.id ? "case-switch-button active" : "case-switch-button"}
                            onClick={() => setActiveCaseId(c.id)}
                        >
                            <span className="case-switch-number">{index + 1}</span>
                            {c.shortLabel}
                        </button>
                    ))}
                    <span className="case-switcher-title">{store.caseDef.title}</span>
                    <span className="case-switcher-subtitle">{store.caseDef.subtitle}</span>
                </nav>
            </header>

            <nav className="app-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        className={store.activeTab === tab.id ? "tab active" : "tab"}
                        onClick={() => store.setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <main className="app-main">
                <div className="app-content" key={`${activeCaseId}:${store.activeTab}`}>
                    {store.activeTab === "case" && <CaseView store={store} />}
                    {store.activeTab === "explore" && <ExploreView store={store} />}
                    {store.activeTab === "operations" && <OperationsView store={store} />}
                    {store.activeTab === "positions" && <PositionsView store={store} />}
                    {store.activeTab === "levels" && <LevelsView store={store} />}
                    {store.activeTab === "passport" && <PassportView store={store} />}
                    {store.activeTab === "about" && <AboutView />}
                    {store.activeTab === "article" && <ArticleView onOpenLink={handleArticleLink} />}
                </div>
                {store.activeTab !== "about" && store.activeTab !== "article" && (
                    <EvidencePanel store={store} key={activeCaseId} />
                )}
            </main>
        </div>
    );
});
