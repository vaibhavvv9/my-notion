"use client";

import { HelpCircle, Search, Star, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_META, STATUSES, STATUS_META } from "@/lib/constants";
import { useTags, useTopics, useTree, useUpdateTopic } from "@/lib/hooks";
import { DifficultyPill, StatusSelect } from "./topic-bits";
import { Button, EmptyState, ErrorState, Input, Pill, Select, Skeleton } from "./ui";

export function Library() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tree = useTree();
  const tags = useTags();
  const update = useUpdateTopic();

  const f = {
    q: params.get("q") ?? "",
    trackId: params.get("trackId") ?? "",
    status: params.get("status") ?? "",
    difficulty: params.get("difficulty") ?? "",
    tag: params.get("tag") ?? "",
    pinned: params.get("pinned") === "1",
    sort: params.get("sort") ?? "",
  };
  const [q, setQ] = useState(f.q);
  useEffect(() => setQ(f.q), [f.q]);

  const set = (patch: Partial<Record<keyof typeof f, string | boolean>>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === false || v === undefined) next.delete(k);
      else next.set(k, v === true ? "1" : String(v));
    }
    const s = next.toString();
    router.replace(`${pathname}${s ? `?${s}` : ""}`, { scroll: false });
  };

  // Debounce search box into the URL
  useEffect(() => {
    if (q === f.q) return;
    const t = setTimeout(() => set({ q }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const { data, isLoading, error, refetch, isFetching } = useTopics({
    q: f.q || undefined,
    trackId: f.trackId || undefined,
    status: f.status || undefined,
    difficulty: f.difficulty || undefined,
    tag: f.tag || undefined,
    pinned: f.pinned || undefined,
    sort: f.sort || undefined,
  });
  const trackOf = (id: string) => tree.data?.tracks.find((t) => t.id === id);
  const parentOf = (id: string | null) => (id ? tree.data?.topics.find((t) => t.id === id) : undefined);
  const active = !!(f.q || f.trackId || f.status || f.difficulty || f.tag || f.pinned);

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">All topics</h1>
      <p className="mt-1 text-[15px] text-muted">Search and filter every topic and subtopic across your tracks.</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, summaries, tags…" className="pl-8" aria-label="Search topics" />
        </div>
        <Select
          label="Track"
          value={f.trackId}
          onChange={(v) => set({ trackId: v })}
          options={[{ value: "", label: "All tracks" }, ...(tree.data?.tracks ?? []).map((t) => ({ value: t.id, label: `${t.icon} ${t.name}` }))]}
        />
        <Select
          label="Status"
          value={f.status}
          onChange={(v) => set({ status: v })}
          options={[{ value: "", label: "Any status" }, ...STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]}
        />
        <Select
          label="Difficulty"
          value={f.difficulty}
          onChange={(v) => set({ difficulty: v })}
          options={[{ value: "", label: "Any level" }, ...DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_META[d].label }))]}
        />
        <Select
          label="Tag"
          value={f.tag}
          onChange={(v) => set({ tag: v })}
          options={[{ value: "", label: "Any tag" }, ...(tags.data ?? []).map((t) => ({ value: t.tag, label: `${t.tag} (${t.count})` }))]}
        />
        <Select
          label="Sort"
          value={f.sort}
          onChange={(v) => set({ sort: v })}
          options={[
            { value: "", label: "Roadmap order" },
            { value: "updated", label: "Recently edited" },
            { value: "title", label: "Title A–Z" },
            { value: "difficulty", label: "Difficulty" },
          ]}
        />
        <Button variant={f.pinned ? "primary" : "secondary"} icon={<Star className="size-3.5" />} onClick={() => set({ pinned: !f.pinned })} aria-pressed={f.pinned}>
          Favourites
        </Button>
      </div>

      <div className="mt-3 flex min-h-6 items-center gap-2 text-sm text-muted">
        {data && (
          <span>
            {data.length} {data.length === 1 ? "topic" : "topics"}
            {isFetching && " · updating…"}
          </span>
        )}
        {active && (
          <button className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-hover" onClick={() => router.replace(pathname)}>
            <X className="size-3" /> Clear filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="mt-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : data && data.length === 0 ? (
        <EmptyState className="mt-4" icon="🔎" title="No topics match" description="Try a different search or clear the filters." />
      ) : (
        <div className="mt-2 overflow-hidden rounded-lg border border-line">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_110px_120px] gap-3 border-b border-line bg-subtle px-3 py-2 text-xs font-medium text-muted md:grid">
            <span>Topic</span>
            <span>Track</span>
            <span>Difficulty</span>
            <span>Status</span>
          </div>
          {data?.map((t) => {
            const tr = trackOf(t.trackId);
            const parent = parentOf(t.parentId);
            return (
              <div
                key={t.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3 py-2 last:border-0 hover:bg-hover/50 md:grid-cols-[minmax(0,1fr)_160px_110px_120px]"
              >
                <Link href={`/topics/${t.id}`} className="flex min-w-0 items-center gap-2.5">
                  <span className="w-5 shrink-0 text-center">{t.icon || "📄"}</span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{t.title}</span>
                      {t.pinned && <Star className="size-3 shrink-0 fill-[var(--amber-fg)] text-[var(--amber-fg)]" />}
                    </span>
                    <span className="flex items-center gap-2 truncate text-xs text-muted">
                      {parent && <span className="truncate">in {parent.title}</span>}
                      <span className="flex items-center gap-0.5">
                        <HelpCircle className="size-3" /> {t.questionCount}
                      </span>
                      {t.tags.slice(0, 3).map((tag) => (
                        <Pill key={tag} tone="purple" className="!h-4 !text-[10px]">
                          {tag}
                        </Pill>
                      ))}
                    </span>
                  </span>
                </Link>
                <span className="hidden truncate text-sm text-muted md:block">
                  {tr?.icon} {tr?.name}
                </span>
                <span className="hidden md:block">
                  <DifficultyPill difficulty={t.difficulty} />
                </span>
                <span className="justify-self-end md:justify-self-start">
                  <StatusSelect align="end" value={t.status} onChange={(status) => update.mutate({ id: t.id, status })} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
