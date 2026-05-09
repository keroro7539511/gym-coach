import { describe, it, expect } from "vitest";
import { deriveBmi } from "./derive-bmi";

describe("deriveBmi", () => {
  it("計算標準體型 BMI", () => {
    // 70kg, 175cm → 22.86
    expect(deriveBmi(70, 175)).toBeCloseTo(22.86, 2);
  });

  it("身高為 0 時回傳 null", () => {
    expect(deriveBmi(70, 0)).toBeNull();
  });

  it("體重為 0 時回傳 null", () => {
    expect(deriveBmi(0, 175)).toBeNull();
  });

  it("身高或體重為負數時回傳 null", () => {
    expect(deriveBmi(-1, 175)).toBeNull();
    expect(deriveBmi(70, -1)).toBeNull();
  });
});
