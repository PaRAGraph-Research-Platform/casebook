import { observer } from "mobx-react-lite";
import type { CasebookStore } from "../stores/CasebookStore";
import type { PassportLinkMethod } from "../types/bundle";
import { passportLinkMethodLabel } from "../utils/labels";

interface PassportViewProps {
    store: CasebookStore;
}

/** One reader-facing summary sentence for the whole Passport tab (every
 * idiom's rows, not just the one on screen) — counted live from
 * `store.bundle.passports` rather than hardcoded, so it stays honest as the
 * underlying linkage data changes. */
function passportLinkageSummary(store: CasebookStore): string | null {
    const passports = store.bundle.passports;
    if (!passports) return null;
    let total = 0;
    let byLocality = 0;
    let bySubgroup = 0;
    for (const idiom of Object.values(passports)) {
        for (const entry of idiom.entries) {
            total += 1;
            if (entry.annotation.link_method === "by_locality_tag") byLocality += 1;
            else if (entry.annotation.link_method === "by_subgroup_address") bySubgroup += 1;
        }
    }
    if (total === 0) return null;
    const linked = byLocality + bySubgroup;
    return (
        `${linked} of ${total} passport rows resolve to records in this graph slice — ` +
        `${byLocality} by locality tag, ${bySubgroup} via subgroup address only; ` +
        `${total - linked} have no matching record.`
    );
}

/** Reader-facing label for a passport's idiom_tag key — this viewer's own
 * copy, not bundle data (the same convention as other hardcoded UI-label
 * maps in utils/labels.ts). */
const IDIOM_DISPLAY_LABELS: Record<string, string> = {
    CANTONESE_STD: "Guangzhou",
    TAISHAN: "Taishan",
    XINYI: "Xinyi",
};

function idiomLabel(idiomTag: string): string {
    return IDIOM_DISPLAY_LABELS[idiomTag] ?? idiomTag;
}

/**
 * C4-only curated tone-passport view: three hand-prepared passports
 * (Guangzhou/Taishan/Xinyi), each a table of source rows transcribed from a
 * supplied passport document — an editorial layer, not a native graph
 * export. A row's `annotation.link_method` says how (if at all) it was
 * matched to a record group in this graph slice — by the group's own native
 * locality tag, by falling back to a narrower subgroup working-address when
 * the group carries no locality tag, or not resolved at all — shown as its
 * own pill (`passportLinkMethodLabel`) rather than a flat linked/unlinked
 * split. A linked row is clickable (same "highlight in Explore" convention
 * as Positions/LevelsView) and lists its resolved anchors as their own
 * clickable chips; `linked_claim_note` (the curator's explanation of *how*
 * or *why not* a row resolved) sits in a closed per-row `<details>`, not the
 * main reading flow. The summary line above the table
 * (`passportLinkageSummary`) counts linkage across every idiom's rows live
 * from the bundle, never hardcoded.
 *
 * Several of this table's own descriptive columns (evidence type, locator,
 * and, for most rows, the contested-category/checked-tone-treatment columns)
 * were written in Russian in the source passport and carry no English twin,
 * so the public-projection sanitizer strips them on import — those cells
 * show "—" rather than a guessed or machine-translated value (the bundle's
 * PUBLIC_EXPORT.json lists exactly which fields were removed).
 */
export const PassportView = observer(function PassportView({ store }: PassportViewProps) {
    const passports = store.bundle.passports;

    if (!passports || Object.keys(passports).length === 0) {
        return (
            <div className="passport-view">
                <p className="muted empty-state">No records in this slice.</p>
            </div>
        );
    }

    const idioms = Object.keys(passports).sort();
    const activeIdiom = store.passportIdiom && passports[store.passportIdiom] ? store.passportIdiom : idioms[0];
    const passport = passports[activeIdiom];
    const summary = passportLinkageSummary(store);

    return (
        <div className="passport-view">
            <div className="passport-idiom-switcher">
                {idioms.map((idiom) => (
                    <button
                        key={idiom}
                        type="button"
                        className={idiom === activeIdiom ? "passport-idiom-button active" : "passport-idiom-button"}
                        onClick={() => store.setPassportIdiom(idiom)}
                    >
                        {idiomLabel(idiom)}
                    </button>
                ))}
            </div>

            <p className="muted passport-note">
                The passport is an expert annotation by K. A. Kozha{" "}
                <span className="origin-badge curated">Editorial note</span>: what each source counts, how it
                treats entering tones and contested categories, and what kind of evidence stands behind the
                number. Rows linked to the graph open their records; records, values and quotations themselves
                come from the graph.
            </p>

            {summary && <p className="passport-linkage-summary">{summary}</p>}

            <div className="table-scroll">
                <table className="operation-table passport-table">
                    <thead>
                        <tr>
                            <th>Source</th>
                            <th>Unit of count</th>
                            <th>Count</th>
                            <th>Entering tones</th>
                            <th>Contested category</th>
                            <th>Evidence type</th>
                            <th>Locator</th>
                            <th>Graph link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {passport.entries.map((entry) => {
                            const linkMethod: PassportLinkMethod = entry.annotation.link_method ?? "none";
                            const linked = linkMethod !== "none" && entry.annotation.claim_ids.length > 0;
                            const anchors = entry.annotation.anchors;
                            return (
                                <tr
                                    key={entry.entry_id}
                                    className={linked ? "passport-row passport-row-linked" : "passport-row"}
                                    onClick={linked ? () => store.selectAnchors(anchors) : undefined}
                                >
                                    <td>{entry.source_attribution_en ?? entry.source_attribution ?? "—"}</td>
                                    <td>{entry.counting_unit_en ?? entry.counting_unit ?? "—"}</td>
                                    <td>{entry.count_expression_en ?? entry.count_expression ?? "—"}</td>
                                    <td>{entry.checked_tone_treatment_en ?? entry.checked_tone_treatment ?? "—"}</td>
                                    <td>{entry.contested_category_en ?? entry.contested_category ?? "—"}</td>
                                    <td>{entry.evidence_type_en ?? entry.evidence_type ?? "—"}</td>
                                    <td>{entry.locator_en ?? entry.locator ?? "—"}</td>
                                    <td>
                                        <span className={linked ? "passport-link-pill linked" : "passport-link-pill"}>
                                            {passportLinkMethodLabel(linkMethod)}
                                        </span>
                                        {linked && anchors.length > 0 && (
                                            <span className="passport-anchor-chips">
                                                {anchors.map((anchor) => (
                                                    <button
                                                        key={anchor}
                                                        type="button"
                                                        className="anchor-link"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            store.selectAnchor(anchor);
                                                        }}
                                                    >
                                                        {anchor}
                                                    </button>
                                                ))}
                                            </span>
                                        )}
                                        {entry.annotation.linked_claim_note && (
                                            <details className="passport-row-note" onClick={(event) => event.stopPropagation()}>
                                                <summary>Note</summary>
                                                <p className="muted">{entry.annotation.linked_claim_note}</p>
                                            </details>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {passport.context_and_notes_markdown_en && (
                <section className="passport-context-notes">
                    <h3>Passport context notes</h3>
                    <p className="muted">{passport.context_and_notes_markdown_en}</p>
                </section>
            )}
        </div>
    );
});
