import { observer } from "mobx-react-lite";
import type { CasebookStore } from "../stores/CasebookStore";
import { comparabilityLabel, derivationLabel } from "../utils/labels";

interface PositionsViewProps {
    store: CasebookStore;
}

/**
 * C1-only curated "source — unit — membership — rank — comparability"
 * table (positions_table.json). Every row is an editorial reconstruction,
 * not a graph fact — labelled as such — and its comparability column is a
 * curator judgement. Clicking a row highlights the claims it draws on
 * (via their anchors) in the Explore graph.
 */
export const PositionsView = observer(function PositionsView({ store }: PositionsViewProps) {
    const table = store.bundle.positionsTable;

    if (!table) {
        return (
            <div className="positions-view">
                <p className="muted empty-state">No records in this slice.</p>
            </div>
        );
    }

    return (
        <div className="positions-view">
            <p className="muted positions-note">
                This table is a curated reconstruction. None of the correspondences between units of
                different sources is a native graph relation; positions are shown with their own
                source-specific scope. <span className="origin-badge curated">Editorial reconstruction</span>
            </p>

            <div className="table-scroll">
            <table className="operation-table positions-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Source</th>
                        <th>Unit</th>
                        <th>Membership</th>
                        <th>Rank as stated</th>
                        <th>Comparability</th>
                        <th>Unknowns</th>
                        <th>Anchors</th>
                    </tr>
                </thead>
                <tbody>
                    {table.rows.map((row, index) => (
                        <tr
                            key={`${row.position}-${row.source_key}-${index}`}
                            className="positions-row"
                            onClick={() => store.selectAnchors(row.anchors.split(","))}
                        >
                            <td>{row.position}</td>
                            <td>{row.source_en}</td>
                            <td>{row.unit}</td>
                            <td>{row.membership}</td>
                            <td>{row.rank_as_stated}</td>
                            <td>{comparabilityLabel(row.comparability)}</td>
                            <td>{row.unknowns}</td>
                            <td>{row.anchors}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            <details className="tech-footnote">
                <summary>Technical details — how each row was derived</summary>
                <div className="table-scroll">
                    <table className="operation-table">
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Source key</th>
                                <th>Derivation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.rows.map((row, index) => (
                                <tr key={`${row.position}-${row.source_key}-derivation-${index}`}>
                                    <td>{row.position}</td>
                                    <td>
                                        <code>{row.source_key}</code>
                                    </td>
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
