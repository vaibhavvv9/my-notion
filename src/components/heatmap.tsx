"use client";

import { cn } from "./ui";

const WEEKS = 18;

export function Heatmap({ today, days }: { today: number; days: Record<string, number> }) {
  const weekday = new Date().getDay(); // 0 = Sunday, today's row
  const start = today - weekday - (WEEKS - 1) * 7;
  const max = Math.max(1, ...Object.values(days));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)));
  const total = Object.values(days).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(days).filter(Boolean).length;
  const DAY = 86_400_000;

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1" role="img" aria-label={`${total} study actions over the last ${WEEKS} weeks`}>
        {Array.from({ length: WEEKS }).map((_, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }).map((_, d) => {
              const day = start + w * 7 + d;
              if (day > today) return <div key={d} className="size-[11px]" />;
              const n = days[day] ?? 0;
              const date = new Date(day * DAY + new Date().getTimezoneOffset() * 60_000);
              return (
                <div
                  key={d}
                  title={`${n} ${n === 1 ? "action" : "actions"} · ${date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`}
                  className={cn("size-[11px] rounded-[2px]", day === today && "ring-1 ring-fg/40")}
                  style={{ background: `var(--heat-${level(n)})` }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-faint">
        <span>
          {total} actions on {activeDays} {activeDays === 1 ? "day" : "days"}
        </span>
        <span className="flex items-center gap-1">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="size-[9px] rounded-[2px]" style={{ background: `var(--heat-${l})` }} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
