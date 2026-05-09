import type { Recommendation } from "@/lib/recommendations/basic-inbody";

const variantStyle: Record<Recommendation["severity"], string> = {
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  warn: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  alert: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

const severityLabel: Record<Recommendation["severity"], string> = {
  info: "INFO",
  warn: "ADVICE",
  alert: "ALERT",
};

export function RecommendationCard({ recs }: { recs: Recommendation[] }) {
  return (
    <div className="rounded-xl border border-border bg-[var(--surface-2)] p-6">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        基本建議
      </h2>
      <div className="space-y-3">
        {recs.map((r) => (
          <div
            key={r.key}
            className={`rounded-md border px-4 py-3 text-sm ${variantStyle[r.severity]}`}
          >
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 opacity-80">
              {severityLabel[r.severity]}
            </div>
            <div className="text-foreground">{r.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
