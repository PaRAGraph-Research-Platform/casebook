import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import type { CasebookStore } from "../stores/CasebookStore";
import { ForceGraphView, NODE_COLORS, type GraphViewNodeType } from "./ForceGraph";
import { buildGraphViewModel } from "./graphViewModel";

interface ExploreViewProps {
    store: CasebookStore;
}

const LEGEND_ORDER: GraphViewNodeType[] = ["Source", "Claim", "Evidence", "Feature", "Subgroup", "Group"];

export const ExploreView = observer(function ExploreView({ store }: ExploreViewProps) {
    const { nodes, links } = useMemo(() => buildGraphViewModel(store), [
        store,
        store.filters.sourceId,
        store.filters.feature,
        store.filters.target,
        store.filters.locality,
        store.filters.includeCuratedContext,
    ]);

    const counts = store.counts;
    const isEmpty = counts.claims === 0;
    const presentTypes = new Set(nodes.map((n) => n.type));
    const targets = useMemo(
        () => [...new Set(store.combinedClaims.map((c) => c.native.target))].sort(),
        [store]
    );

    return (
        <div className="explore-view">
            <div className="explore-filters">
                <label>
                    Source
                    <select
                        value={store.filters.sourceId ?? ""}
                        onChange={(event) =>
                            store.setFilters({ sourceId: event.target.value || null })
                        }
                    >
                        <option value="">All sources</option>
                        {store.bundle.sources.map((source) => (
                            <option key={source.document_id} value={source.document_id}>
                                {source.title}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Feature
                    <select
                        value={store.filters.feature ?? ""}
                        onChange={(event) => store.setFilters({ feature: event.target.value || null })}
                    >
                        <option value="">All features</option>
                        {store.bundle.nativeOperations.scope.features.map((feature) => (
                            <option key={feature} value={feature}>
                                {feature}
                            </option>
                        ))}
                    </select>
                </label>

                {store.caseDef.hasTargetFilter && (
                    <label>
                        Target
                        <select
                            value={store.filters.target ?? ""}
                            onChange={(event) => store.setFilters({ target: event.target.value || null })}
                        >
                            <option value="">All targets</option>
                            {targets.map((target) => (
                                <option key={target} value={target}>
                                    {target}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {store.caseDef.hasLocalityFilter && (
                    <label>
                        Locality
                        <select
                            value={store.filters.locality ?? ""}
                            onChange={(event) => store.setFilters({ locality: event.target.value || null })}
                        >
                            <option value="">All localities</option>
                            {store.localities.map((locality) => (
                                <option key={locality} value={locality}>
                                    {locality}
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {store.caseDef.hasCuratedContextToggle && (
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={store.filters.includeCuratedContext}
                            onChange={(event) =>
                                store.setFilters({ includeCuratedContext: event.target.checked })
                            }
                        />
                        Include curated context
                    </label>
                )}

                <button type="button" className="btn btn-ghost" onClick={() => store.reset()}>
                    Reset
                </button>
            </div>

            <p className="explore-hint muted">
                This graph shows how sources, statements and their supporting evidence connect: a{" "}
                <strong>Source</strong> document backs one or more <strong>Claim</strong> statements, each
                grounded in a passage of <strong>Evidence</strong> and tagged with the{" "}
                <strong>Feature</strong> it addresses. Click any node to inspect it in the Evidence panel;
                use the filters below to narrow the view.
            </p>

            <p className="explore-summary muted">
                This slice currently shows {counts.claims} statements, backed by {counts.evidence} pieces
                of evidence from {counts.sources} sources — {counts.nodes} nodes and {counts.edges}{" "}
                connections in total.
            </p>

            <div className="graph-legend">
                {LEGEND_ORDER.filter((type) => presentTypes.has(type)).map((type) => (
                    <span key={type} className="graph-legend-item">
                        <span className="graph-legend-swatch" style={{ background: NODE_COLORS[type] }} />
                        {type}
                    </span>
                ))}
            </div>

            {isEmpty ? (
                <p className="muted empty-state">No records in this slice.</p>
            ) : (
                <ForceGraphView
                    nodes={nodes}
                    links={links}
                    selectedNodeId={store.selectedNodeId}
                    connectedNodeIds={store.connectedNodeIds}
                    highlightedNodeIds={store.highlightedNodeIds}
                    onNodeClick={(nodeId) => store.selectNode(nodeId)}
                />
            )}
        </div>
    );
});
