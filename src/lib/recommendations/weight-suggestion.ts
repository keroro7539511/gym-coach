export interface LastSetSnapshot {
  weightKg: number | null;
  rpe: number | null;
  toFailure: boolean;
}

/**
 * 規則 R2：依上次同動作最後一組決定下次建議重量
 *
 * - RPE ≤ 7 且未力竭 → +5%
 * - RPE 8–9 → 持平
 * - RPE = 10 或力竭 → −5%
 * - 從未做過 → 不建議（return null）
 *
 * 四捨五入到 2.5kg。
 */
export function suggestNextWeight(
  last: LastSetSnapshot | null
): number | null {
  if (!last) return null;
  if (last.weightKg == null || last.rpe == null) return null;

  let factor = 1; // 持平

  if (last.toFailure || last.rpe >= 10) {
    factor = 0.95;
  } else if (last.rpe <= 7) {
    factor = 1.05;
  }
  // 8 或 9 維持 1.0

  const raw = last.weightKg * factor;
  // 四捨五入到 2.5kg
  return Math.round(raw / 2.5) * 2.5;
}
