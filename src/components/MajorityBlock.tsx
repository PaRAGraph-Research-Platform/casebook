import { observer } from "mobx-react-lite";
import type { CasebookStore, BasisReviewClass } from "../stores/CasebookStore";
import type { ValueCount } from "../operations/majorityCounts";
import { basisReviewClassLabel, localityLabel } from "../utils/labels";

interface MajorityBlockProps {
    store: CasebookStore;
}

const BASIS_CLASSES: BasisReviewClass[] = ["A", "B", "C"];

function MajorityColumn({ title, counts }: { title: string; counts: ValueCount[] }) {
    const max = Math.max(1, ...counts.map((c) => c.count));
    const topCount = counts[0]?.count ?? 0;
    return (
        <div className="majority-column">
            <h4>{title}</h4>
            {counts.length === 0 ? (
                <p className="muted">No records in this slice.</p>
            ) : (
                counts.map((entry) => (
                    <div
                        key={entry.value}
                        className={entry.count === topCount ? "majority-bar-row majority-winner" : "majority-bar-row"}
                    >
                        <span className="majority-bar-value">{entry.value}</span>
                        <span className="majority-bar-track">
                            <span
                                className="majority-bar-fill"
                                style={{ width: `${(entry.count / max) * 100}%` }}
                            />
                        </span>
                        <span className="majority-bar-count">{entry.count}</span>
                    </div>
                ))
            )}
        </div>
    );
}

/**
 * C4's "What does the majority say?" interactive block: for a chosen
 * locality, two columns — counting records vs. counting the technical
 * source-value pairs those records group into — each ranked by count with a
 * plain-CSS bar, the leader highlighted. Filter chips restrict both columns
 * to a chosen subset of the curated `basis_review_class` (A/B/C) review; all
 * counting logic lives in `operations/majorityCounts.ts` and
 * `CasebookStore.majorityCounts`, not in this component.
 */
export const MajorityBlock = observer(function MajorityBlock({ store }: MajorityBlockProps) {
    const { localities } = store;
    if (localities.length === 0) return null;

    const activeIdiom = store.majorityIdiom && localities.includes(store.majorityIdiom) ? store.majorityIdiom : localities[0];
    const counts = store.majorityCounts;

    return (
        <div className="majority-block">
            <h3>What does the majority say?</h3>
            <div className="majority-controls">
                <label>
                    Locality
                    <select value={activeIdiom} onChange={(event) => store.setMajorityIdiom(event.target.value)}>
                        {localities.map((locality) => (
                            <option key={locality} value={locality}>
                                {localityLabel(locality)}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="majority-basis-chips">
                    <span className="muted majority-chips-label">
                        Basis review <span className="origin-badge curated">Editorial note</span>
                    </span>
                    {BASIS_CLASSES.map((cls) => (
                        <button
                            key={cls}
                            type="button"
                            className={
                                store.majorityBasisClasses.has(cls)
                                    ? "majority-basis-chip active"
                                    : "majority-basis-chip"
                            }
                            title={basisReviewClassLabel(cls)}
                            onClick={() => store.toggleMajorityBasisClass(cls)}
                        >
                            {basisReviewClassLabel(cls)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="majority-columns">
                <MajorityColumn title="Counting records" counts={counts.byRecords} />
                <MajorityColumn title="Counting source–value pairs" counts={counts.byPairs} />
            </div>

            <p className="muted majority-caption">
                Pairs are a technical grouping (locality + document + value), not independent scholarly
                analyses — counting by independent analysis is not implemented; see the{" "}
                <code>count_independent_analyses</code> not-applicable card below.
            </p>
        </div>
    );
});
