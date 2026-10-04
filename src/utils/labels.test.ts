import { describe, expect, it } from "vitest";
import type { SourceRecord } from "../types/bundle";
import {
    annotationProvenanceHint,
    authorUnitDisplay,
    comparabilityLabel,
    derivationLabel,
    operationCaveatAddition,
    operationQuestionLabel,
    operationStatusLabel,
    operationTitleLabel,
    originKindLabel,
    originMethodLabel,
    passportLinkMethodLabel,
    reviewStatusLabel,
    sourceAuthorsDisplay,
    sourceShortLabel,
} from "./labels";

function makeSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
    return {
        document_id: "doc-1",
        title: "A Very Long Title That Would Otherwise Be The Fallback Author Part",
        csl_data: {},
        annotation: { origin_kind: "native_export", rights: "not_cleared_for_public_redistribution" },
        ...overrides,
    };
}

describe("originKindLabel", () => {
    it("replaces internal origin_kind jargon with reader-facing labels", () => {
        expect(originKindLabel("curated_annotation")).toBe("Editorial note");
        expect(originKindLabel("native_export")).toBe("From graph");
        expect(originKindLabel("computed_view")).toBe("Computed");
    });

    it("falls back to the raw value for an unrecognized origin_kind", () => {
        expect(originKindLabel("something_new")).toBe("something_new");
    });
});

describe("operationStatusLabel", () => {
    it("rewrites the partially_native status into a plain-English sentence", () => {
        expect(operationStatusLabel("partially_native")).toBe("Partial: computed for the selected pair");
    });

    it("leaves other statuses (already plain English) untouched", () => {
        expect(operationStatusLabel("native")).toBe("native");
    });
});

describe("operationTitleLabel", () => {
    it("renames independent_bases to Distinct Textual Bases regardless of the bundle's own title_en", () => {
        expect(operationTitleLabel("independent_bases", "Independent Bases")).toBe("Distinct Textual Bases");
        expect(operationTitleLabel("independent_bases", "How many independent textual bases")).toBe(
            "Distinct Textual Bases"
        );
    });

    it("leaves every other operation's title untouched", () => {
        expect(operationTitleLabel("shared_basis", "Shared Basis")).toBe("Shared Basis");
    });
});

describe("operationQuestionLabel", () => {
    it("rewrites independent_bases' question to not promise scientific independence", () => {
        const rewritten = operationQuestionLabel(
            "independent_bases",
            "How many independent textual bases and how many sources stand behind the slice?"
        );
        expect(rewritten).toContain("distinct textual passages");
        expect(rewritten).toContain("source documents");
        expect(rewritten.toLowerCase()).not.toContain("independent");
    });

    it("leaves every other operation's question untouched", () => {
        const question = "How many shared_basis pairs exist?";
        expect(operationQuestionLabel("shared_basis", question)).toBe(question);
    });
});

describe("operationCaveatAddition", () => {
    it("adds a caveat against reading distinct bases as scholarly independence", () => {
        expect(operationCaveatAddition("independent_bases")).toBe(
            "Distinct passages and documents do not establish independence of the underlying research."
        );
    });

    it("returns null for operations with no such addition", () => {
        expect(operationCaveatAddition("shared_basis")).toBeNull();
    });
});

describe("originMethodLabel", () => {
    it("maps every origin_method to a reader-facing label, never calling model output editorial", () => {
        expect(originMethodLabel("native_export")).toBe("Platform record");
        expect(originMethodLabel("computed_view")).toBe("Computed view");
        expect(originMethodLabel("model_extracted")).toBe("Extracted by model");
        expect(originMethodLabel("editor_written")).toBe("Editorial note");
    });
});

describe("reviewStatusLabel", () => {
    it("maps review_status to a reader-facing badge label", () => {
        expect(reviewStatusLabel("unreviewed")).toBe("Not yet expert-reviewed");
        expect(reviewStatusLabel("expert_reviewed")).toBe("Expert-reviewed");
    });
});

describe("annotationProvenanceHint", () => {
    it("does not describe model-extracted content as editors' own work", () => {
        const hint = annotationProvenanceHint("model_extracted");
        expect(hint.toLowerCase()).not.toContain("added by the editors");
        expect(hint).toContain("automated extraction model");
    });

    it("falls back to the original editorial wording when origin_method is absent", () => {
        expect(annotationProvenanceHint(undefined)).toBe(
            "Labels added by the editors; native graph fields above are untouched."
        );
    });
});

describe("derivationLabel", () => {
    it("maps every derivation kind to a reader-facing label", () => {
        expect(derivationLabel("derived_from_schemes_layer")).toBe("Derived from source scheme records");
        expect(derivationLabel("editor_inferred_from_boundary_description")).toBe(
            "Editor's reading of a boundary description"
        );
        expect(derivationLabel("editor_written")).toBe("Editorial");
    });
});

describe("comparabilityLabel", () => {
    it("maps every current comparability value to a reader-facing label", () => {
        expect(comparabilityLabel("comparable_at_pian_level")).toBe("Comparable at the pian level");
        expect(comparabilityLabel("comparable_at_pian_level_as_a_proposal")).toBe(
            "Comparable at the pian level (proposed)"
        );
        expect(comparabilityLabel("comparable_at_pian_level_with_different_extent")).toBe(
            "Comparable at the pian level, with different extent"
        );
        expect(comparabilityLabel("not_comparable_without_curator_decision")).toBe(
            "Not comparable without a curator decision"
        );
        expect(comparabilityLabel("reported_only")).toBe("Reported only");
    });

    it("falls back to the raw value for a new comparability judgement", () => {
        expect(comparabilityLabel("new_judgement")).toBe("new_judgement");
    });
});

describe("sourceAuthorsDisplay / sourceShortLabel — library preferred over csl_data", () => {
    it("prefers library.authors (curator-checked) over csl_data.author when both are present", () => {
        const source = makeSource({
            library: { authors: ["Zhang, Shuangqing", "Zhuang, Chusheng"], publication_year: 2008 },
            csl_data: {
                author: [{ given: "Wrong", family: "CslOnly" }],
                issued: { "date-parts": [[1999]] },
            },
        });
        expect(sourceAuthorsDisplay(source)).toBe("Shuangqing Zhang; Chusheng Zhuang");
        expect(sourceShortLabel(source)).toBe("Zhang & Zhuang 2008");
    });

    it("abbreviates more than three library authors to the first three plus et al.", () => {
        const source = makeSource({
            library: {
                authors: ["Xiong, Zhenghui", "Zhang, Zhenxing", "Huang, Xing", "Someone, Else"],
                publication_year: 2012,
            },
        });
        expect(sourceAuthorsDisplay(source)).toBe("Zhenghui Xiong; Zhenxing Zhang; Xing Huang; et al.");
        expect(sourceShortLabel(source)).toBe("Xiong et al. 2012");
    });

    it("falls back to csl_data.author when the bundle carries no library field", () => {
        const source = makeSource({
            csl_data: {
                author: [{ given: "Anne", family: "Yue-Hashimoto" }],
                issued: { "date-parts": [[1991]] },
            },
        });
        expect(sourceAuthorsDisplay(source)).toBe("Anne Yue-Hashimoto");
        expect(sourceShortLabel(source)).toBe("Yue-Hashimoto 1991");
    });

    it("falls back to a shortened title when neither library nor csl_data carries an author", () => {
        const source = makeSource();
        expect(sourceAuthorsDisplay(source)).toBe("—");
        expect(sourceShortLabel(source)).toContain("…");
    });
});

describe("passportLinkMethodLabel", () => {
    it("maps each C4 passport link_method to its reader-facing label", () => {
        expect(passportLinkMethodLabel("by_locality_tag")).toBe("found by locality tag");
        expect(passportLinkMethodLabel("by_subgroup_address")).toBe("found via subgroup address");
        expect(passportLinkMethodLabel("none")).toBe("no matching record in the graph");
    });

    it("treats an absent link_method (a bundle from before this field existed) the same as none", () => {
        expect(passportLinkMethodLabel(undefined)).toBe("no matching record in the graph");
    });
});

describe("authorUnitDisplay", () => {
    it("shows the source's own naming and rank", () => {
        expect(authorUnitDisplay({ unit_as_written: "兩陽片", rank_as_written: "片" })).toBe(
            "Unit as named by the author: 兩陽片 (片)"
        );
    });

    it("appends the attribution when the source credits a third party for the naming", () => {
        expect(
            authorUnitDisplay({ unit_as_written: "兩陽片", rank_as_written: "片", attributed_to: "熊正辉 1987" })
        ).toBe("Unit as named by the author: 兩陽片 (片), as attributed to 熊正辉 1987 by this source");
    });

    it("omits the rank suffix when the source states no rank", () => {
        expect(authorUnitDisplay({ unit_as_written: "兩陽片" })).toBe("Unit as named by the author: 兩陽片");
    });
});
