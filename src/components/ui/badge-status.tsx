import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "live" | "completed" | "scheduled" | "warn" | "info" | "muted";

const variants: Record<Variant, { box: string; dot: string | null; pulse: boolean }> = {
  live: {
    box: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
    pulse: true,
  },
  completed: {
    box: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
    dot: null,
    pulse: false,
  },
  scheduled: {
    box: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    dot: null,
    pulse: false,
  },
  warn: {
    box: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    dot: null,
    pulse: false,
  },
  info: {
    box: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    dot: null,
    pulse: false,
  },
  muted: {
    box: "bg-zinc-800 border-zinc-700 text-zinc-400",
    dot: null,
    pulse: false,
  },
};

interface Props {
  variant: Variant;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: Props) {
  const v = variants[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-[0.15em] border",
        v.box,
        className
      )}
    >
      {v.dot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            v.dot,
            v.pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </span>
  );
}
