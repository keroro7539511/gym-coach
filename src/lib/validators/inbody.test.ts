import { describe, it, expect } from "vitest";
import { inbodyInputSchema } from "./inbody";

describe("inbodyInputSchema", () => {
  const valid = {
    studentId: 1,
    measuredAt: "2026-05-09",
    weightKg: 70,
    bodyFatPct: 18,
  };

  it("接受最少必填", () => {
    expect(() => inbodyInputSchema.parse(valid)).not.toThrow();
  });

  it("拒絕負體重", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, weightKg: -1 })
    ).toThrow();
  });

  it("體脂率超過 100% 觸發錯誤", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 101 })
    ).toThrow();
  });

  it("體脂率 0–100 之間都接受", () => {
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 0 })
    ).not.toThrow();
    expect(() =>
      inbodyInputSchema.parse({ ...valid, bodyFatPct: 50 })
    ).not.toThrow();
  });
});
