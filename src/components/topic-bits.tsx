"use client";

import { Check, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  CONFIDENCE_LABELS,
  DIFFICULTIES,
  DIFFICULTY_META,
  STATUSES,
  STATUS_META,
  type Difficulty,
  type Status,
} from "@/lib/constants";
import { dueLabel } from "@/lib/format";
import { MenuItem, Pill, Popover, cn } from "./ui";

export function StatusPill({ status }: { status: Status }) {
  return (
    <Pill tone={STATUS_META[status].tone} dot>
      {STATUS_META[status].label}
    </Pill>
  );
}

export function DifficultyPill({ difficulty }: { difficulty: Difficulty }) {
  return <Pill tone={DIFFICULTY_META[difficulty].tone}>{DIFFICULTY_META[difficulty].label}</Pill>;
}

export function StatusSelect({ value, onChange, align = "start" }: { value: Status; onChange: (s: Status) => void; align?: "start" | "end" }) {
  return (
    <Popover
      align={align}
      trigger={(p) => (
        <button type="button" {...p} aria-label={`Status: ${STATUS_META[value].label}`} className="rounded px-1 py-0.5 hover:bg-hover">
          <StatusPill status={value} />
        </button>
      )}
    >
      {(close) =>
        STATUSES.map((s) => (
          <MenuItem
            key={s}
            active={s === value}
            onClick={() => {
              close();
              if (s !== value) onChange(s);
            }}
            icon={s === value ? <Check /> : <span />}
          >
            <StatusPill status={s} />
          </MenuItem>
        ))
      }
    </Popover>
  );
}

export function DifficultySelect({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <Popover
      trigger={(p) => (
        <button type="button" {...p} aria-label={`Difficulty: ${DIFFICULTY_META[value].label}`} className="rounded px-1 py-0.5 hover:bg-hover">
          <DifficultyPill difficulty={value} />
        </button>
      )}
    >
      {(close) =>
        DIFFICULTIES.map((d) => (
          <MenuItem
            key={d}
            active={d === value}
            onClick={() => {
              close();
              if (d !== value) onChange(d);
            }}
            icon={d === value ? <Check /> : <span />}
          >
            <DifficultyPill difficulty={d} />
          </MenuItem>
        ))
      }
    </Popover>
  );
}

export function TagEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const commit = () => {
    const parts = text
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length) onChange(Array.from(new Set([...tags, ...parts])).slice(0, 20));
    setText("");
    setAdding(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-1 px-1">
      {tags.map((t) => (
        <Pill key={t} tone="purple" className="group/tag pr-0.5">
          <Link href={`/topics?tag=${encodeURIComponent(t)}`} className="hover:underline">
            {t}
          </Link>
          <button
            type="button"
            aria-label={`Remove tag ${t}`}
            onClick={() => onChange(tags.filter((x) => x !== t))}
            className="rounded p-0.5 opacity-50 hover:bg-black/10 hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        </Pill>
      ))}
      {adding ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              setText("");
              setAdding(false);
            }
          }}
          placeholder="tag, another"
          maxLength={64}
          className="h-5 w-28 rounded border border-line-strong bg-elevated px-1.5 text-xs outline-none focus:border-accent"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex h-5 items-center gap-0.5 rounded px-1 text-xs text-faint hover:bg-hover hover:text-muted"
        >
          <Plus className="size-3" /> {tags.length ? "" : "Add tag"}
        </button>
      )}
    </div>
  );
}

export function ConfidenceDots({ value, onChange, size = "md" }: { value: number | null; onChange?: (v: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-2" onMouseLeave={() => setHover(null)}>
      <div className="flex items-center gap-1" role={onChange ? "radiogroup" : undefined} aria-label="Confidence">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role={onChange ? "radio" : undefined}
            aria-checked={onChange ? value === n : undefined}
            aria-label={`${n} – ${CONFIDENCE_LABELS[n]}`}
            title={CONFIDENCE_LABELS[n]}
            disabled={!onChange}
            onMouseEnter={() => onChange && setHover(n)}
            onClick={() => onChange?.(n)}
            className={cn(
              "rounded-full transition-colors disabled:cursor-default",
              size === "sm" ? "size-2" : "size-3",
              n <= shown
                ? shown <= 2
                  ? "bg-[var(--red-fg)]"
                  : shown === 3
                    ? "bg-[var(--amber-fg)]"
                    : "bg-[var(--green-fg)]"
                : "bg-active",
              onChange && "cursor-pointer hover:scale-110",
            )}
          />
        ))}
      </div>
      {size === "md" && <span className="text-xs text-muted">{shown ? CONFIDENCE_LABELS[shown] : "Not rated"}</span>}
    </div>
  );
}

export function DueBadge({ ts }: { ts: number | null }) {
  const d = dueLabel(ts);
  return <Pill tone={d.overdue ? "red" : d.today ? "amber" : "gray"}>{d.label}</Pill>;
}
