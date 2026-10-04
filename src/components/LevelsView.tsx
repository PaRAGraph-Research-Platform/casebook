import { observer } from "mobx-react-lite";
import type { CasebookStore } from "../stores/CasebookStore";
import type { LevelsTableRow } from "../types/bundle";
import { derivationLabel } from "../utils/labels";

interface LevelsViewProps {
    store: CasebookStore;
}

interface LevelNode {
    row: LevelsTableRow;
    children: LevelNode[];
}

/**
 * Nesting depth within a scheme, read off `level_term`'s own wording
 * rather than guessed from `contains`/`unit` text: the curator already
 * states each row's position in its scheme there (the group itself; a 區
 * one level above 片; a 片 directly under Yue in the single-cut Atlas
 * scheme; a 片 nested under a 區 in Yue-Hashimoto's two-level scheme).
 * Falls back to depth 0 (its own root) for a row this convention doesn't
 * describe, e.g. the cross-scheme row (handled separately, not through
 * this tree) or an earlier-edition summary row with no 區/片 wording.
 */
function levelDepth(levelTerm: string): number {
    if (levelTerm.includes("qu, one level above")) return 1;
    if (levelTerm.includes("directly under Yue")) return 1;
    if (levelTerm.includes("片 pian, under")) return 2;
    return 0;
}

/**
 * Turns a scheme's rows (already in the bundle's own row_id order, which
 * lists a parent immediately before its children) into a tree by depth,
 * the same way an outline is built from heading levels: each row becomes
 * a child of the most recent row at a shallower depth.
 */
function buildLevelTree(rows: LevelsTableRow[]): LevelNode[] {
    const roots: LevelNode[] = [];
    const stack: Array<{ node: LevelNode; depth: number }> = [];

    for (const row of rows) {
        const depth = levelDepth(row.level_term);
        const node: LevelNode = { row, children: [] };
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop();
        }
        if (stack.length === 0) {
            roots.push(node);
        } else {
            stack[stack.length - 1].node.children.push(node);
        }
        stack.push({ node, depth });
    }

    return roots;
}

function LevelRow({ node, store }: { node: LevelNode; store: CasebookStore }) {
    const { row } = node;
    return (
        <li className="levels-row">
            <button
                type="button"
                className="levels-row-button"
                onClick={() => store.selectAnchors(row.anchors.split(","))}
            >
                <span className="levels-row-unit">{row.unit}</span>
                <span className="levels-row-source muted">{row.source}</span>
                <span className="levels-row-detail muted">{row.contains}</span>
                {row.unknowns && <span className="levels-row-unknowns muted">{row.unknowns}</span>}
            </button>
            {node.children.length > 0 && (
                <ul className="levels-row-children">
                    {node.children.map((child) => (
                        <LevelRow key={child.row.row_id} node={child} store={store} />
                    ))}
                </ul>
            )}
        </li>
    );
}

/**
 * C3-only curated "levels" view: two level schemes (Atlas, cut once into
 * 片; Yue-Hashimoto, cut into 區 then 片 then 小片) shown side by side, plus
 * the one curated sentence that relates them to each other. None of this —
 * neither the column grouping nor the cross-scheme correspondence — is a
 * native graph relation; every row and the cross-scheme card carry their
 * own "Editorial reconstruction" badge, and clicking a row highlights the
 * claims it draws on in the Explore graph (same convention as C1's
 * PositionsView).
 */
export const LevelsView = observer(function LevelsView({ store }: LevelsViewProps) {
    const table = store.bundle.levelsTable;

    if (!table) {
        return (
            <div className="levels-view">
                <p className="muted empty-state">No records in this slice.</p>
            </div>
        );
    }

    const atlasRows = table.rows.filter((row) => row.scheme.startsWith("Language Atlas"));
    const yhRows = table.rows.filter((row) => row.scheme.startsWith("Yue-Hashimoto"));
    const crossRow = table.rows.find((row) => !row.scheme.startsWith("Language Atlas") && !row.scheme.startsWith("Yue-Hashimoto"));

    const atlasTree = buildLevelTree(atlasRows);
    const yhTree = buildLevelTree(yhRows);

    const crossPassage = table.cross_scheme_passage;
    const crossAnchors = crossRow ? crossRow.anchors.split(",") : [];

    return (
        <div className="levels-view">
            <p className="muted levels-note">
                {table.note_en} <span className="origin-badge curated">Editorial reconstruction</span>
            </p>

            <div className="levels-schemes-legend">
                {Object.entries(table.schemes_en).map(([key, description]) => (
                    <div key={key} className="levels-scheme-legend-item">
                        <strong>{key}</strong>
                        <span className="muted">{description}</span>
                    </div>
                ))}
            </div>

            <div className="levels-columns">
                <section className="levels-column">
                    <h3>Language Atlas of China</h3>
                    <ul className="levels-row-list">
                        {atlasTree.map((node) => (
                            <LevelRow key={node.row.row_id} node={node} store={store} />
                        ))}
                    </ul>
                </section>

                <div className="levels-columns-divider">
                    <span>approximate correspondence — editorial</span>
                </div>

                <section className="levels-column">
                    <h3>Yue-Hashimoto</h3>
                    <ul className="levels-row-list">
                        {yhTree.map((node) => (
                            <LevelRow key={node.row.row_id} node={node} store={store} />
                        ))}
                    </ul>
                </section>
            </div>

            {crossPassage && (
                <section className="levels-cross-scheme-card">
                    <h3>
                        Cross-scheme correspondence{" "}
                        <span className="origin-badge curated">Editorial reconstruction</span>
                    </h3>
                    <blockquote className="quote">{crossPassage.quote_en}</blockquote>
                    <p className="muted">{crossPassage.why_curated_en}</p>
                    <p className="levels-cross-scheme-locator muted">
                        {crossPassage.source_key}
                        {crossPassage.printed_page
                            ? `, printed p. ${crossPassage.printed_page}`
                            : crossPassage.physical_page
                              ? `, physical p. ${crossPassage.physical_page}`
                              : ""}
                    </p>
                    {crossAnchors.length > 0 && (
                        <button
                            type="button"
                            className="link-button"
                            onClick={() => store.selectAnchors(crossAnchors)}
                        >
                            Show related claims
                        </button>
                    )}
                </section>
            )}

            <section className="levels-non-claims">
                <h3>What this case does not claim</h3>
                <ul>
                    {table.explicit_non_claims_en.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </section>

            <details className="tech-footnote">
                <summary>Technical details — how each row was derived</summary>
                <div className="table-scroll">
                    <table className="operation-table">
                        <thead>
                            <tr>
                                <th>Row</th>
                                <th>Unit</th>
                                <th>Derivation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.rows.map((row) => (
                                <tr key={row.row_id}>
                                    <td>
                                        <code>{row.row_id}</code>
                                    </td>
                                    <td>{row.unit}</td>
                                    <td className="muted">{row.derivation ? derivationLabel(row.derivation) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
});
