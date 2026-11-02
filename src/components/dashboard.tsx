"use client";

import { ArrowRight, BookOpenCheck, CheckCircle2, Circle, Flame, Loader, Pin, Plus, Repeat, Star, Target } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ACTIVITY_LABEL, greeting, timeAgo } from "@/lib/format";
import { useDashboard, useTree } from "@/lib/hooks";
import type { LightTopic } from "@/lib/types";
import { TopicDialog } from "./dialogs";
import { Heatmap } from "./heatmap";
import { DifficultyPill, DueBadge, StatusPill } from "./topic-bits";
import { Button, ErrorState, ProgressBar, Skeleton, cn } from "./ui";

function Card({ title, icon, action, children, className }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-line p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold [&>svg]:size-4 [&>svg]:text-muted">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TopicLine({ t, right, trackIcon }: { t: LightTopic; right?: ReactNode; trackIcon?: string }) {
  return (
    <Link href={`/topics/${t.id}`} className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-hover">
      <span className="w-5 shrink-0 text-center">{t.icon || trackIcon || "📄"}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
      {right}
    </Link>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-3 text-sm text-faint">{children}</p>;
}

function Stat({ label, value, icon, hint }: { label: string; value: ReactNode; icon: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted [&>svg]:size-3.5">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-faint">{hint}</div>}
    </div>
  );
}

export function Dashboard() {
  const { data, isLoading, error, refetch } = useDashboard();
  const tree = useTree();
  const [creating, setCreating] = useState(false);
  const trackIcon = (id: string) => tree.data?.tracks.find((t) => t.id === id)?.icon;

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const now = new Date();
  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{greeting(now)}</h1>
          <p className="mt-1 text-[15px] text-muted">Here&apos;s where your interview preparation stands.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/practice">
            <Button icon={<BookOpenCheck className="size-4" />}>Practice</Button>
          </Link>
          <Button variant="primary" icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>
            New topic
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className={cn("h-28 rounded-xl", i > 3 && "h-48 sm:col-span-2")} />
          ))}
        </div>
      ) : (
        <>
          {/* Overall */}
          <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="col-span-2 rounded-xl border border-line p-4 lg:col-span-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Target className="size-3.5" /> Overall progress
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{data.overall.percent}%</span>
                <span className="text-xs text-faint">
                  {data.overall.completed} of {data.overall.total} topics
                </span>
              </div>
              <ProgressBar value={data.overall.percent} className="mt-3" />
            </div>
            <Stat
              label="Completed"
              icon={<CheckCircle2 className="text-[var(--green-fg)]" />}
              value={data.overall.completed}
              hint={`${data.overall.inProgress} in progress · ${data.overall.notStarted} not started`}
            />
            <Stat
              label="Questions mastered"
              icon={<BookOpenCheck />}
              value={
                <>
                  {data.questions.mastered}
                  <span className="text-base font-normal text-faint">/{data.questions.total}</span>
                </>
              }
              hint={`${data.questions.learning} still learning`}
            />
            <Stat
              label="Study streak"
              icon={<Flame className="text-[var(--amber-fg)]" />}
              value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`}
              hint={data.streak ? "Keep it going today" : "Study something today to start one"}
            />
          </div>

          {/* Tracks */}
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {data.tracks.map((t) => (
              <Link key={t.id} href={`/tracks/${t.id}`} className="group rounded-xl border border-line p-4 transition-colors hover:bg-hover/50">
                <div className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    <span className="text-lg">{t.icon}</span>
                    <span className="truncate">{t.name}</span>
                  </span>
                  <ArrowRight className="size-4 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-semibold tabular-nums">{t.percent}%</span>
                  <span className="text-xs text-muted">
                    {t.completed}/{t.total} done
                  </span>
                </div>
                {/* stacked bar: completed + in progress */}
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-hover">
                  <div className="bg-[var(--green-fg)] transition-[width] duration-500" style={{ width: `${t.total ? (t.completed / t.total) * 100 : 0}%` }} />
                  <div className="bg-[var(--blue-fg)] opacity-70 transition-[width] duration-500" style={{ width: `${t.total ? (t.inProgress / t.total) * 100 : 0}%` }} />
                </div>
                <div className="mt-2 flex gap-3 text-xs text-faint">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[var(--green-fg)]" />
                    {t.completed} completed
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-[var(--blue-fg)]" />
                    {t.inProgress} in progress
                  </span>
                </div>
              </Link>
            ))}
            {data.tracks.length === 0 && (
              <div className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted md:col-span-3">
                No tracks yet. Create one from the sidebar to get started.
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {/* Continue learning */}
            <Card
              title={data.continueLearning.length ? "Continue learning" : "Start here"}
              icon={data.continueLearning.length ? <Loader /> : <Circle />}
              className="lg:col-span-2"
            >
              {data.continueLearning.length > 0 ? (
                <div className="space-y-0.5">
                  {data.continueLearning.map((t) => (
                    <TopicLine
                      key={t.id}
                      t={t}
                      trackIcon={trackIcon(t.trackId)}
                      right={
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="hidden text-xs text-faint sm:inline">{timeAgo(t.lastViewedAt ?? t.lastStudiedAt)}</span>
                          <DifficultyPill difficulty={t.difficulty} />
                        </span>
                      }
                    />
                  ))}
                </div>
              ) : data.upNext.length > 0 ? (
                <>
                  <p className="mb-2 text-sm text-muted">Nothing in progress yet. Pick up the first topic of a track:</p>
                  <div className="space-y-0.5">
                    {data.upNext.map((t) => (
                      <TopicLine
                        key={t.id}
                        t={t}
                        trackIcon={trackIcon(t.trackId)}
                        right={
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="hidden text-xs text-faint sm:inline">{tree.data?.tracks.find((x) => x.id === t.trackId)?.name}</span>
                            <DifficultyPill difficulty={t.difficulty} />
                          </span>
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <Empty>Everything is completed. Time to revise!</Empty>
              )}
              {data.continueLearning.length > 0 && data.upNext.length > 0 && (
                <div className="mt-3 border-t border-line pt-3">
                  <p className="mb-1 text-xs font-medium text-faint">Up next in each track</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.upNext.map((t) => (
                      <Link key={t.id} href={`/topics/${t.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1 text-xs hover:bg-hover">
                        <span>{t.icon || trackIcon(t.trackId)}</span>
                        {t.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Revision */}
            <Card
              title="Due for revision"
              icon={<Repeat />}
              action={
                <Link href="/review" className="text-xs text-muted hover:text-fg hover:underline">
                  View all
                </Link>
              }
            >
              {data.dueReviews.length ? (
                <div className="space-y-0.5">
                  {data.dueReviews.map((t) => (
                    <TopicLine key={t.id} t={t} trackIcon={trackIcon(t.trackId)} right={<DueBadge ts={t.nextReviewAt} />} />
                  ))}
                </div>
              ) : (
                <Empty>Nothing due. Completing a topic or logging a revision schedules the next review automatically.</Empty>
              )}
            </Card>

            {/* Activity */}
            <Card title="Preparation activity" icon={<Flame />} className="lg:col-span-2">
              <Heatmap today={data.heatmap.today} days={data.heatmap.days} />
              {data.recentActivity.length > 0 && (
                <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
                  {data.recentActivity.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <span className="w-24 shrink-0 text-xs text-faint">{timeAgo(a.createdAt)}</span>
                      <span className="shrink-0 text-muted">{ACTIVITY_LABEL[a.kind] ?? a.kind}</span>
                      {a.topicId ? (
                        <Link href={`/topics/${a.topicId}`} className="truncate hover:underline">
                          {a.detail}
                        </Link>
                      ) : (
                        <span className="truncate">{a.detail}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {/* Weak topics */}
            <Card title="Weak spots" icon={<Target />}>
              {data.weak.length ? (
                <div className="space-y-0.5">
                  {data.weak.map((t) => (
                    <TopicLine
                      key={t.id}
                      t={t}
                      trackIcon={trackIcon(t.trackId)}
                      right={<span className="text-xs text-[var(--red-fg)]">{t.confidence}/5</span>}
                    />
                  ))}
                </div>
              ) : (
                <Empty>Rate your confidence on a topic (1–5). Anything at 2 or below shows up here.</Empty>
              )}
            </Card>

            {/* Recently studied */}
            <Card title="Recently studied" icon={<Loader />} className="lg:col-span-2">
              {data.recent.length ? (
                <div className="grid gap-x-6 sm:grid-cols-2">
                  {data.recent.map((t) => (
                    <TopicLine
                      key={t.id}
                      t={t}
                      trackIcon={trackIcon(t.trackId)}
                      right={<StatusPill status={t.status} />}
                    />
                  ))}
                </div>
              ) : (
                <Empty>Topics you open will appear here.</Empty>
              )}
            </Card>

            {/* Quick access */}
            <Card title="Quick access" icon={<Star />}>
              {data.pinnedTopics.length || data.pinnedNotes.length ? (
                <div className="space-y-0.5">
                  {data.pinnedTopics.map((t) => (
                    <TopicLine key={t.id} t={t} trackIcon={trackIcon(t.trackId)} right={<Star className="size-3.5 fill-[var(--amber-fg)] text-[var(--amber-fg)]" />} />
                  ))}
                  {data.pinnedNotes.map((n) => (
                    <Link
                      key={n.id}
                      href={`/topics/${n.topicId}?tab=notes&note=${n.id}`}
                      className="-mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-hover"
                    >
                      <Pin className="size-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1 truncate text-sm">{n.title}</span>
                      <span className="max-w-28 truncate text-xs text-faint">{n.topicTitle}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty>Star a topic or pin a note to keep it one click away.</Empty>
              )}
            </Card>
          </div>
        </>
      )}
      <TopicDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
