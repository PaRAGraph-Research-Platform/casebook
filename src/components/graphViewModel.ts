import type { CasebookStore } from "../stores/CasebookStore";
import { featureShortLabel } from "../utils/labels";
import type { GraphViewLink, GraphViewNode } from "./ForceGraph";

/** Maps raw graph node ids to short display labels: claim anchors (K1, S2,
 * A1, …), shortened feature names, source titles, the subgroup/group id.
 * Pure presentation derived from store data — not stored state itself. */
export function buildGraphViewModel(store: CasebookStore): {
    nodes: GraphViewNode[];
    links: GraphViewLink[];
} {
    const claimAnchorById = new Map<string, string>();
    for (const claim of store.combinedClaims) {
        claimAnchorById.set(claim.native.claim_id, claim.annotation.anchor);
    }

    const sourceTitleById = new Map(store.bundle.sources.map((s) => [s.document_id, s.title]));

    const graph = store.visibleGraph;
    const nodes: GraphViewNode[] = graph.nodes.map((node) => {
        let label = node.id;
        if (node.type === "Claim") {
            label = claimAnchorById.get(node.id) ?? node.id.slice(0, 10);
        } else if (node.type === "Evidence") {
            label = "evidence";
        } else if (node.type === "Feature") {
            label = featureShortLabel(node.id);
        } else if (node.type === "Source") {
            const title = sourceTitleById.get(node.id) ?? node.id;
            label = title.length > 24 ? `${title.slice(0, 24)}…` : title;
        } else if (node.type === "Subgroup" || node.type === "Group") {
            label = node.id;
        }
        return { id: node.id, type: node.type, label };
    });

    const links: GraphViewLink[] = graph.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
    }));

    return { nodes, links };
}
