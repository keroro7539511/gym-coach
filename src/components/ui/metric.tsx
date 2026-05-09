import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: ReactNode;
  label: string;
  suffix?: string;
  className?: string;
  accent?: boolean;
}

export function Metric({ value, label, suffix, className, accent = false }: Props) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-extrabold tracking-tight leading-none",
            "text-4xl md:text-5xl",
            accent ? "text-amber-500" : "text-foreground"
          )}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-sm text-amber-500 font-semibold">
            {suffix}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
