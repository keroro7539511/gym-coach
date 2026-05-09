import type { Recommendation } from "@/lib/recommendations/basic-inbody";

const severityClass: Record<Recommendation["severity"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warn: "border-amber-200 bg-amber-50 text-amber-900",
  alert: "border-red-200 bg-red-50 text-red-900",
};

export function RecommendationCard({ recs }: { recs: Recommendation[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">基本建議</h3>
      {recs.map((r) => (
        <div
          key={r.key}
          className={`border rounded-md p-3 text-sm ${severityClass[r.severity]}`}
        >
          {r.text}
        </div>
      ))}
    </div>
  );
}
