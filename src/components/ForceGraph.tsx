// Forked from the PaRAGraph platform's own ForceGraph component and cut down
// for this standalone viewer: no Next.js dynamic import, no next-themes, no
// MobX GraphStore coupling, no bucket/cluster layout (this graph has six
// simple node types and at most ~40 nodes, not a full KB skeleton). The
// paint/selection/hover approach is kept, everything else is new.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type LinkObject, type NodeObject } from "react-force-graph-2d";
import type { GraphEdgeRecord, GraphNodeRecord } from "../types/bundle";

export type GraphViewNodeType = GraphNodeRecord["type"];

export interface GraphViewNode {
    id: string;
    type: GraphViewNodeType;
    label: string;
}

export interface GraphViewLink {
    source: string;
    target: string;
    type: GraphEdgeRecord["type"];
}

/** Canvas colours are read from the theme tokens: canvas does not understand var(--…), and the theme can change at runtime. */
function readThemeColors(): { ink: string; surface: string } {
    const style = typeof window === "undefined" ? null : getComputedStyle(document.documentElement);
    return {
        ink: style?.getPropertyValue("--ink").trim() || "#17202f",
        surface: style?.getPropertyValue("--surface").trim() || "#fffdf9",
    };
}

function useThemeColors(): { ink: string; surface: string } {
    const [colors, setColors] = useState(readThemeColors);
    useEffect(() => {
        const media = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!media) return;
        const update = () => setColors(readThemeColors());
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);
    return colors;
}

export const NODE_COLORS: Record<GraphViewNodeType, string> = {
    Claim: "#b23b3b",
    Evidence: "#2f6f68",
    Feature: "#a9772a",
    Source: "#3b5170",
    Subgroup: "#4a7a9e",
    Group: "#7a4f6b",
};

const NODE_RADIUS: Record<GraphViewNodeType, number> = {
    Claim: 6,
    Evidence: 4,
    Feature: 7,
    Source: 8,
    Subgroup: 10,
    Group: 10,
};

interface ForceGraphViewProps {
    nodes: GraphViewNode[];
    links: GraphViewLink[];
    selectedNodeId: string | null;
    connectedNodeIds: Set<string>;
    /** Extra highlight ring (distinct from selection), used by the C1
     * Positions view to point at the claims a curated table row draws on. */
    highlightedNodeIds?: Set<string>;
    onNodeClick: (nodeId: string | null) => void;
}

type FGNode = NodeObject<GraphViewNode>;
type FGLink = LinkObject<GraphViewNode, GraphViewLink>;

/** react-force-graph mutates link.source/target from a plain id string into
 * the resolved node object once the simulation initializes; the static
 * GraphViewLink type only declares the pre-init string shape, so this reads
 * the id from either representation at runtime. */
function getLinkEndpointId(endpoint: unknown): string {
    if (endpoint !== null && typeof endpoint === "object" && "id" in endpoint) {
        return String((endpoint as { id?: unknown }).id);
    }
    return String(endpoint);
}

const EMPTY_HIGHLIGHT: Set<string> = new Set();

export function ForceGraphView({
    nodes,
    links,
    selectedNodeId,
    connectedNodeIds,
    highlightedNodeIds = EMPTY_HIGHLIGHT,
    onNodeClick,
}: ForceGraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const theme = useThemeColors();
    const fgRef = useRef<ForceGraphMethods<GraphViewNode, GraphViewLink> | undefined>(undefined);
    const [dimensions, setDimensions] = useState({ width: 800, height: 520 });
    // The first layout starts at the canvas origin (top-left) and only then
    // gets fitted; keep the canvas invisible until the engine has settled once
    // so the reader never sees the graph jump into place.
    const [settled, setSettled] = useState(false);

    const zoomToFit = useCallback(() => {
        fgRef.current?.zoomToFit(400, 48);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const update = () => {
            // Measure the container's own box (clientWidth excludes borders and
            // is not inflated by the canvas inside); ignore sub-pixel jitter so
            // the observer cannot feed the canvas size back into itself.
            const width = container.clientWidth || 800;
            const height = Math.max(container.clientHeight, 420);
            setDimensions((prev) =>
                Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1
                    ? prev
                    : { width, height }
            );
            // A resize doesn't restart the simulation (only new graph data
            // does), so re-fit explicitly once layout settles.
            window.requestAnimationFrame(zoomToFit);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(container);
        return () => observer.disconnect();
    }, [zoomToFit]);

    const graphData = useMemo(
        () => ({
            nodes: nodes.map((node) => ({ ...node })),
            links: links.map((link) => ({ ...link })),
        }),
        [nodes, links]
    );

    const isConnected = useCallback(
        (id: string) => connectedNodeIds.size === 0 || connectedNodeIds.has(id),
        [connectedNodeIds]
    );

    const paintNode = useCallback(
        (node: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const id = node.id ? String(node.id) : "";
            const radius = NODE_RADIUS[node.type];
            const connected = isConnected(id);
            const selected = id === selectedNodeId;
            const highlighted = highlightedNodeIds.has(id);

            ctx.globalAlpha = connected ? 1 : 0.2;
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI);
            ctx.fillStyle = NODE_COLORS[node.type];
            ctx.fill();

            if (highlighted) {
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#a9772a";
                ctx.stroke();
            }
            if (selected) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = theme.ink;
                ctx.stroke();
            }

            if (globalScale >= 1.1 || selected || highlighted) {
                const fontSize = 10 / globalScale;
                ctx.font = `${selected ? "600 " : ""}${fontSize}px system-ui, sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillStyle = theme.ink;
                ctx.fillText(node.label, node.x ?? 0, (node.y ?? 0) + radius + 2);
            }

            ctx.globalAlpha = 1;
        },
        [isConnected, selectedNodeId, highlightedNodeIds, theme.ink]
    );

    const linkColor = useCallback(
        (link: FGLink) => {
            const sourceId = getLinkEndpointId(link.source);
            const targetId = getLinkEndpointId(link.target);
            const highlighted = isConnected(sourceId) && isConnected(targetId);
            return highlighted ? "rgba(178, 59, 59, 0.5)" : "rgba(91, 100, 114, 0.3)";
        },
        [isConnected]
    );

    const handleNodeClick = useCallback(
        (node: FGNode) => {
            if (!node.id) return;
            onNodeClick(String(node.id));
        },
        [onNodeClick]
    );

    return (
        <div
            ref={containerRef}
            className="force-graph-container"
            style={{ opacity: settled ? 1 : 0, transition: "opacity 200ms ease-in" }}
        >
            <ForceGraph2D<GraphViewNode, GraphViewLink>
                ref={fgRef}
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor={theme.surface}
                nodeCanvasObject={paintNode}
                nodeLabel={(node) => `${node.type}: ${node.label}`}
                onNodeClick={handleNodeClick}
                onBackgroundClick={() => onNodeClick(null)}
                linkColor={linkColor}
                linkWidth={1}
                linkDirectionalParticles={0}
                // Finite, fairly aggressive settling: the simulation must
                // come to a full stop and the view must fix on the whole
                // graph, not keep drifting once idle.
                cooldownTicks={120}
                cooldownTime={4000}
                warmupTicks={30}
                d3AlphaDecay={0.05}
                d3VelocityDecay={0.35}
                onEngineStop={() => {
                    zoomToFit();
                    setSettled(true);
                }}
                enableZoomInteraction
                enablePanInteraction
                enableNodeDrag
                minZoom={0.3}
                maxZoom={5}
            />
        </div>
    );
}
