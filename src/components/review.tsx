"use client";

import { CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { CONFIDENCE_LABELS } from "@/lib/constants";
import { useReviewTopic, useTopics, useTree } from "@/lib/hooks";
import type { TopicListItem } from "@/lib/types";
import { ConfidenceDots, DueBadge, StatusPill } from "./topic-bits";
import { EmptyState, ErrorState, PageSkeleton } from "./ui";

function ReviewRow({ t, trackIcon }: { t: TopicListItem; trackIcon?: string }) {
  const review = useReviewTopic();
  return (
    <li className="flex flex-col gap-2 border-b border-line px-3 py-2.5 last:border-0 sm:flex-row sm:items-center">
      <Link href={`/topics/${t.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="w-5 shrink-0 text-center">{t.icon || trackIcon || "📄"}</span>
        <span className="min-w-0">
          <span className="block truncate font-medium hover:underline">{t.title}</span>
          <span className="mt-0.5 flex items-center gap-2">
            <DueBadge ts={t.nextReviewAt} />
            <StatusPill status={t.status} />
            {t.confidence && <ConfidenceDots value={t.confidence} size="sm" />}
          </span>
        </span>
      </Link>
      <div className="flex items-center gap-1 pl-7 sm:pl-0">
        <span className="mr-1 text-xs text-faint">Revised? Rate it:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={review.isPending}
            onClick={() => review.mutate({ id: t.id, confidence: n })}
            title={CONFIDENCE_LABELS[n]}
            aria-label={`Confidence ${n}: ${CONFIDENCE_LABELS[n]}`}
            className="flex size-7 items-center justify-center rounded-md border border-line text-sm tabular-nums hover:bg-hover disabled:opacity-50"
          >
            {n}
          </button>
        ))}
      </div>
    </li>
  );
}

function Group({ title, hint, items, empty, trackIcon }: { title: string; hint: string; items: TopicListItem[]; empty: ReactNode; trackIcon: (id: string) => string | undefined }) {
  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        <span className="text-sm text-faint">{items.length}</span>
      </div>
      <p className="mb-3 text-sm text-muted">{hint}</p>
      {items.length ? (
        <ul className="rounded-lg border border-line">
          {items.map((t) => (
            <ReviewRow key={t.id} t={t} trackIcon={trackIcon(t.trackId)} />
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-line-strong px-4 py-5 text-sm text-faint">{empty}</p>
      )}
    </section>
  );
}

export function Review() {
  const { data, isLoading, error, refetch } = useTopics({});
  const tree = useTree();
  const trackIcon = (id: string) => tree.data?.tracks.find((t) => t.id === id)?.icon;

  const groups = useMemo(() => {
    const all = data ?? [];
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const endToday = end.getTime();
    const twoWeeks = endToday + 14 * 86_400_000;
    const scheduled = all.filter((t) => t.nextReviewAt).sort((a, b) => a.nextReviewAt! - b.nextReviewAt!);
    return {
      due: scheduled.filter((t) => t.nextReviewAt! <= endToday),
      upcoming: scheduled.filter((t) => t.nextReviewAt! > endToday && t.nextReviewAt! <= twoWeeks),
      weak: all.filter((t) => t.confidence !== null && t.confidence <= 2).sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0)),
      unrated: all.filter((t) => t.status === "completed" && t.confidence === null),
    };
  }, [data]);

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const nothing = !groups.due.length && !groups.upcoming.length && !groups.weak.length && !groups.unrated.length;

  return (
    <div className="mx-auto w-full max-w-4xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Revision</h1>
      <p className="mt-1 max-w-2xl text-[15px] text-muted">
        Spaced repetition for topics. After revising, rate your confidence from 1 to 5: shaky topics come back tomorrow, solid ones come back
        in a week or two, and the gap grows each time you nail it.
      </p>

      {nothing ? (
        <EmptyState
          className="mt-8"
          icon={<CalendarCheck2 />}
          title="Your revision queue is empty"
          description="Mark a topic as completed or log a revision on any topic page, and it will be scheduled here."
        />
      ) : (
        <>
          <Group title="Due now" hint="Overdue and due today. Clear these first." items={groups.due} empty="Nothing due today. Nice." trackIcon={trackIcon} />
          <Group title="Weak spots" hint="Topics you rated 1 or 2. Revisit the study guide and questions." items={groups.weak} empty="No weak topics flagged." trackIcon={trackIcon} />
          <Group title="Coming up" hint="Scheduled within the next two weeks." items={groups.upcoming} empty="Nothing scheduled in the next two weeks." trackIcon={trackIcon} />
          {groups.unrated.length > 0 && (
            <Group
              title="Completed, not yet rated"
              hint="Rate these so they're scheduled sensibly."
              items={groups.unrated}
              empty=""
              trackIcon={trackIcon}
            />
          )}
        </>
      )}
    </div>
  );
}
