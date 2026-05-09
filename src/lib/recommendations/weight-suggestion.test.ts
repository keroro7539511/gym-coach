import { describe, it, expect } from "vitest";
import { suggestNextWeight } from "./weight-suggestion";

describe("suggestNextWeight", () => {
  it("沒有歷史紀錄 → null", () => {
    expect(suggestNextWeight(null)).toBeNull();
  });

  it("RPE 6 未力竭 → +5%（四捨五入到 2.5kg）", () => {
    // 60kg * 1.05 = 63 → round to 62.5
    expect(
      suggestNextWeight({ weightKg: 60, rpe: 6, toFailure: false })
    ).toBe(62.5);
  });

  it("RPE 7 未力竭 → +5%", () => {
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 7, toFailure: false })
    ).toBe(85); // 80 * 1.05 = 84 → round to 85.0
  });

  it("RPE 8 → 持平", () => {
    expect(
      suggestNextWeight({ weightKg: 70, rpe: 8, toFailure: false })
    ).toBe(70);
  });

  it("RPE 9 → 持平", () => {
    expect(
      suggestNextWeight({ weightKg: 70, rpe: 9, toFailure: false })
    ).toBe(70);
  });

  it("RPE 10 → −5%", () => {
    // 80 * 0.95 = 76 → round to 75
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 10, toFailure: false })
    ).toBe(75);
  });

  it("RPE 7 但力竭 → −5%", () => {
    expect(
      suggestNextWeight({ weightKg: 80, rpe: 7, toFailure: true })
    ).toBe(75);
  });

  it("weightKg 為 null → null", () => {
    expect(
      suggestNextWeight({ weightKg: null, rpe: 7, toFailure: false })
    ).toBeNull();
  });

  it("rpe 為 null → null（資料不足）", () => {
    expect(
      suggestNextWeight({ weightKg: 60, rpe: null, toFailure: false })
    ).toBeNull();
  });
});
