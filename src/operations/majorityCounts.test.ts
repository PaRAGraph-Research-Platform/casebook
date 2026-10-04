import { describe, expect, it } from "vitest";
import { loadC4Bundle } from "../data/loadBundle";
import { buildCombinedClaims } from "./combinedClaims";
import { countPairsByValue, countRecordsByValue } from "./majorityCounts";

const ALL_CLASSES = new Set(["A", "B", "C"]);

describe("majorityCounts (C4 control numbers)", () => {
    const bundle = loadC4Bundle();
    const claims = buildCombinedClaims(bundle.core, bundle.supplement);

    it("Xinyi: records lead with value 6 (15), pairs lead with value 8 (3 pairs)", () => {
        const byRecords = countRecordsByValue(claims, "XINYI", ALL_CLASSES);
        expect(byRecords[0]).toEqual({ value: "6", count: 15 });

        const byPairs = countPairsByValue(claims, "XINYI", ALL_CLASSES);
        expect(byPairs[0]).toEqual({ value: "8", count: 3 });
    });

    it("Taishan: records lead with value 6 (14), pairs tie at one each for 5/6/10", () => {
        const byRecords = countRecordsByValue(claims, "TAISHAN", ALL_CLASSES);
        expect(byRecords[0]).toEqual({ value: "6", count: 14 });

        const byPairs = countPairsByValue(claims, "TAISHAN", ALL_CLASSES);
        expect(byPairs).toHaveLength(3);
        expect(new Set(byPairs.map((c) => c.value))).toEqual(new Set(["5", "6", "10"]));
        expect(byPairs.every((c) => c.count === 1)).toBe(true);
    });

    it("Xinyi restricted to basis_review_class A only leaves values 9 and 8", () => {
        const classA = new Set(["A"]);
        const byRecords = countRecordsByValue(claims, "XINYI", classA);
        expect(new Set(byRecords.map((c) => c.value))).toEqual(new Set(["9", "8"]));
    });

    it("returns an empty array for a locality with no records at all", () => {
        expect(countRecordsByValue(claims, "NON_EXISTENT", ALL_CLASSES)).toEqual([]);
        expect(countPairsByValue(claims, "NON_EXISTENT", ALL_CLASSES)).toEqual([]);
    });

    it("does not let a records majority double as a pairs majority (detects broken 'count pairs like records' logic)", () => {
        // A record-count win does not imply a pair-count win for the same
        // value: Xinyi's value "6" wins by records (15) but not by pairs (1
        // pair, beaten by value "8"'s 3 pairs) — a naive implementation that
        // summed n_records per pair instead of counting distinct pairs would
        // make "6" win both columns.
        const byPairs = countPairsByValue(claims, "XINYI", ALL_CLASSES);
        const winner = byPairs[0];
        expect(winner.value).not.toBe("6");
    });
});
